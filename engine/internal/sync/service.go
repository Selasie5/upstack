package sync

import (
	"encoding/json"
	"os"
	"sync"
	"time"

	"github.com/Selasie5/upstack/pkg/models"
)

// Service manages the event log for changes
type Service struct {
	mu          sync.RWMutex
	eventLog    []models.SyncEvent
	nextEventID int64
	storePath   string
}

func NewService(storePath string) *Service {
	s := &Service{
		eventLog:    make([]models.SyncEvent, 0),
		nextEventID: 1,
		storePath:   storePath,
	}
	_ = s.load()
	return s
}

func (s *Service) load() error {
	f, err := os.Open(s.storePath)
	if err != nil {
		if os.IsNotExist(err) {
			return nil
		}
		return err
	}
	defer f.Close()

	var data struct {
		Events      []models.SyncEvent `json:"events"`
		NextEventID int64              `json:"next_event_id"`
	}
	if err := json.NewDecoder(f).Decode(&data); err != nil {
		return err
	}
	s.eventLog = data.Events
	s.nextEventID = data.NextEventID
	return nil
}

func (s *Service) save() error {
	data := struct {
		Events      []models.SyncEvent `json:"events"`
		NextEventID int64              `json:"next_event_id"`
	}{
		Events:      s.eventLog,
		NextEventID: s.nextEventID,
	}

	f, err := os.Create(s.storePath)
	if err != nil {
		return err
	}
	defer f.Close()

	return json.NewEncoder(f).Encode(data)
}

// LogEvent adds a new event to the log
func (s *Service) LogEvent(eventType models.EventType, fileID string, version int64) {
	s.mu.Lock()
	defer s.mu.Unlock()

	event := models.SyncEvent{
		ID:        s.nextEventID,
		Timestamp: time.Now(),
		Type:      eventType,
		FileID:    fileID,
		Version:   version,
	}
	s.eventLog = append(s.eventLog, event)
	s.nextEventID++

	_ = s.save()
}

// PollChanges returns events strictly after lastKnownID
func (s *Service) PollChanges(lastKnownID int64) []models.SyncEvent {
	s.mu.RLock()
	defer s.mu.RUnlock()

	var newEvents []models.SyncEvent
	for _, event := range s.eventLog {
		if event.ID > lastKnownID {
			newEvents = append(newEvents, event)
		}
	}
	return newEvents
}
