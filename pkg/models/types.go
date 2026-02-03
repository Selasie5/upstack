package models

import "time"

// FileMetadata represents the state of a file in the system
type FileMetadata struct {
	ID        string    `json:"id" bson:"id"`
	Path      string    `json:"path" bson:"path"`
	OwnerID   string    `json:"owner_id" bson:"owner_id"` 
	SharedWith []string `json:"shared_with" bson:"shared_with"`
	Size      int64     `json:"size" bson:"size"`
	ModTime   time.Time `json:"mod_time" bson:"mod_time"`
	Version   int64     `json:"version" bson:"version"`   // Monotonic version number to detect conflicts
	Hash      string    `json:"hash" bson:"hash"`      // Full file hash (SHA-256)
	IsDeleted bool      `json:"is_deleted" bson:"is_deleted"`
	Chunks    []Chunk   `json:"chunks,omitempty" bson:"chunks,omitempty"` // List of chunks making up this file
}

// Chunk represents a piece of a file
type Chunk struct {
	Index  int    `json:"index"`
	Offset int64  `json:"offset"`
	Size   int64  `json:"size"`
	Hash   string `json:"hash"` // SHA-256 of the chunk content
}

// SyncEvent represents a change event that clients poll for
type SyncEvent struct {
	ID        int64     `json:"event_id"` // Global event sequence number
	Timestamp time.Time `json:"timestamp"`
	Type      EventType `json:"type"`     // UPLOAD, DELETE
	FileID    string    `json:"file_id"`
	Version   int64     `json:"version"`
}

type EventType string

const (
	EventFileUpdate EventType = "FILE_UPDATE"
	EventFileDelete EventType = "FILE_DELETE"
)

// ChangeLogResponse is the response for the polling endpoint
type ChangeLogResponse struct {
	LastEventID int64       `json:"last_event_id"`
	Events      []SyncEvent `json:"events"`
}

// UploadRequest is used when a client initiates an upload
type UploadRequest struct {
	Metadata FileMetadata `json:"metadata"`
}

// UploadResponse tells the client which chunks are missing
type UploadResponse struct {
	MissingChunks []string `json:"missing_chunks"` // List of chunk hashes that server needs
}
