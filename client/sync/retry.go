package sync

import (
	"math"
	"time"
)

// RetryHandler manages retry logic with exponential backoff
type RetryHandler struct {
	maxRetries  int
	backoffBase int
}

// NewRetryHandler creates a new retry handler
func NewRetryHandler(maxRetries, backoffBase int) *RetryHandler {
	return &RetryHandler{
		maxRetries:  maxRetries,
		backoffBase: backoffBase,
	}
}

// CalculateBackoff computes exponential backoff time
func (rh *RetryHandler) CalculateBackoff(attempt int) time.Duration {
	seconds := math.Pow(float64(rh.backoffBase), float64(attempt))
	return time.Duration(seconds) * time.Second
}

// ShouldRetry determines if another retry should be made
func (rh *RetryHandler) ShouldRetry(currentRetries int) bool {
	return currentRetries < rh.maxRetries
}

// GetMaxRetries returns maximum retry limit
func (rh *RetryHandler) GetMaxRetries() int {
	return rh.maxRetries
}