package main

import (
	"flag"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"time"

	"github.com/Selasie5/upstack/client/metadata"
	"github.com/Selasie5/upstack/client/sync"
)

func main() {
	var (
		serverURL = flag.String("server", "http://localhost:8080", "Server URL")
		syncDir   = flag.String("dir", "./sync_folder", "Directory to sync")
	)
	flag.Parse()

	log.Printf("Starting UpStack Client Sync Agent")
	log.Printf("Sync Directory: %s", *syncDir)
	log.Printf("Server: %s", *serverURL)

	if err := os.MkdirAll(*syncDir, 0755); err != nil {
		log.Fatalf("failed to create sync dir: %v", err)
	}

	idxPath := filepath.Join(*syncDir, ".upstack_index.json")
	idx, err := metadata.NewIndex(*syncDir, idxPath)
	if err != nil {
		log.Fatalf("failed to load index: %v", err)
	}

	// Initial scan
	if err := idx.Populate(); err != nil {
		log.Printf("initial scan warning: %v", err)
	}
	_ = idx.Save()

	engine := sync.NewEngine(*serverURL, *syncDir, idx)
	engine.Start()

	// Block forever
	select {}
}
