# FEAT-002: Client Sync Engine

## Overview
The Client Sync Engine is the core synchronization component of the cloud storage system, implementing CPU scheduling principles for intelligent file synchronization.

## Architecture

### File Structure
```
client/sync/
├── engine.go          # Main sync engine
├── state.go           # State machine & events
├── scheduler.go       # Sync scheduler
├── decision.go        # Decision logic
├── retry.go           # Retry handler
└── demo/
    └── main.go        # Demo application
```

## Key Components

### 1. ClientSyncEngine (engine.go)
Main orchestrator managing sync lifecycle.

**Responsibilities:**
- Coordinate sync cycles
- Manage sync queue
- Handle upload/download operations
- Track statistics

### 2. StateManager (state.go)
Manages state transitions and events.

**States:**
- IDLE - Waiting for changes
- SCANNING - Detecting file changes
- DECIDING - Determining actions
- UPLOADING - Sending files
- DOWNLOADING - Receiving files
- RETRYING - Handling failures
- ERROR - Terminal error state

### 3. Scheduler (scheduler.go)
Periodic sync execution (like CPU scheduler).

**Features:**
- Time-based scheduling
- Context-aware cancellation
- Online/offline awareness

### 4. DecisionManager (decision.go)
Intelligent sync decision logic.

**Decision Rules:**
| Condition | Action |
|-----------|--------|
| File only on client | UPLOAD |
| Local version > Server | UPLOAD |
| Server version > Local | DOWNLOAD |
| Both changed | CONFLICT |
| Same version | SKIP |

### 5. RetryHandler (retry.go)
Exponential backoff retry mechanism.

**Strategy:**
- Max retries: 3
- Backoff: 2^n seconds (2s → 4s → 8s)

## Usage

### Basic Usage
```go
package main

import (
    "context"
    "time"
    "github.com/Selasie5/upstack/client/sync"
)

func main() {
    // Create engine
    config := &sync.Config{
        MaxRetries:   3,
        ScanInterval: 5 * time.Second,
        BackoffBase:  2,
    }
    
    engine := sync.NewSyncEngine(config)
    
    // Subscribe to events
    events := engine.Subscribe()
    go handleEvents(events)
    
    // Start engine
    ctx := context.Background()
    engine.Start(ctx)
}

func handleEvents(events chan sync.Event) {
    for event := range events {
        switch event.Type {
        case "UPLOAD_COMPLETE":
            println("File uploaded:", event.Data["file"])
        }
    }
}
```

## Running the Demo
```bash
# Navigate to demo folder
cd client/sync/demo

# Run demo
go run main.go
```

## Connection to OS Concepts

This implementation applies CPU Scheduling principles (Chapter 6, Operating System Concepts):

| CPU Scheduling | Sync Engine |
|----------------|-------------|
| Process states | Sync states |
| Ready queue | Sync queue |
| Process scheduler | Sync scheduler |
| Dispatcher | Upload/download executor |
| Priority scheduling | Recent changes prioritized |
| Aging | Exponential backoff |

## Integration Points

### FEAT-001: File Watcher
```go
// Replace detectFileChanges() in engine.go
changes := fileWatcher.GetChanges()
```

### FEAT-003: Delta Sync
```go
// In executeUpload/executeDownload
deltaSync.TransferChunks(file)
```

### FEAT-004: Conflict Resolution
```go
// In handleConflict
conflictResolver.Resolve(localFile, serverFile)
```

### FEAT-005: Server API
```go
// In fetchServerMetadata, executeUpload, executeDownload
serverAPI.GetMetadata(filePath)
serverAPI.UploadFile(file, metadata)
```

## Testing
```bash
# Run tests
go test ./...

# Run with coverage
go test -cover ./...
```

## Performance Metrics

**Target:**
- Sync latency: < 3 seconds
- Success rate: > 95%
- Memory: < 50MB idle
- CPU: < 5% idle

## Implementation Status

- [x] State machine
- [x] Sync scheduler
- [x] Decision logic
- [x] Retry mechanism
- [x] Event system
- [x] Demo application
- [ ] FEAT-001 integration
- [ ] FEAT-003 integration
- [ ] FEAT-004 integration
- [ ] FEAT-005 integration
- [ ] Unit tests

## Author
**[Your Name]** - FEAT-002 Lead Developer

**Academic Foundation:** Based on CPU Scheduling principles from *Operating System Concepts* (9th Edition), Chapter 6.

## References
1. Silberschatz, A., Galvin, P. B., & Gagne, G. (2013). *Operating System Concepts* (9th ed.). Wiley.