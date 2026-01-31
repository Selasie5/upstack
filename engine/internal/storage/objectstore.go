//Responsible for managing S3 storage interactions

package storage

import (
	"fmt"
	"io"
	"os"
	"path/filepath"
)

type LocalObjectStore struct {
	BasePath string
}

func NewLocalObjectStore(base string) *LocalObjectStore {
	_ = os.MkdirAll(base, 0o755)
	return &LocalObjectStore{BasePath: base}
}

// PromoteChunks moves from ./data/tmp/{uploadId}/chunk-i -> ./data/files/{fileId}/chunk-i
func (s *LocalObjectStore) PromoteChunks(uploadID, fileID string, chunkCount int) error {
	tmpDir := filepath.Join(s.BasePath, "tmp", uploadID)
	destDir := filepath.Join(s.BasePath, "files", fileID)
	if err := os.MkdirAll(destDir, 0o755); err != nil {
		return err
	}
	for i := 0; i < chunkCount; i++ {
		src := filepath.Join(tmpDir, fmt.Sprintf("chunk-%d", i))
		dst := filepath.Join(destDir, fmt.Sprintf("chunk-%d", i))
		if _, err := os.Stat(src); os.IsNotExist(err) {
			return fmt.Errorf("missing chunk %d", i)
		}
		// move (rename)
		if err := os.Rename(src, dst); err != nil {
			// fallback to copy
			if err := copyFile(src, dst); err != nil {
				return err
			}
			_ = os.Remove(src)
		}
	}
	_ = os.RemoveAll(tmpDir)
	return nil
}

func (s *LocalObjectStore) ReadChunk(fileID string, index int) (io.ReadCloser, error) {
	path := filepath.Join(s.BasePath, "files", fileID, fmt.Sprintf("chunk-%d", index))
	f, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	return f, nil
}

func copyFile(src, dst string) error {
	in, err := os.Open(src)
	if err != nil {
		return err
	}
	defer in.Close()
	out, err := os.Create(dst)
	if err != nil {
		return err
	}
	defer out.Close()
	_, err = io.Copy(out, in)
	return err
}
