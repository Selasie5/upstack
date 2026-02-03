// Responsible for the upload flow management
package sync

import "sync"

type SyncEvent struct {
	FileID  string `json:"fileId"`
	Version int    `json:"version"`
	Action  string `json:"action"`
}

type Coordinator struct {
	mu     sync.RWMutex
	events []SyncEvent
}

func NewCoordinator() *Coordinator {
	return &Coordinator{events: make([]SyncEvent, 0)}
}

func (c *Coordinator) AddEvent(fileID string, version int, action string) {
	c.mu.Lock()
	c.events = append(c.events, SyncEvent{FileID: fileID, Version: version, Action: action})
	c.mu.Unlock()
}

func (c *Coordinator) GetEventsSince(version int) []SyncEvent {
	c.mu.RLock()
	defer c.mu.RUnlock()
	out := make([]SyncEvent, 0)
	for _, e := range c.events {
		if e.Version > version {
			out = append(out, e)
		}
	}
	return out
}

