//Defines the file watcher functionality for the client application

package watcher

import (
	"context"
	"io/fs"
	"path/filepath"
	"time"

	"github.com/Selasie5/upstack/client/metadata"
)

// Op describes the type of file change detected.
type Op int

const (
	Create Op = iota
	Modify
	Remove
)

// Event describes a single file change.
type Event struct {
	Path string
	Op   Op
}

// Watcher polls the filesystem and updates the metadata index.
type Watcher struct {
	Root   string
	Index  *metadata.Index
	Period time.Duration
	Ctx    context.Context
	Cancel context.CancelFunc
	Events chan Event
}

// NewWatcher creates a new polling watcher. period=0 defaults to 1s.
func NewWatcher(root string, idx *metadata.Index, period time.Duration) *Watcher {
	if period <= 0 {
		period = time.Second
	}
	ctx, cancel := context.WithCancel(context.Background())
	return &Watcher{
		Root:   root,
		Index:  idx,
		Period: period,
		Ctx:    ctx,
		Cancel: cancel,
		Events: make(chan Event, 100),
	}
}

// Start begins polling in a background goroutine.
func (w *Watcher) Start() {
	go func() {
		ticker := time.NewTicker(w.Period)
		defer ticker.Stop()
		for {
			select {
			case <-w.Ctx.Done():
				close(w.Events)
				return
			case <-ticker.C:
				_ = w.scanOnce()
			}
		}
	}()
}

// Stop cancels the watcher.
func (w *Watcher) Stop() {
	w.Cancel()
}

// scanOnce scans the filesystem and emits events for new/modified/deleted files.
func (w *Watcher) scanOnce() error {
	seen := make(map[string]struct{})
	// compute the index store path relative to the watched root (if inside root)
	relStore := ""
	if rel, err := filepath.Rel(w.Root, w.Index.Path); err == nil {
		relStore = filepath.ToSlash(rel)
	}
	tmpRel := ""
	if relStore != "" {
		tmpRel = relStore + ".tmp"
	}
	// return any walk error instead of swallowing it
	walkErr := filepath.WalkDir(w.Root, func(p string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if d.IsDir() {
			return nil
		}
		rel, err := filepath.Rel(w.Root, p)
		if err != nil {
			return err
		}
		rel = filepath.ToSlash(rel)
		// ignore the index storage file and its temp file to avoid self-triggering
		if relStore != "" && (rel == relStore || rel == tmpRel) {
			return nil
		}
		seen[rel] = struct{}{}
		info, err := d.Info()
		if err != nil {
			return err
		}
		old, ok := w.Index.Get(rel)
		if !ok {
			// new file
			if _, err := w.Index.UpdateFromFS(rel, info); err == nil {
				w.Events <- Event{Path: rel, Op: Create}
			}
		} else {
			// compare
			if info.ModTime().Unix() != old.ModTime || info.Size() != old.Size {
				if _, err := w.Index.UpdateFromFS(rel, info); err == nil {
					w.Events <- Event{Path: rel, Op: Modify}
				}
			}
		}
		return nil
	})

	if walkErr != nil {
		// scan failed; do not mark deletions or persist partial state
		return walkErr
	}

	// detect deletions
	for _, p := range w.Index.WalkEntries() {
		if _, ok := seen[p]; !ok {
			w.Index.MarkDeleted(p)
			w.Events <- Event{Path: p, Op: Remove}
		}
	}
	// persist index
	_ = w.Index.Save()
	return nil
}
