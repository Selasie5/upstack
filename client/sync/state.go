package sync

import (
	"sync"
	"time"
)

// SyncState represents the current state of the sync engine
// Maps to CPU Process States (OS Concepts Chapter 6)
type SyncState int

const (
	StateIdle SyncState = iota
	StateScanning
	StateDeciding
	StateUploading
	StateDownloading
	StateRetrying
	StateError
	StateSuccess
)

// String returns human-readable state name
func (s SyncState) String() string {
	return [...]string{
		"IDLE",
		"SCANNING",
		"DECIDING",
		"UPLOADING",
		"DOWNLOADING",
		"RETRYING",
		"ERROR",
		"SUCCESS",
	}[s]
}

// ChangeType represents the type of file change detected
type ChangeType int

const (
	ChangeCreate ChangeType = iota
	ChangeModify
	ChangeDelete
)

func (c ChangeType) String() string {
	return [...]string{"CREATE", "MODIFY", "DELETE"}[c]
}

// SyncAction represents the action to take for a file
type SyncAction int

const (
	ActionUpload SyncAction = iota
	ActionDownload
	ActionSkip
	ActionConflict
)

func (a SyncAction) String() string {
	return [...]string{"UPLOAD", "DOWNLOAD", "SKIP", "CONFLICT"}[a]
}

// FileChange represents a detected file system change
type FileChange struct {
	ID           string
	FilePath     string
	ChangeType   ChangeType
	LocalVersion int
	Timestamp    time.Time
	Retries      int
	Action       SyncAction
}

// ServerMetadata represents file metadata from server
type ServerMetadata struct {
	Version      int
	LastModified time.Time
	Size         int64
	Exists       bool
}

// Event represents a sync engine event
type Event struct {
	Type      string
	Timestamp time.Time
	Data      map[string]interface{}
}

// StateManager handles state transitions and notifications
type StateManager struct {
	mu        sync.RWMutex
	current   SyncState
	listeners []chan Event
}

// NewStateManager creates a new state manager
func NewStateManager() *StateManager {
	return &StateManager{
		current:   StateIdle,
		listeners: make([]chan Event, 0),
	}
}

// GetState returns current state (thread-safe)
func (sm *StateManager) GetState() SyncState {
	sm.mu.RLock()
	defer sm.mu.RUnlock()
	return sm.current
}

// TransitionTo changes state and notifies listeners
func (sm *StateManager) TransitionTo(newState SyncState, data map[string]interface{}) {
	sm.mu.Lock()
	oldState := sm.current
	sm.current = newState
	sm.mu.Unlock()

	// Notify listeners
	event := Event{
		Type:      "STATE_CHANGE",
		Timestamp: time.Now(),
		Data: map[string]interface{}{
			"old_state": oldState.String(),
			"new_state": newState.String(),
			"data":      data,
		},
	}
	sm.notify(event)
}

// Subscribe adds a listener channel for events
func (sm *StateManager) Subscribe() chan Event {
	sm.mu.Lock()
	defer sm.mu.Unlock()

	ch := make(chan Event, 100)
	sm.listeners = append(sm.listeners, ch)
	return ch
}

// notify sends event to all listeners (non-blocking)
func (sm *StateManager) notify(event Event) {
	sm.mu.RLock()
	defer sm.mu.RUnlock()

	for _, listener := range sm.listeners {
		select {
		case listener <- event:
		default:
			// Don't block if listener is slow
		}
	}
}

// Emit sends a custom event to listeners
func (sm *StateManager) Emit(eventType string, data map[string]interface{}) {
	event := Event{
		Type:      eventType,
		Timestamp: time.Now(),
		Data:      data,
	}
	sm.notify(event)
}