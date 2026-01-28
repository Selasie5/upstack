//Applicaition's entry point for the client component.

package main

import (
	"fmt"
	"log"
	"path/filepath"
	"time"

	"github.com/Selasie5/upstack/client/metadata"
	"github.com/Selasie5/upstack/client/watcher"
)

func main() {
	fmt.Println("Client demo: starting watcher")
	root := filepath.Join(".")
	store := filepath.Join(".", "metadata_store.json")
	idx, err := metadata.NewIndex(root, store)
	if err != nil {
		log.Fatalf("failed to create index: %v", err)
	}
	// initial full scan
	if err := idx.Populate(); err != nil {
		log.Printf("populate warning: %v", err)
	}
	if err := idx.Save(); err != nil {
		log.Printf("save warning: %v", err)
	}

	w := watcher.NewWatcher(root, idx, time.Second)
	w.Start()
	// listen for events for 15 seconds
	timeout := time.After(15 * time.Second)
	for {
		select {
		case ev, ok := <-w.Events:
			if !ok {
				fmt.Println("events channel closed")
				return
			}
			fmt.Printf("event: %s %v\n", ev.Path, ev.Op)
		case <-timeout:
			w.Stop()
			fmt.Println("shutting down watcher demo")
			return
		}
	}
}
