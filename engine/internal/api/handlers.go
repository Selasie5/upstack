package api

import (
	"encoding/json"
	"io"
	"net/http"
	"strconv"

	"github.com/Selasie5/upstack/engine/internal/metadata"
	"github.com/Selasie5/upstack/engine/internal/storage"
	syncer "github.com/Selasie5/upstack/engine/internal/sync"
	"github.com/Selasie5/upstack/pkg/models"
)

// Server bundles dependencies for handlers
type Server struct {
	meta  *metadata.Service
	store storage.ChunkStore
	sync  *syncer.Service
}

func NewServer(m *metadata.Service, s storage.ChunkStore, sy *syncer.Service) *Server {
	return &Server{
		meta:  m,
		store: s,
		sync:  sy,
	}
}

func (s *Server) Router() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("/health", s.health)
	
	// Core Protocol
	mux.HandleFunc("/api/v1/files/check_chunks", s.handleCheckChunks) // Delta check
	mux.HandleFunc("/api/v1/files/upload_chunk", s.handleUploadChunk) // Upload binary
	mux.HandleFunc("/api/v1/files/metadata", s.handleUpdateMetadata)  // Commit
	mux.HandleFunc("/api/v1/changes", s.handlePollChanges)            // Poll
	mux.HandleFunc("/api/v1/files/download_chunk", s.handleDownloadChunk)
	mux.HandleFunc("/api/v1/files", s.handleListFiles) // New Endpoint
	mux.HandleFunc("/api/v1/files/share", s.handleShareFile) // Sharing Endpoint

	// Public
	// Note: In production, we would wrap this with:
	// return s.authMiddleware(mux)
	// For the demo/inspection as requested in the plan:
	return s.authMiddleware(mux)
}

func (s *Server) authMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/health" {
			next.ServeHTTP(w, r)
			return
		}
		// 04.2.6 Access Control / Authentication Check
		userID := r.Header.Get("X-User-ID")
		if userID == "" {
			http.Error(w, "Unauthorized: Missing X-User-ID header", http.StatusUnauthorized)
			return
		}
		// Pass userID to context if needed? For MVP assume explicit permissions check inside handlers or implicit owner.
		next.ServeHTTP(w, r)
	})
}

func (s *Server) health(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("ok"))
}

// handleCheckChunks takes a list of hashes and returns the ones we are missing
func (s *Server) handleCheckChunks(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	var hashes []string
	if err := json.NewDecoder(r.Body).Decode(&hashes); err != nil {
		http.Error(w, "bad request", http.StatusBadRequest)
		return
	}

	missing := make([]string, 0)
	for _, h := range hashes {
		if !s.store.HasChunk(h) {
			missing = append(missing, h)
		}
	}

	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(map[string]interface{}{"missing": missing})
}

// handleUploadChunk accepts a binary chunk with hash in query param
func (s *Server) handleUploadChunk(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	hash := r.URL.Query().Get("hash")
	if hash == "" {
		http.Error(w, "missing hash", http.StatusBadRequest)
		return
	}

	if err := s.store.WriteChunk(hash, r.Body); err != nil {
		http.Error(w, "failed to write: "+err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
}

// handleUpdateMetadata is the atomic commit
func (s *Server) handleUpdateMetadata(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	var meta models.FileMetadata
	if err := json.NewDecoder(r.Body).Decode(&meta); err != nil {
		http.Error(w, "bad request", http.StatusBadRequest)
		return
	}

	// Verify we have all chunks (simplified for MVP: just assume client is honest or check generic availability)
	// In prod, would verify existence of all meta.Chunks in s.store

	// 126: newMeta, err := s.meta.CheckAndSet(meta, r.Header.Get("X-User-ID"))
	
	newMeta, err := s.meta.CheckAndSet(meta, r.Header.Get("X-User-ID"))
	if err != nil {
		http.Error(w, err.Error(), http.StatusConflict) // Return 409 on conflict
		return
	}

	// Log event
	s.sync.LogEvent(models.EventFileUpdate, newMeta.ID, newMeta.Version)

	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(newMeta)
}

// ... existing code ...

// handleListFiles returns all files
func (s *Server) handleListFiles(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	userID := r.Header.Get("X-User-ID")
	files, err := s.meta.ListFiles(userID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]interface{}{"files": files})
}

// ShareRequest
type ShareRequest struct {
	ID        string `json:"id"`
	ShareWith string `json:"share_with"` 
}

// handleShareFile adds a user to the allowed list
func (s *Server) handleShareFile(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	var req ShareRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "bad request", http.StatusBadRequest)
		return
	}
	userID := r.Header.Get("X-User-ID")

	// 1. Get current metadata
	meta, exists := s.meta.GetFileByID(req.ID)
	if !exists {
		http.Error(w, "file not found", http.StatusNotFound)
		return
	}

	// 2. Check ownership
	if meta.OwnerID != userID {
		http.Error(w, "permission denied: only owner can share", http.StatusForbidden)
		return
	}

	// 3. Update SharedWith
	// Check if already shared
	alreadyShared := false
	for _, u := range meta.SharedWith {
		if u == req.ShareWith {
			alreadyShared = true
			break
		}
	}
	if !alreadyShared {
		meta.SharedWith = append(meta.SharedWith, req.ShareWith)
		meta.Version++ // Increment version for sync
		
		if _, err := s.meta.CheckAndSet(meta, userID); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		// Log event so the shared user (and owner) syncs the update
		s.sync.LogEvent(models.EventFileUpdate, meta.ID, meta.Version)
	}

	w.WriteHeader(http.StatusOK)
}
