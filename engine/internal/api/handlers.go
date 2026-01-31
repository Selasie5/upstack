// Defines the API routes for the application
package api

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"sync"

	"github.com/Selasie5/upstack/engine/internal/metadata"
	"github.com/Selasie5/upstack/engine/internal/storage"

	syncer "github.com/Selasie5/upstack/engine/internal/sync"
)

// Server bundles dependencies for handlers
type Server struct {
	meta      *metadata.InMemoryStore
	store     *storage.LocalObjectStore
	coord     *syncer.Coordinator
	uploadsMu sync.Mutex
	uploads   map[string]*UploadSession
}

type UploadSession struct {
	UploadID    string
	FileID      string
	BaseVersion int
	ChunkCount  int
	Received    map[int]bool
}

func NewServer(m *metadata.InMemoryStore, s *storage.LocalObjectStore, c *syncer.Coordinator) *Server {
	return &Server{
		meta:    m,
		store:   s,
		coord:   c,
		uploads: make(map[string]*UploadSession),
	}
}

func (s *Server) Router() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("/health", s.health)
	mux.HandleFunc("/upload/init", s.handleUploadInit)
	mux.HandleFunc("/upload/chunk", s.handleUploadChunk)
	mux.HandleFunc("/upload/commit", s.handleUploadCommit)
	mux.HandleFunc("/sync/changes", s.handleSyncChanges)
	mux.HandleFunc("/sync/ack", s.handleSyncAck)
	mux.HandleFunc("/download/file/", s.handleDownloadFile)
	mux.HandleFunc("/download/chunk", s.handleDownloadChunk)

	return mux
}

func (s *Server) health(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("ok"))
}

// UploadInitRequest: client posts to create an upload session
type UploadInitRequest struct {
	UploadID    string `json:"uploadId"`
	FileID      string `json:"fileId"`
	BaseVersion int    `json:"baseVersion"`
	ChunkCount  int    `json:"chunkCount"`
	Idempotency string `json:"idempotencyKey"`
}

func (s *Server) handleUploadInit(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method", http.StatusMethodNotAllowed)
		return
	}
	var req UploadInitRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "bad request", http.StatusBadRequest)
		return
	}
	// version check
	meta := s.meta.Get(req.FileID)
	if meta != nil && req.BaseVersion != meta.Version {
		w.WriteHeader(http.StatusConflict)
		_ = json.NewEncoder(w).Encode(map[string]interface{}{
			"error":         "VERSION_MISMATCH",
			"serverVersion": meta.Version,
		})
		return
	}

	// create session
	s.uploadsMu.Lock()
	s.uploads[req.UploadID] = &UploadSession{
		UploadID:    req.UploadID,
		FileID:      req.FileID,
		BaseVersion: req.BaseVersion,
		ChunkCount:  req.ChunkCount,
		Received:    make(map[int]bool),
	}
	s.uploadsMu.Unlock()

	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"uploadId": req.UploadID,
	})
}

// Upload chunk: PUT /upload/chunk?uploadId=...&index=...
func (s *Server) handleUploadChunk(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		http.Error(w, "method", http.StatusMethodNotAllowed)
		return
	}
	uploadID := r.URL.Query().Get("uploadId")
	idxStr := r.URL.Query().Get("index")
	if uploadID == "" || idxStr == "" {
		http.Error(w, "missing params", http.StatusBadRequest)
		return
	}
	index, err := strconv.Atoi(idxStr)
	if err != nil {
		http.Error(w, "bad index", http.StatusBadRequest)
		return
	}
	s.uploadsMu.Lock()
	sess, ok := s.uploads[uploadID]
	s.uploadsMu.Unlock()
	if !ok {
		http.Error(w, "no such upload", http.StatusNotFound)
		return
	}

	// Read body bytes
	tmpDir := filepath.Join(s.store.BasePath, "tmp", uploadID)
	if err := os.MkdirAll(tmpDir, 0o755); err != nil {
		http.Error(w, "cannot create tmp dir", http.StatusInternalServerError)
		return
	}
	outPath := filepath.Join(tmpDir, fmt.Sprintf("chunk-%d", index))
	outFile, err := os.Create(outPath)
	if err != nil {
		http.Error(w, "cannot create chunk", http.StatusInternalServerError)
		return
	}
	defer outFile.Close()
	if _, err := io.Copy(outFile, r.Body); err != nil {
		http.Error(w, "failed write chunk", http.StatusInternalServerError)
		return
	}

	// mark received
	s.uploadsMu.Lock()
	sess.Received[index] = true
	s.uploadsMu.Unlock()

	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(map[string]interface{}{"status": "received", "index": index})
}

// Commit: POST /upload/commit { "uploadId": "..."}
type CommitReq struct {
	UploadID string `json:"uploadId"`
}

func (s *Server) handleUploadCommit(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method", http.StatusMethodNotAllowed)
		return
	}
	var req CommitReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "bad request", http.StatusBadRequest)
		return
	}
	s.uploadsMu.Lock()
	sess, ok := s.uploads[req.UploadID]
	s.uploadsMu.Unlock()
	if !ok {
		http.Error(w, "no such upload", http.StatusNotFound)
		return
	}

	// ensure all chunks present
	for i := 0; i < sess.ChunkCount; i++ {
		if !sess.Received[i] {
			http.Error(w, fmt.Sprintf("missing chunk %d", i), http.StatusBadRequest)
			return
		}
	}

	// validate current version still same
	meta := s.meta.Get(sess.FileID)
	if meta != nil && meta.Version != sess.BaseVersion {
		w.WriteHeader(http.StatusConflict)
		_ = json.NewEncoder(w).Encode(map[string]interface{}{
			"error":         "VERSION_MISMATCH",
			"serverVersion": meta.Version,
		})
		return
	}

	// Promote chunks (move tmp -> files)
	if err := s.store.PromoteChunks(req.UploadID, sess.FileID, sess.ChunkCount); err != nil {
		http.Error(w, "promote failed: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Update metadata (simple increment version)
	newVersion := 1
	if meta == nil {
		s.meta.Create(sess.FileID, newVersion)
	} else {
		newVersion = meta.Version + 1
		s.meta.UpdateVersion(sess.FileID, newVersion)
	}

	// create sync event
	s.coord.AddEvent(sess.FileID, newVersion, "MODIFY")

	// cleanup session
	s.uploadsMu.Lock()
	delete(s.uploads, req.UploadID)
	s.uploadsMu.Unlock()

	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"status":     "committed",
		"newVersion": newVersion,
	})

	s.meta.UpdateChunkCount(sess.FileID, sess.ChunkCount)

}

// Sync changes: GET /sync/changes?sinceVersion=#
func (s *Server) handleSyncChanges(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query().Get("sinceVersion")
	since := 0
	if q != "" {
		if v, err := strconv.Atoi(q); err == nil {
			since = v
		}
	}
	events := s.coord.GetEventsSince(since)
	_ = json.NewEncoder(w).Encode(map[string]interface{}{"changes": events})
}

type SyncAck struct {
	ClientID string `json:"clientId"`
	Acks     []struct {
		FileID  string `json:"fileId"`
		Version int    `json:"version"`
	} `json:"acks"`
}

func (s *Server) handleSyncAck(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method", http.StatusMethodNotAllowed)
		return
	}
	var ack SyncAck
	if err := json.NewDecoder(r.Body).Decode(&ack); err != nil {
		http.Error(w, "bad request", http.StatusBadRequest)
		return
	}
	// For the skeleton we just log/ack
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(map[string]interface{}{"status": "ok"})
}

// GET /download/file/{fileId}
func (s *Server) handleDownloadFile(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method", http.StatusMethodNotAllowed)
		return
	}

	fileID := r.URL.Path[len("/download/file/"):]
	if fileID == "" {
		http.Error(w, "missing fileId", http.StatusBadRequest)
		return
	}

	meta := s.meta.Get(fileID)
	if meta == nil {
		http.Error(w, "file not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/octet-stream")
	w.Header().Set("Content-Disposition", "attachment; filename=\""+fileID+"\"")

	// Stream chunks sequentially
	for i := 0; i < meta.ChunkCount; i++ {
		rc, err := s.store.ReadChunk(fileID, i)
		if err != nil {
			http.Error(w, "failed reading chunk", http.StatusInternalServerError)
			return
		}
		_, _ = io.Copy(w, rc)
		rc.Close()
	}
}

// GET /download/chunk?fileId=...&index=...
func (s *Server) handleDownloadChunk(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method", http.StatusMethodNotAllowed)
		return
	}

	fileID := r.URL.Query().Get("fileId")
	indexStr := r.URL.Query().Get("index")

	if fileID == "" || indexStr == "" {
		http.Error(w, "missing params", http.StatusBadRequest)
		return
	}

	index, err := strconv.Atoi(indexStr)
	if err != nil {
		http.Error(w, "bad index", http.StatusBadRequest)
		return
	}

	rc, err := s.store.ReadChunk(fileID, index)
	if err != nil {
		http.Error(w, "chunk not found", http.StatusNotFound)
		return
	}
	defer rc.Close()

	w.Header().Set("Content-Type", "application/octet-stream")
	_, _ = io.Copy(w, rc)
}
