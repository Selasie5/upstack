package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/Selasie5/upstack/client/sync"
)

func main() {
	fmt.Println("==============================================")
	fmt.Println("  FEAT-002: Client Sync Engine Demo")
	fmt.Println("  Cloud Storage Synchronization System")
	fmt.Println("==============================================")
	fmt.Println()

	config := &sync.Config{
		MaxRetries:   3,
		ScanInterval: 3 * time.Second,
		BackoffBase:  2,
	}

	engine := sync.NewSyncEngine(config)

	events := engine.Subscribe()
	go handleEvents(events)

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, os.Interrupt, syscall.SIGTERM)

	go func() {
		fmt.Println("🚀 Starting sync engine...")
		if err := engine.Start(ctx); err != nil {
			if err != context.Canceled {
				log.Printf("Engine error: %v", err)
			}
		}
	}()

	printStatus(engine)
	go simulateOperations(engine)

	<-sigChan
	fmt.Println("\n🛑 Shutting down gracefully...")

	engine.Stop()
	cancel()

	fmt.Println("\n==============================================")
	fmt.Println("  Final Statistics")
	fmt.Println("==============================================")
	printStats(engine.GetStats())
}

func handleEvents(events chan sync.Event) {
	for event := range events {
		timestamp := event.Timestamp.Format("15:04:05")

		switch event.Type {
		case "STATE_CHANGE":
			data := event.Data
			fmt.Printf("[%s] State: %v -> %v\n",
				timestamp,
				data["old_state"],
				data["new_state"])

		case "CHANGES_DETECTED":
			count := event.Data["count"]
			fmt.Printf("[%s] Detected %v file change(s)\n", timestamp, count)

		case "DECISION_MADE":
			file := event.Data["file"]
			action := event.Data["action"]
			fmt.Printf("[%s] Decision: %v for %v\n", timestamp, action, file)

		case "UPLOAD_COMPLETE":
			file := event.Data["file"]
			fmt.Printf("[%s] Uploaded: %v\n", timestamp, file)

		case "DOWNLOAD_COMPLETE":
			file := event.Data["file"]
			fmt.Printf("[%s] Downloaded: %v\n", timestamp, file)

		case "RETRY_SCHEDULED":
			file := event.Data["file"]
			attempt := event.Data["attempt"]
			fmt.Printf("[%s] Retry %v for %v\n", timestamp, attempt, file)

		case "SYNC_FAILED":
			file := event.Data["file"]
			fmt.Printf("[%s] Failed: %v\n", timestamp, file)

		case "CONFLICT_DETECTED":
			file := event.Data["file"]
			fmt.Printf("[%s] Conflict: %v\n", timestamp, file)

		case "NETWORK_STATUS":
			online := event.Data["is_online"]
			status := "Online"
			if !online.(bool) {
				status = "Offline"
			}
			fmt.Printf("[%s] Network: %v\n", timestamp, status)

		case "SCHEDULER_STARTED":
			fmt.Printf("[%s] Scheduler started\n", timestamp)

		case "SCHEDULER_STOPPED":
			fmt.Printf("[%s] Scheduler stopped\n", timestamp)
		}
	}
}

func printStatus(engine *sync.ClientSyncEngine) {
	fmt.Println("\nCurrent Status:")
	fmt.Printf("   State: %v\n", engine.GetState())
	fmt.Printf("   Online: %v\n", engine.IsOnline())
	fmt.Println()
}

func printStats(stats sync.Stats) {
	fmt.Printf("   Total Syncs: %d\n", stats.TotalSyncs)
	fmt.Printf("   Successful: %d\n", stats.SuccessfulSyncs)
	fmt.Printf("   Failed: %d\n", stats.FailedSyncs)
	fmt.Printf("   Retries Used: %d\n", stats.RetriesUsed)

	if stats.TotalSyncs > 0 {
		successRate := float64(stats.SuccessfulSyncs) / float64(stats.TotalSyncs) * 100
		fmt.Printf("   Success Rate: %.1f%%\n", successRate)
	}
}

func simulateOperations(engine *sync.ClientSyncEngine) {
	time.Sleep(5 * time.Second)

	fmt.Println("\nSimulating network disruption...")
	engine.SetOnlineStatus(false)

	time.Sleep(3 * time.Second)

	fmt.Println("\nNetwork restored...")
	engine.SetOnlineStatus(true)
}
