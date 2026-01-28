package sync

import (
	"math"
	"time"
)

// DecisionManager handles sync decision logic
type DecisionManager struct{}

// NewDecisionManager creates a new decision manager
func NewDecisionManager() *DecisionManager {
	return &DecisionManager{}
}

// DetermineAction decides what action to take for a file
func (dm *DecisionManager) DetermineAction(localItem *FileChange, serverMeta *ServerMetadata) SyncAction {
	// Case 1: File doesn't exist on server
	if !serverMeta.Exists {
		if localItem.ChangeType == ChangeDelete {
			return ActionSkip
		}
		return ActionUpload
	}

	// Case 2: Local deletion
	if localItem.ChangeType == ChangeDelete {
		return ActionUpload
	}

	// Case 3: Version comparison
	if localItem.LocalVersion > serverMeta.Version {
		return ActionUpload
	} else if localItem.LocalVersion < serverMeta.Version {
		return ActionDownload
	}

	// Case 4: Same version but check timestamp
	timeDiff := math.Abs(float64(localItem.Timestamp.Sub(serverMeta.LastModified)))
	if timeDiff > float64(time.Second) {
		return ActionConflict
	}

	return ActionSkip
}

// PrioritizeQueue sorts sync queue by priority
func (dm *DecisionManager) PrioritizeQueue(queue []FileChange) []FileChange {
	prioritized := make([]FileChange, len(queue))
	copy(prioritized, queue)

	// Sort by timestamp (most recent first)
	for i := 1; i < len(prioritized); i++ {
		key := prioritized[i]
		j := i - 1
		for j >= 0 && prioritized[j].Timestamp.Before(key.Timestamp) {
			prioritized[j+1] = prioritized[j]
			j--
		}
		prioritized[j+1] = key
	}

	return prioritized
}