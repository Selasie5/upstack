package sync

import (
	"context"
	"time"
)

// Scheduler manages periodic sync cycles
type Scheduler struct {
	engine   *ClientSyncEngine
	interval time.Duration
	stopChan chan struct{}
	running  bool
}

// NewScheduler creates a new scheduler
func NewScheduler(engine *ClientSyncEngine, interval time.Duration) *Scheduler {
	return &Scheduler{
		engine:   engine,
		interval: interval,
		stopChan: make(chan struct{}),
		running:  false,
	}
}

// Start begins the scheduler loop
func (s *Scheduler) Start(ctx context.Context) error {
	if s.running {
		return nil
	}

	s.running = true
	ticker := time.NewTicker(s.interval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			s.running = false
			return ctx.Err()

		case <-s.stopChan:
			s.running = false
			return nil

		case <-ticker.C:
			if s.engine.IsOnline() {
				if err := s.engine.RunSyncCycle(ctx); err != nil {
					s.engine.state.Emit("CYCLE_ERROR", map[string]interface{}{
						"error": err.Error(),
					})
				}
			}
		}
	}
}

// Stop halts the scheduler
func (s *Scheduler) Stop() {
	if s.running {
		close(s.stopChan)
	}
}

// IsRunning returns scheduler status
func (s *Scheduler) IsRunning() bool {
	return s.running
}