package delta

import (
	"crypto/sha256"
	"encoding/hex"
	"io"
	"os"

	"github.com/Selasie5/upstack/pkg/models"
)

const ChunkSize = 4 * 1024 * 1024 // 4MB

// Generator handles file chunking logic
type Generator struct{}

// ComputeChunks reads the file and returns its metadata chunks (hashes, offsets)
// It does NOT load the whole file into memory.
func ComputeChunks(filePath string) (string, []models.Chunk, error) {
	file, err := os.Open(filePath)
	if err != nil {
		return "", nil, err
	}
	defer file.Close()

	fileHash := sha256.New()
	var chunks []models.Chunk
	buf := make([]byte, ChunkSize)
	index := 0
	var offset int64 = 0

	for {
		n, err := file.Read(buf)
		if n > 0 {
			chunkData := buf[:n]
			
			// Update full file hash
			fileHash.Write(chunkData)

			// Compute chunk hash
			sum := sha256.Sum256(chunkData)
			hashStr := hex.EncodeToString(sum[:])

			chunks = append(chunks, models.Chunk{
				Index:  index,
				Offset: offset,
				Size:   int64(n),
				Hash:   hashStr,
			})

			offset += int64(n)
			index++
		}
		if err == io.EOF {
			break
		}
		if err != nil {
			return "", nil, err
		}
	}

	fullFileHash := hex.EncodeToString(fileHash.Sum(nil))
	return fullFileHash, chunks, nil
}

// ReadChunk reads a specific chunk from the file
func ReadChunk(filePath string, offset, size int64) (io.ReadCloser, error) {
	f, err := os.Open(filePath)
	if err != nil {
		return nil, err
	}
	// SectionReader is perfect for this, but we need ReadCloser.
	// We can wrap it.
	if _, err := f.Seek(offset, 0); err != nil {
		f.Close()
		return nil, err
	}
	return &limitedReadCloser{
		r: io.LimitReader(f, size),
		c: f,
	}, nil
}

type limitedReadCloser struct {
	r io.Reader
	c io.Closer
}

func (l *limitedReadCloser) Read(p []byte) (n int, err error) {
	return l.r.Read(p)
}

func (l *limitedReadCloser) Close() error {
	return l.c.Close()
}
