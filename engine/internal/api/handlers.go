package api

import (
	"encoding/json"
	"io"
	"log"
	"net/http"
	"strconv"
	"strings"

	"github.com/Selasie5/upstack/engine/internal/email"
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
	auth  *AuthService
	email *email.Service
}

func NewServer(m *metadata.Service, s storage.ChunkStore, sy *syncer.Service, a *AuthService, e *email.Service) *Server {
	return &Server{
		meta:  m,
		store: s,
		sync:  sy,
		auth:  a,
		email: e,
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
	mux.HandleFunc("/api/v1/files", s.handleListFiles)       // New Endpoint
	mux.HandleFunc("/api/v1/files/share", s.handleShareFile) // Sharing Endpoint

	// Authentication
	mux.HandleFunc("/api/v1/auth/register", s.handleRegister)
	mux.HandleFunc("/api/v1/auth/login", s.handleLogin)

	// Public
	// Note: In production, we would wrap this with:
	// return s.authMiddleware(mux)
	// For the demo/inspection as requested in the plan:
	return s.corsMiddleware(s.authMiddleware(mux))
}

func (s *Server) corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "http://localhost:5173")
		w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, X-User-ID, Authorization")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func (s *Server) authMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/health" || r.URL.Path == "/api/v1/auth/login" || r.URL.Path == "/api/v1/auth/register" {
			next.ServeHTTP(w, r)
			return
		}

		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			http.Error(w, "Unauthorized: Authentication required", http.StatusUnauthorized)
			return
		}

		// Bearer <token>
		if len(authHeader) < 7 || authHeader[:7] != "Bearer " {
			http.Error(w, "Invalid auth header", http.StatusUnauthorized)
			return
		}

		token := authHeader[7:]
		userId, err := s.auth.VerifyToken(token)
		if err != nil {
			http.Error(w, "Unauthorized: "+err.Error(), http.StatusUnauthorized)
			return
		}

		r.Header.Set("X-User-ID", userId)
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

	log.Printf("Uploading chunk: %s", hash)
	if err := s.store.WriteChunk(hash, r.Body); err != nil {
		log.Printf("Error writing chunk %s: %v", hash, err)
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

// handlePollChanges returns events after a certain ID
func (s *Server) handlePollChanges(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	lastStr := r.URL.Query().Get("last")
	last, _ := strconv.ParseInt(lastStr, 10, 64)

	events := s.sync.PollChanges(last)
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]interface{}{"events": events})
}

// handleDownloadChunk retrieves binary data
func (s *Server) handleDownloadChunk(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	hash := r.URL.Query().Get("hash")
	if hash == "" {
		http.Error(w, "missing hash", http.StatusBadRequest)
		return
	}

	reader, err := s.store.ReadChunk(hash)
	if err != nil {
		http.Error(w, "not found", http.StatusNotFound)
		return
	}
	defer reader.Close()

	w.Header().Set("Content-Type", "application/octet-stream")
	_, _ = io.Copy(w, reader)
}

// handleListFiles returns all files
func (s *Server) handleListFiles(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	userID := r.Header.Get("X-User-ID")
	log.Printf("Listing files for user: %s", userID)
	files, err := s.meta.ListFiles(userID)
	if err != nil {
		log.Printf("Error listing files for %s: %v", userID, err)
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
	shareEmail := strings.ToLower(req.ShareWith)
	// Check if already shared
	alreadyShared := false
	for _, u := range meta.SharedWith {
		if u == shareEmail {
			alreadyShared = true
			break
		}
	}
	if !alreadyShared {
		meta.SharedWith = append(meta.SharedWith, shareEmail)
		meta.Version++ // Increment version for sync

		if _, err := s.meta.CheckAndSet(meta, userID); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		// Log event so the shared user (and owner) syncs the update
		s.sync.LogEvent(models.EventFileUpdate, meta.ID, meta.Version)

		// 4. Send Email Notification
		owner, _ := s.meta.GetUserByID(userID)
		ownerName := owner.Name
		if ownerName == "" {
			ownerName = userID
		}
		go s.email.SendShareNotification(shareEmail, meta.Path, ownerName)
	}

	w.WriteHeader(http.StatusOK)
}

func (s *Server) handleRegister(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	var req models.RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "bad request", http.StatusBadRequest)
		return
	}

	user, token, err := s.auth.Register(req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	_ = json.NewEncoder(w).Encode(models.AuthResponse{User: user, Token: token})
}

func (s *Server) handleLogin(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	var req models.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "bad request", http.StatusBadRequest)
		return
	}

	user, token, err := s.auth.Login(req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}

	_ = json.NewEncoder(w).Encode(models.AuthResponse{User: user, Token: token})
}
