package delta

const chunkSize = 4 * 1024 * 1024 // 4MB chunk size for delta transfers

type Chunk struct {
	Index int
	Data  []byte
	Hash  string
}
