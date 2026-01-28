// Responsible for client-side syncing
// FEAT-002: Client Sync Engine Implementation
// Based on CPU Scheduling principles (OS Concepts Chapter 6)
package sync

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/google/uuid"
)

// Config holds sync engine configuration
type Config struct {
	MaxRetries   int
	ScanInterval time.Duration
	BackoffBase  int
}

// DefaultConfig returns default configuration
func DefaultConfig() *Config {
	return &Config{
		MaxRetries:   3,
		ScanInterval: 5 * time.Second,
		BackoffBase:  2,
	}
}

// Stats tracks sync engine statistics
type Stats struct {
	mu              sync.RWMutex
	TotalSyncs      int
	SuccessfulSyncs int
	FailedSyncs     int
	RetriesUsed     int
}

// Get returns a copy of current stats
func (s *Stats) Get() Stats {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return Stats{
		TotalSyncs:      s.TotalSyncs,
		SuccessfulSyncs: s.SuccessfulSyncs,
		FailedSyncs:     s.FailedSyncs,
		RetriesUsed:     s.RetriesUsed,
	}
}

// ClientSyncEngine is the main synchronization engine
type ClientSyncEngine struct {
	config       *Config
	state        *StateManager
	stats        *Stats
	syncQueue    []FileChange
	queueMu      sync.Mutex
	isOnline     bool
	onlineMu     sync.RWMutex
	scheduler    *Scheduler
	decisionMgr  *DecisionManager
	retryHandler *RetryHandler
}

// NewSyncEngine creates a new sync engine instance
func NewSyncEngine(config *Config) *ClientSyncEngine {
	if config == nil {
		config = DefaultConfig()
	}

	engine := &ClientSyncEngine{
		config:    config,
		state:     NewStateManager(),
		stats:     &Stats{},
		syncQueue: make([]FileChange, 0),
		isOnline:  true,
	}

	engine.scheduler = NewScheduler(engine, config.ScanInterval)
	engine.decisionMgr = NewDecisionManager()
	engine.retryHandler = NewRetryHandler(config.MaxRetries, config.BackoffBase)

	return engine
}

// Start begins the sync scheduler
func (e *ClientSyncEngine) Start(ctx context.Context) error {
	e.state.Emit("SCHEDULER_STARTED", map[string]interface{}{
		"scan_interval": e.config.ScanInterval.String(),
	})
	return e.scheduler.Start(ctx)
}

// Stop halts the sync scheduler
func (e *ClientSyncEngine) Stop() {
	e.scheduler.Stop()
	e.state.TransitionTo(StateIdle, nil)
	e.state.Emit("SCHEDULER_STOPPED", nil)
}

// Subscribe returns a channel for events
func (e *ClientSyncEngine) Subscribe() chan Event {
	return e.state.Subscribe()
}

// GetState returns current state
func (e *ClientSyncEngine) GetState() SyncState {
	return e.state.GetState()
}

// GetStats returns statistics
func (e *ClientSyncEngine) GetStats() Stats {
	return e.stats.Get()
}

// SetOnlineStatus updates network status
func (e *ClientSyncEngine) SetOnlineStatus(online bool) {
	e.onlineMu.Lock()
	e.isOnline = online
	e.onlineMu.Unlock()

	e.state.Emit("NETWORK_STATUS", map[string]interface{}{
		"is_online": online,
	})
}

// IsOnline returns network status
func (e *ClientSyncEngine) IsOnline() bool {
	e.onlineMu.RLock()
	defer e.onlineMu.RUnlock()
	return e.isOnline
}

// RunSyncCycle executes complete sync cycle
func (e *ClientSyncEngine) RunSyncCycle(ctx context.Context) error {
	e.state.TransitionTo(StateScanning, nil)
	if err := e.scanForChanges(ctx); err != nil {
		e.state.TransitionTo(StateError, map[string]interface{}{
			"error": err.Error(),
		})
		return err
	}

	if len(e.syncQueue) > 0 {
		e.state.TransitionTo(StateDeciding, nil)
		if err := e.makeDecisions(ctx); err != nil {
			return err
		}

		if err := e.executeSyncOperations(ctx); err != nil {
			return err
		}
	}

	e.state.TransitionTo(StateIdle, nil)
	return nil
}

func (e *ClientSyncEngine) scanForChanges(ctx context.Context) error {
	changes := e.detectFileChanges()

	e.queueMu.Lock()
	for _, change := range changes {
		change.ID = uuid.New().String()
		change.Timestamp = time.Now()
		e.syncQueue = append(e.syncQueue, change)
	}
	queueSize := len(e.syncQueue)
	e.queueMu.Unlock()

	if len(changes) > 0 {
		e.state.Emit("CHANGES_DETECTED", map[string]interface{}{
			"count":      len(changes),
			"queue_size": queueSize,
		})
	}
	return nil
}

func (e *ClientSyncEngine) detectFileChanges() []FileChange {
	return []FileChange{}
}

func (e *ClientSyncEngine) makeDecisions(ctx context.Context) error {
	e.queueMu.Lock()
	defer e.queueMu.Unlock()

	for i := range e.syncQueue {
		serverMeta, err := e.fetchServerMetadata(ctx, e.syncQueue[i].FilePath)
		if err != nil {
			return fmt.Errorf("failed to fetch metadata: %w", err)
		}

		action := e.decisionMgr.DetermineAction(&e.syncQueue[i], serverMeta)
		e.syncQueue[i].Action = action

		e.state.Emit("DECISION_MADE", map[string]interface{}{
			"file":           e.syncQueue[i].FilePath,
			"action":         action.String(),
			"local_version":  e.syncQueue[i].LocalVersion,
			"server_version": serverMeta.Version,
		})
	}
	return nil
}

func (e *ClientSyncEngine) executeSyncOperations(ctx context.Context) error {
	e.queueMu.Lock()
	queue := e.syncQueue
	e.syncQueue = make([]FileChange, 0)
	e.queueMu.Unlock()

	for _, item := range queue {
		select {
		case <-ctx.Done():
			return ctx.Err()
		default:
		}

		var err error
		switch item.Action {
		case ActionUpload:
			err = e.executeUpload(ctx, &item)
		case ActionDownload:
			err = e.executeDownload(ctx, &item)
		case ActionConflict:
			err = e.handleConflict(ctx, &item)
		case ActionSkip:
			continue
		}

		if err != nil {
			e.handleSyncFailure(&item, err)
		} else {
			e.stats.mu.Lock()
			e.stats.SuccessfulSyncs++
			e.stats.TotalSyncs++
			e.stats.mu.Unlock()
		}
	}
	return nil
}

func (e *ClientSyncEngine) executeUpload(ctx context.Context, item *FileChange) error {
	e.state.TransitionTo(StateUploading, map[string]interface{}{
		"file": item.FilePath,
	})
	time.Sleep(time.Millisecond * 500)
	e.state.Emit("UPLOAD_COMPLETE", map[string]interface{}{
		"file":    item.FilePath,
		"version": item.LocalVersion,
	})
	return nil
}

func (e *ClientSyncEngine) executeDownload(ctx context.Context, item *FileChange) error {
	e.state.TransitionTo(StateDownloading, map[string]interface{}{
		"file": item.FilePath,
	})
	time.Sleep(time.Millisecond * 500)
	e.state.Emit("DOWNLOAD_COMPLETE", map[string]interface{}{
		"file": item.FilePath,
	})
	return nil
}

func (e *ClientSyncEngine) handleConflict(ctx context.Context, item *FileChange) error {
	e.state.Emit("CONFLICT_DETECTED", map[string]interface{}{
		"file":          item.FilePath,
		"local_version": item.LocalVersion,
	})
	return nil
}

func (e *ClientSyncEngine) handleSyncFailure(item *FileChange, err error) {
	item.Retries++

	if item.Retries <= e.config.MaxRetries {
		e.state.TransitionTo(StateRetrying, map[string]interface{}{
			"file":    item.FilePath,
			"attempt": item.Retries,
		})

		backoffTime := e.retryHandler.CalculateBackoff(item.Retries)

		e.state.Emit("RETRY_SCHEDULED", map[string]interface{}{
			"file":         item.FilePath,
			"attempt":      item.Retries,
			"max_retries":  e.config.MaxRetries,
			"backoff_time": backoffTime.String(),
			"error":        err.Error(),
		})

		e.stats.mu.Lock()
		e.stats.RetriesUsed++
		e.stats.mu.Unlock()

		time.Sleep(backoffTime)
		e.queueMu.Lock()
		e.syncQueue = append(e.syncQueue, *item)
		e.queueMu.Unlock()
	} else {
		e.stats.mu.Lock()
		e.stats.FailedSyncs++
		e.stats.TotalSyncs++
		e.stats.mu.Unlock()

		e.state.Emit("SYNC_FAILED", map[string]interface{}{
			"file":    item.FilePath,
			"error":   err.Error(),
			"retries": item.Retries,
		})
	}
}

func (e *ClientSyncEngine) fetchServerMetadata(ctx context.Context, filePath string) (*ServerMetadata, error) {
	time.Sleep(time.Millisecond * 100)
	return &ServerMetadata{
		Version:      2,
		LastModified: time.Now(),
		Size:         1024,
		Exists:       true,
	}, nil
}
