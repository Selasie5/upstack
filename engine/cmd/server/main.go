// The Application's entry point for the server component.
package main

import (
	"log"
	"net/http"
	"time"

	"github.com/Selasie5/upstack/engine/internal/api"

	"github.com/Selasie5/upstack/engine/internal/metadata"

	"github.com/Selasie5/upstack/engine/internal/storage"

	 syncer "github.com/Selasie5/upstack/engine/internal/sync"
)

func main() {
	// Initialize subsystems
	metaStore := metadata.NewInMemoryStore()
	store := storage.NewLocalObjectStore("./data") 
	coord := syncer.NewCoordinator()

	// Create HTTP handlers / server
	srv := api.NewServer(metaStore, store, coord)

	// Basic server with 10s timeouts
	server := &http.Server{
		Addr:         ":8080",
		Handler:      srv.Router(),
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
	}

	log.Println("Starting server on :8080")
	if err := server.ListenAndServe(); err != nil {
		log.Fatalf("server failed: %v", err)
	}
}