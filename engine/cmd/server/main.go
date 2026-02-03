// The Application's entry point for the server component.
package main

import (
	"log"
	"net/http"
	"os"
	"time"

	"github.com/Selasie5/upstack/engine/internal/api"
	"github.com/Selasie5/upstack/engine/internal/metadata"
	"github.com/Selasie5/upstack/engine/internal/storage"
	syncer "github.com/Selasie5/upstack/engine/internal/sync"
	"github.com/joho/godotenv"
)

func main() {
	// Load .env file if it exists
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system environment or defaults")
	}

	// Initialize subsystems
	// Ensure data directory exists
	_ = os.MkdirAll("./data", 0o755)

	var metaStore metadata.Store
	mongoURI := os.Getenv("MONGO_URI")
	if mongoURI != "" {
		log.Println("Using MongoDB Metadata Store")
		ms, err := metadata.NewMongoStore(mongoURI, "upstack")
		if err != nil {
			log.Fatalf("failed to connect to mongo: %v", err)
		}
		defer ms.Close()
		metaStore = ms
	} else {
		log.Println("Using File-Based Metadata Store")
		metaStore = metadata.NewFileBackedStore("./data/metadata.json")
	}

	metaService := metadata.NewService(metaStore)

	var chunkStore storage.ChunkStore
	s3Bucket := os.Getenv("S3_BUCKET")
	if s3Bucket != "" {
		log.Println("Using S3 Chunk Store")
		region := os.Getenv("AWS_REGION")
		if region == "" {
			region = "us-east-1"
		}
		s, err := storage.NewS3ChunkStore(region, s3Bucket)
		if err != nil {
			log.Fatalf("failed to init s3: %v", err)
		}
		chunkStore = s
	} else {
		log.Println("Using Local Disk Chunk Store")
		chunkStore = storage.NewLocalObjectStore("./data")
	}

	syncService := syncer.NewService("./data/sync_events.json")

	// Create HTTP handlers / server
	srv := api.NewServer(metaService, chunkStore, syncService)

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