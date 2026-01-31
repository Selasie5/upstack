//Responsible for managing the file metadata

package metadata

import (
	"sync"
	"time"
)

type FileMetadata struct {
	FileID      string
	Version     int
	ChunkCount  int
	LastUpdated time.Time
}

type InMemoryStore struct {
	mu    sync.RWMutex
	files map[string]*FileMetadata
}

func NewInMemoryStore() *InMemoryStore {
	return &InMemoryStore{
		files: make(map[string]*FileMetadata),
	}
}

func (s *InMemoryStore) Get(fileID string) *FileMetadata {
	s.mu.RLock()
	defer s.mu.RUnlock()
	if f, ok := s.files[fileID]; ok {
		return &FileMetadata{
			FileID:      f.FileID,
			Version:     f.Version,
			ChunkCount:  f.ChunkCount,
			LastUpdated: f.LastUpdated,
		}
	}
	return nil
}

func (s *InMemoryStore) Create(fileID string, version int) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.files[fileID] = &FileMetadata{
		FileID:      fileID,
		Version:     version,
		LastUpdated: time.Now(),
	}
}

func (s *InMemoryStore) UpdateVersion(fileID string, version int) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if f, ok := s.files[fileID]; ok {
		f.Version = version
		f.LastUpdated = time.Now()
	} else {
		s.files[fileID] = &FileMetadata{
			FileID:      fileID,
			Version:     version,
			LastUpdated: time.Now(),
		}
	}
}

func (s *InMemoryStore) UpdateChunkCount(fileID string, count int) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if f, ok := s.files[fileID]; ok {
		f.ChunkCount = count
	}
}


