package storage

import (
	"io"
	"os"
	"path/filepath"
)

type ChunkStore interface {
	HasChunk(hash string) bool
	WriteChunk(hash string, r io.Reader) error
	ReadChunk(hash string) (io.ReadCloser, error)
}

type LocalObjectStore struct {
	BasePath string
}

func NewLocalObjectStore(base string) *LocalObjectStore {
	_ = os.MkdirAll(base, 0o755)
	return &LocalObjectStore{BasePath: base}
}

// HasChunk checks if a chunk exists
func (s *LocalObjectStore) HasChunk(hash string) bool {
	path := filepath.Join(s.BasePath, "chunks", hash)
	_, err := os.Stat(path)
	return err == nil
}

// WriteChunk writes a chunk content to storage using its hash as filename
func (s *LocalObjectStore) WriteChunk(hash string, r io.Reader) error {
	dir := filepath.Join(s.BasePath, "chunks")
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return err
	}
	path := filepath.Join(dir, hash)
	if _, err := os.Stat(path); err == nil {
		// already exists
		return nil
	}
	// Write to temp file then rename for atomic write
	tmp := path + ".tmp"
	f, err := os.Create(tmp)
	if err != nil {
		return err
	}
	defer f.Close()
	if _, err := io.Copy(f, r); err != nil {
		return err
	}
	f.Close() // Flush
	return os.Rename(tmp, path)
}

func (s *LocalObjectStore) ReadChunk(hash string) (io.ReadCloser, error) {
	path := filepath.Join(s.BasePath, "chunks", hash)
	f, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	return f, nil
}
