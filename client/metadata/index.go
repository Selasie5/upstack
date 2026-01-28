// Local file tracking and metadata management for the client application
package metadata

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"io"
	"io/fs"
	"os"
	"path/filepath"
	"sync"
)

// FileMeta stores metadata about a single file in the sync folder.
type FileMeta struct {
	Path    string `json:"path"`
	Size    int64  `json:"size"`
	ModTime int64  `json:"mod_time"`
	Hash    string `json:"hash"`
	Version int    `json:"version"`
	State   string `json:"state"` // e.g. synced, modified, deleted, new
}

// Index is an in-memory index persisted to a JSON file on disk.
type Index struct {
	Root    string              `json:"-"`
	Path    string              `json:"-"` // path to the JSON store
	Entries map[string]FileMeta `json:"entries"`
	mu      sync.RWMutex        `json:"-"`
}

// NewIndex creates or loads an index stored at storePath. Root is the watched directory.
func NewIndex(root string, storePath string) (*Index, error) {
	idx := &Index{
		Root:    root,
		Path:    storePath,
		Entries: make(map[string]FileMeta),
	}
	if err := idx.load(); err != nil {
		if !os.IsNotExist(err) {
			return nil, err
		}
	}
	return idx, nil
}

func (i *Index) load() error {
	f, err := os.Open(i.Path)
	if err != nil {
		return err
	}
	defer f.Close()
	dec := json.NewDecoder(f)
	return dec.Decode(i)
}

// Save persists the index to disk atomically.
func (i *Index) Save() error {
	i.mu.RLock()
	defer i.mu.RUnlock()
	tmp := i.Path + ".tmp"
	f, err := os.Create(tmp)
	if err != nil {
		return err
	}
	enc := json.NewEncoder(f)
	enc.SetIndent("", "  ")
	if err := enc.Encode(i); err != nil {
		f.Close()
		return err
	}
	f.Close()
	return os.Rename(tmp, i.Path)
}

// Get returns the FileMeta for a path if present.
func (i *Index) Get(rel string) (FileMeta, bool) {
	i.mu.RLock()
	defer i.mu.RUnlock()
	m, ok := i.Entries[rel]
	return m, ok
}

// UpdateFromFS inspects the file at rel path (relative to index root) and updates the index entry.
func (i *Index) UpdateFromFS(rel string, info fs.FileInfo) (FileMeta, error) {
	full := filepath.Join(i.Root, rel)
	var hash string
	if info != nil && !info.IsDir() {
		h, err := fileHash(full)
		if err != nil {
			return FileMeta{}, err
		}
		hash = h
	}
	meta := FileMeta{
		Path:    rel,
		Size:    0,
		ModTime: 0,
		Hash:    hash,
		Version: 1,
		State:   "new",
	}
	if info != nil {
		meta.Size = info.Size()
		meta.ModTime = info.ModTime().Unix()
	}
	i.mu.Lock()
	defer i.mu.Unlock()
	// if exists, try to preserve version and state
	if old, ok := i.Entries[rel]; ok {
		if old.Hash == meta.Hash && old.ModTime == meta.ModTime && old.Size == meta.Size {
			meta = old
		} else {
			meta.Version = old.Version + 1
			meta.State = "modified"
		}
	}
	i.Entries[rel] = meta
	return meta, nil
}

// MarkDeleted marks a path as deleted in the index.
func (i *Index) MarkDeleted(rel string) {
	i.mu.Lock()
	defer i.mu.Unlock()
	if old, ok := i.Entries[rel]; ok {
		old.State = "deleted"
		old.Version = old.Version + 1
		i.Entries[rel] = old
	} else {
		i.Entries[rel] = FileMeta{Path: rel, State: "deleted", Version: 1}
	}
}

// WalkEntries returns a copy of the current entries map keys.
func (i *Index) WalkEntries() []string {
	i.mu.RLock()
	defer i.mu.RUnlock()
	keys := make([]string, 0, len(i.Entries))
	for k := range i.Entries {
		keys = append(keys, k)
	}
	return keys
}

func fileHash(path string) (string, error) {
	f, err := os.Open(path)
	if err != nil {
		return "", err
	}
	defer f.Close()
	h := sha256.New()
	if _, err := io.Copy(h, f); err != nil {
		return "", err
	}
	return hex.EncodeToString(h.Sum(nil)), nil
}

// Populate scans the root directory and ensures the index contains entries for all files.
func (i *Index) Populate() error {
	return filepath.WalkDir(i.Root, func(p string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if d.IsDir() {
			return nil
		}
		rel, err := filepath.Rel(i.Root, p)
		if err != nil {
			return err
		}
		info, err := d.Info()
		if err != nil {
			return err
		}
		_, err = i.UpdateFromFS(filepath.ToSlash(rel), info)
		return err
	})
}
