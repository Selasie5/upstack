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

func SplitFileIntoChunks(filePath string) error {
	file, err := os.Open(filePath)
	if err != nil {
		fmt.Println(err)
		return err
	}
	defer file.Close()
	buffer := make([]byte, chunkSize)
	var chunks []Chunk
	index := 0
	for {
		bytesRead, err := file.Read(buffer)
		if err != nil && err != io.EOF {
			return err
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
	return nil
}
