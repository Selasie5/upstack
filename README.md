# UpStack System Documentation

## 1. System Overview

UpStack is a distributed, content-addressable cloud storage system designed with strong consistency for metadata and eventual consistency for object data. The architecture decouples metadata management from object storage, enabling efficient delta synchronization, deduplication, and scalable file sharing.

The system consists of three primary components:
1.  **Storage Engine (Backend)**: Manages metadata consistency, access control lists (ACLs), and chunk orchestration. It interfaces with pluggable storage backends (Local/S3 and JSON/MongoDB).
2.  **Synchronization Agent (Client)**: A file system watcher that handles chunking (fixed-size 4MB), SHA-256 hashing, and delta uploads.
3.  **Web Interface (Frontend)**: A React-based user interface for file management, sharing, and visualization.

## 2. Architecture

### 2.1 Content-Addressable Storage (CAS)
Files are split into 4MB chunks. Each chunk is identified by its SHA-256 hash. This allows for:
*   **Deduplication**: Identical chunks across different files or users are stored only once.
*   **Delta Sync**: Modifications to large files result in only new chunks being uploaded.

### 2.2 Metadata Consistency
Metadata (file names, structure, permissions) is stored in a strictly consistent data store. The system supports CAS (Check-and-Set) operations to prevent race conditions during concurrent edits.

## 3. Configuration & Cloud Deployment

The system is designed to run in a hybrid or fully cloud-native environment. Configuration is managed via environment variables.

### 3.1 Enabling Cloud Object Storage (AWS S3)
To transition from local disk storage to AWS S3, configure the backend with valid AWS credentials and bucket information.

**Required Environment Variables:**
*   `S3_BUCKET`: The name of the S3 bucket to store chunks (e.g., `prod-upstack-chunks`).
*   `AWS_REGION`: The AWS region where the bucket resides (e.g., `us-east-1`).
*   `AWS_ACCESS_KEY_ID`: AWS Access Key with `s3:PutObject` and `s3:GetObject` permissions.
*   `AWS_SECRET_ACCESS_KEY`: Corresponding AWS Secret Key.

**Implementation Note:**
The system uses the standard AWS SDK conventions. Ensure the IAM user has sufficient permissions for the specified bucket.

### 3.2 Enabling Cloud Metadata Storage (MongoDB)
To transition from local flat-file persistence to a scalable database, configure a MongoDB connection.

**Required Environment Variable:**
*   `MONGO_URI`: A standard MongoDB connection string (e.g., `mongodb+srv://<user>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority`).

**Behavior:**
If `MONGO_URI` is present, the system automatically initializes the MongoDB driver. If absent, it defaults to `data/metadata.json`.

## 4. Build and execution

### 4.1 Storage Engine (Backend)
The backend is written in Go.

**Build:**
```bash
go build -o server ./engine/cmd/server/main.go
```

**Run (Cloud Mode):**
```bash
export S3_BUCKET="my-bucket"
export MONGO_URI="mongodb://..."
./server
```

**Run (Local Mode):**
```bash
./server
```
*The server listens on port 8080 by default.*

### 4.2 Web Interface (Frontend)
The frontend is a Vite-based React application.

**Install Dependencies:**
```bash
cd Frontend
npm install
```

**Run Development Server:**
```bash
npm run dev
```

### 4.3 Synchronization Agent
The client agent watches a local directory for changes.

**Run:**
```bash
go run ./client/cmd/client/main.go --dir ./my_sync_folder --server http://localhost:8080
```

## 5. Testing Strategy

### 5.1 Unit Testing
Run the Go test suite to verify internal logic, specifically chunking and hashing algorithms.

```bash
go test ./pkg/... ./client/... ./engine/...
```

### 5.2 Integration Testing (Manual)

**Scenario 1: Basic Synchronization**
1.  Start the Server (Local Mode).
2.  Start the Client Agent watching `./test_folder`.
3.  Create a file `document.txt` in `./test_folder`.
4.  Verify server logs indicate chunk upload.
5.  Verify `data/chunks/` contains the hashed chunk.

**Scenario 2: Deduplication**
1.  Copy `document.txt` to `document_copy.txt` in the watched folder.
2.  Verify server logs indicate **zero** bytes uploaded for the new file (only metadata update).

**Scenario 3: Access Control & Sharing**
1.  Open Frontend and log in as `user_a`.
2.  Upload `secret.pdf`.
3.  Open a second browser context (Incognito) and log in as `user_b`. Verify `secret.pdf` is **not** visible.
4.  As `user_a`, share `secret.pdf` with `user_b`.
5.  Refresh `user_b` view. Verify `secret.pdf` is now visible and downloadable.

## 6. API Reference

### Valid Auth Header
All API requests (except `/health`) must include:
`X-User-ID: <user_identifier>`



### Endpoints
*   `POST /api/v1/files/upload_chunk?hash=<sha256>`: Upload binary data.
*   `POST /api/v1/files/check_chunks`: Batch check for existing hashes.
*   `POST /api/v1/files/metadata`: Atomic metadata commit.
*   `GET /api/v1/files`: List files accessible to the authenticated user.
*   `GET /api/v1/changes`: Poll for delta updates.
*   `POST /api/v1/files/share`: Share a file with another user ID.
