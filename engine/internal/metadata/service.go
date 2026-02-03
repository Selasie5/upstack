package metadata

import (
	"encoding/json"
	"fmt"
	"os"
	"sync"
	"time"

	"github.com/Selasie5/upstack/pkg/models"
)

// Store defines the interface for metadata persistence
type Store interface {
	GetFileByID(id string) (models.FileMetadata, bool)
	GetFileByPath(path string) (models.FileMetadata, bool)
	ListFiles() ([]models.FileMetadata, error)
	Upsert(meta models.FileMetadata) error

	// User Management
	GetUserByEmail(email string) (models.User, bool)
	GetUserByID(id string) (models.User, bool)
	UpsertUser(user models.User) error
}

// Service provides strong consistency for file metadata
type Service struct {
	store Store
}

func NewService(store Store) *Service {
	return &Service{store: store}
}

// ListFiles returns files available to userID (owned or shared)
func (s *Service) ListFiles(userID string) ([]models.FileMetadata, error) {
	all, err := s.store.ListFiles()
	if err != nil {
		return nil, err
	}
	var filtered []models.FileMetadata
	for _, f := range all {
		// Public/orphan files (OwnerID "") or Owned files or Shared files
		if f.OwnerID == "" || f.OwnerID == userID {
			filtered = append(filtered, f)
			continue
		}
		// Check access list
		for _, u := range f.SharedWith {
			if u == userID {
				filtered = append(filtered, f)
				break
			}
		}
	}
	return filtered, nil
}

// GetFile returns metadata for a file by path
func (s *Service) GetFileByPath(path string) (models.FileMetadata, bool) {
	return s.store.GetFileByPath(path)
}

// GetFileByID returns metadata for a file by ID
func (s *Service) GetFileByID(id string) (models.FileMetadata, bool) {
	return s.store.GetFileByID(id)
}

func (s *Service) GetUserByEmail(email string) (models.User, bool) {
	return s.store.GetUserByEmail(email)
}

func (s *Service) GetUserByID(id string) (models.User, bool) {
	return s.store.GetUserByID(id)
}

func (s *Service) UpsertUser(user models.User) error {
	return s.store.UpsertUser(user)
}

// CheckAndSet performs an atomic update with strong consistency checks
// userID is the actor performing the update
func (s *Service) CheckAndSet(meta models.FileMetadata, userID string) (models.FileMetadata, error) {
	// Conflict detection
	// 1. Check Path Collision
	if currentPathOwner, exists := s.store.GetFileByPath(meta.Path); exists {
		if currentPathOwner.ID != meta.ID {
			return models.FileMetadata{}, fmt.Errorf("path collision: %s is already used by %s", meta.Path, currentPathOwner.ID)
		}
	}

	// 2. Check Version Conflict and Ownership
	if current, exists := s.store.GetFileByID(meta.ID); exists {
		// Enforce Ownership: Only Owner can modify (simple model)
		// Or allow shared users to modify?
		// For MVP: Strictly Only Owner or if SharedWith contains user
		hasAccess := current.OwnerID == userID
		if !hasAccess {
			for _, u := range current.SharedWith {
				if u == userID {
					hasAccess = true
					break
				}
			}
		}
		if current.OwnerID != "" && !hasAccess { // If unowned (""), allow claim
			return models.FileMetadata{}, fmt.Errorf("permission denied: %s is not owner", userID)
		}

		if current.Version >= meta.Version {
			return current, fmt.Errorf("conflict: server version %d >= client version %d", current.Version, meta.Version)
		}

		// Preserve Original Owner if not sent
		if meta.OwnerID == "" {
			meta.OwnerID = current.OwnerID
		}
		// Preserve Shared list if not sent (or merge?)
		// For MVP assuming client sends full state or we preserve
		if len(meta.SharedWith) == 0 {
			meta.SharedWith = current.SharedWith
		}
	} else {
		// New File: Set Owner
		if userId := userID; userId != "" {
			meta.OwnerID = userId
		}
	}

	// Update
	meta.ModTime = time.Now()
	if err := s.store.Upsert(meta); err != nil {
		return models.FileMetadata{}, fmt.Errorf("failed to persist metadata: %v", err)
	}

	return meta, nil
}

// --- Local File Implementation ---

type FileBackedStore struct {
	mu        sync.RWMutex
	files     map[string]models.FileMetadata
	pathToID  map[string]string
	users     map[string]models.User
	emailToID map[string]string
	storePath string
}

func NewFileBackedStore(path string) *FileBackedStore {
	s := &FileBackedStore{
		files:     make(map[string]models.FileMetadata),
		pathToID:  make(map[string]string),
		users:     make(map[string]models.User),
		emailToID: make(map[string]string),
		storePath: path,
	}
	_ = s.load()
	return s
}

func (s *FileBackedStore) load() error {
	f, err := os.Open(s.storePath)
	if err != nil {
		if os.IsNotExist(err) {
			return nil
		}
		return err
	}
	defer f.Close()

	var data struct {
		Files map[string]models.FileMetadata `json:"files"`
		Users map[string]models.User         `json:"users"`
	}
	if err := json.NewDecoder(f).Decode(&data); err != nil {
		return err
	}

	for id, meta := range data.Files {
		s.files[id] = meta
		s.pathToID[meta.Path] = id
	}
	for id, user := range data.Users {
		s.users[id] = user
		s.emailToID[user.Email] = id
	}
	return nil
}

func (s *FileBackedStore) save() error {
	data := struct {
		Files map[string]models.FileMetadata `json:"files"`
		Users map[string]models.User         `json:"users"`
	}{
		Files: s.files,
		Users: s.users,
	}

	f, err := os.Create(s.storePath)
	if err != nil {
		return err
	}
	defer f.Close()

	return json.NewEncoder(f).Encode(data)
}

func (s *FileBackedStore) GetFileByID(id string) (models.FileMetadata, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	m, ok := s.files[id]
	return m, ok
}

func (s *FileBackedStore) GetFileByPath(path string) (models.FileMetadata, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	id, ok := s.pathToID[path]
	if !ok {
		return models.FileMetadata{}, false
	}
	m, ok := s.files[id]
	return m, ok
}

func (s *FileBackedStore) Upsert(meta models.FileMetadata) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.files[meta.ID] = meta
	s.pathToID[meta.Path] = meta.ID
	return s.save()
}

func (s *FileBackedStore) ListFiles() ([]models.FileMetadata, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	list := make([]models.FileMetadata, 0, len(s.files))
	for _, m := range s.files {
		list = append(list, m)
	}
	return list, nil
}

func (s *FileBackedStore) GetUserByEmail(email string) (models.User, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	id, ok := s.emailToID[email]
	if !ok {
		return models.User{}, false
	}
	u, ok := s.users[id]
	return u, ok
}

func (s *FileBackedStore) GetUserByID(id string) (models.User, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	u, ok := s.users[id]
	return u, ok
}

func (s *FileBackedStore) UpsertUser(user models.User) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.users[user.ID] = user
	s.emailToID[user.Email] = user.ID
	return s.save()
}
