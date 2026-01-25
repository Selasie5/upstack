package delta

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"io"
	"os"
)

const chunkSize = 4 * 1024 * 1024 // 4MB chunk size for delta transfers

type Chunk struct {
	Index int
	Data  []byte
	Hash  string
}

func SplitFileIntoChunks(filePath string) ([]Chunk, error) {
	file, err := os.Open(filePath)
	if err != nil {
		fmt.Println(err)
		return nil, err
	}
	defer file.Close()
	buffer := make([]byte, chunkSize)
	var chunks []Chunk
	index := 0
	for {
		bytesRead, err := file.Read(buffer)
		if err != nil && err != io.EOF {
			return nil, err
		}
		if bytesRead == 0 {
			break
		}
		fmt.Printf("Read chunk of size: %d\n", bytesRead)
		chunkData := make([]byte, bytesRead)
		copy(chunkData, buffer[:bytesRead])

		hash := sha256.Sum256(chunkData)
		hashStr := hex.EncodeToString(hash[:])

		chunk := Chunk{
			Index: index,
			Data:  chunkData,
			Hash:  hashStr,
		}

		chunks = append(chunks, chunk)
		index++
	}
	return chunks, nil
}

func CompareChunkHashes(local, remote []Chunk) []int {
	var changedIndexes []int
	maxLen := len(local)
	if len(remote) > maxLen {
		maxLen = len(remote)
	}
	for i := 0; i < maxLen; i++ {
		var localHash, remoteHash string
		if i < len(local) {
			localHash = local[i].Hash
		}
		if i < len(remote) {
			remoteHash = remote[i].Hash
		}
		if localHash != remoteHash {
			changedIndexes = append(changedIndexes, i)
		}
	}
	return changedIndexes
}
