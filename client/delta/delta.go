package delta

import (
	"crypto/sha256"
	"encoding/hex"
	"io"
	"os"
	"sync"
)

const ChunkSize = 4 * 1024 * 1024 // 4MB

// Chunk represents a file chunk with its hash and data
type Chunk struct {
	Hash string
	Data []byte
}

// DeltaManager manages delta sync, chunking, and atomic operations
type DeltaManager struct {
	mu sync.Mutex
	// Add fields for metadata and storage integration as needed
}

// ChunkFile splits a file into chunks, hashes them, and returns the list of chunks
func (dm *DeltaManager) ChunkFile(filePath string) ([]Chunk, error) {
	file, err := os.Open(filePath)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	var chunks []Chunk
	buf := make([]byte, ChunkSize)
	for {
		n, err := file.Read(buf)
		if n > 0 {
			chunkData := make([]byte, n)
			copy(chunkData, buf[:n])
			hash := sha256.Sum256(chunkData)
			chunks = append(chunks, Chunk{
				Hash: hex.EncodeToString(hash[:]),
				Data: chunkData,
			})
		}
		if err == io.EOF {
			break
		}
		if err != nil {
			return nil, err
		}
	}
	return chunks, nil
}

// AtomicWriteChunks persists chunks and updates metadata atomically
func (dm *DeltaManager) AtomicWriteChunks(chunks []Chunk, fileID string, updateMetadata func([]Chunk) error) error {
	dm.mu.Lock()
	defer dm.mu.Unlock()

	// 1. Persist all chunks (simulate storage, replace with actual storage logic)
	for range chunks {
		// TODO: Integrate with storage layer (e.g., upload to S3)
		// For now, simulate success
	}

	// 2. Update metadata atomically
	if err := updateMetadata(chunks); err != nil {
		// Rollback logic if needed
		return err
	}
	return nil
}

// Example usage: updateMetadata callback for atomicity
// In production, this would update the local or remote metadata index
func updateMetadataExample(chunks []Chunk) error {
	// TODO: Integrate with metadata/index.go
	return nil
}
