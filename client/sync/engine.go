package sync

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/Selasie5/upstack/client/delta"
	"github.com/Selasie5/upstack/client/metadata"
	"github.com/Selasie5/upstack/client/watcher"
	"github.com/Selasie5/upstack/pkg/models"
)

type Engine struct {
	BaseURL     string
	Client      *http.Client
	Watcher     *watcher.Watcher
	Index       *metadata.Index
	SyncDir     string
	LastEventID int64
	UserID      string
}

func NewEngine(baseURL, syncDir string, idx *metadata.Index) *Engine {
	// 5 second polling for changes suitable for demo
	w := watcher.NewWatcher(syncDir, idx, 1*time.Second) 
	return &Engine{
		BaseURL: baseURL,
		Client:  &http.Client{Timeout: 30 * time.Second},
		Watcher: w,
		Index:   idx,
		SyncDir: syncDir,
		UserID:  "client-1", // Default demo user
	}
}

func (e *Engine) Start() {
	log.Println("Starting Sync Engine...")
	e.Watcher.Start()

	// Handle local changes
	go func() {
		for event := range e.Watcher.Events {
			log.Printf("Detected local change: %v %s", event.Op, event.Path)
			if event.Op == watcher.Remove {
				// TODO: Handle delete (omitted for brevity in skeleton)
				continue
			}
			if err := e.uploadFile(event.Path); err != nil {
				log.Printf("Error uploading %s: %v", event.Path, err)
			}
		}
	}()

	// Poll remote changes
	go e.pollLoop()
}

func (e *Engine) uploadFile(relPath string) error {
	fullPath := filepath.Join(e.SyncDir, relPath)
	
	// 1. Chunk and Hash
	fullHash, chunks, err := delta.ComputeChunks(fullPath)
	if err != nil {
		return err
	}

	// 2. Check chunks
	chunkHashes := make([]string, len(chunks))
	for i, c := range chunks {
		chunkHashes[i] = c.Hash
	}
	missing, err := e.checkChunks(chunkHashes)
	if err != nil {
		return fmt.Errorf("check chunks: %w", err)
	}

	// 3. Upload missing chunks
	missingMap := make(map[string]bool)
	for _, m := range missing {
		missingMap[m] = true
	}

	for _, chunk := range chunks {
		if missingMap[chunk.Hash] {
			log.Printf("Uploading chunk %s (idx: %d)", chunk.Hash, chunk.Index)
			rc, err := delta.ReadChunk(fullPath, chunk.Offset, chunk.Size)
			if err != nil {
				return err
			}
			if err := e.uploadChunk(chunk.Hash, rc); err != nil {
				rc.Close()
				return err
			}
			rc.Close()
		}
	}

	// 4. Update Metadata
	info, _ := os.Stat(fullPath)
	meta := models.FileMetadata{
		ID:        e.generateFileID(relPath), // Simple mapping for MVP
		Path:      relPath,
		Size:      info.Size(),
		ModTime:   info.ModTime(),
		Version:   time.Now().UnixNano(), // Simple versioning for MVP collision avoidance
		Hash:      fullHash,
		Chunks:    chunks,
	}

	return e.commitMetadata(meta)
}

func (e *Engine) pollLoop() {
	ticker := time.NewTicker(3 * time.Second)
	for range ticker.C {
		events, err := e.fetchChanges()
		if err != nil {
			log.Printf("Poll error: %v", err)
			continue
		}
		for _, event := range events {
			if event.ID > e.LastEventID {
				// Check if this is our own change (skip)
				// For valid demo, we ideally check if we just uploaded this version.
				// Simplified: if file exists and hash matches, skip.
				
				if event.Type == models.EventFileUpdate {
					e.handleRemoteUpdate(event.FileID)
				}
				e.LastEventID = event.ID
			}
		}
	}
}

func (e *Engine) handleRemoteUpdate(fileID string) {
	// Get Metadata
	// Note: We need a client.GetFileMetadata endpoint or similar.
	// For skeleton, assuming we have the metadata in the event or fetch separate.
	// Let's assume we fetch it (not implemented in skeleton for brevity, but critical flow explained).
	log.Printf("Remote update for %s", fileID)
	// Flow:
	// meta := e.getMetadata(fileID)
	// if local file exists and hash == meta.Hash { return }
	// download missing chunks
	// reconstruct
}

// HTTP Helpers

func (e *Engine) checkChunks(hashes []string) ([]string, error) {
	body, _ := json.Marshal(hashes)
	req, err := http.NewRequest("POST", e.BaseURL+"/api/v1/files/check_chunks", bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-User-ID", e.UserID)
	
	resp, err := e.Client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	
	var res map[string][]string
	if err := json.NewDecoder(resp.Body).Decode(&res); err != nil {
		return nil, err
	}
	return res["missing"], nil
}

func (e *Engine) uploadChunk(hash string, data io.Reader) error {
	// Post raw binary
	req, err := http.NewRequest("POST", e.BaseURL+"/api/v1/files/upload_chunk?hash="+hash, data)
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/octet-stream")
	req.Header.Set("X-User-ID", e.UserID)

	resp, err := e.Client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode != 200 {
		return fmt.Errorf("status %d", resp.StatusCode)
	}
	return nil
}

func (e *Engine) commitMetadata(meta models.FileMetadata) error {
	body, _ := json.Marshal(meta)
	req, err := http.NewRequest("POST", e.BaseURL+"/api/v1/files/metadata", bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-User-ID", e.UserID)

	resp, err := e.Client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode != 200 {
		b, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("status %d: %s", resp.StatusCode, string(b))
	}
	return nil
}

func (e *Engine) fetchChanges() ([]models.SyncEvent, error) {
	req, err := http.NewRequest("GET", fmt.Sprintf("%s/api/v1/changes?since=%d", e.BaseURL, e.LastEventID), nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("X-User-ID", e.UserID)

	resp, err := e.Client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	var res models.ChangeLogResponse
	if err := json.NewDecoder(resp.Body).Decode(&res); err != nil {
		return nil, err
	}
	return res.Events, nil
}

func (e *Engine) generateFileID(path string) string {
	// In a real app, this might be a UUID assigned by server on creation.
	// For this MVP/Demo, using a deterministic hash of the path is stable.
	// But note: Rename support requires stable IDs independent of path.
	// We'll stick to simple path-hashing for now.
	return fmt.Sprintf("%x", path) // Not real hash, just string hex? No.
	// Just use path as string if ID is string?
	// But ID should be unique.
	// Let's use simple string logic
	return path // Simplified: Path is ID.
}
