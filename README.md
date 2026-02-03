# UpStack Distributed Object Storage System

UpStack is an enterprise-grade, distributed, content-addressable storage (CAS) solution. It is engineered to provide strong consistency for metadata management and eventual consistency for high-volume object data. The system utilizes a decoupled architecture, separating metadata orchestration from physical object persistence to facilitate efficient deduplication, delta synchronization, and secure multi-tenant collaboration.

---

## 1. Requirement Compliance (Group 16)

This implementation fulfills all core requirements for the Cloud Identity and Synchronization project:

### 1.1 Object Persistence (Upload/Download)
*   **Implementation**: Objects are decomposed into fixed-size 4MB blocks.
*   **Ingestion**: Handled via the `/api/v1/files/upload_chunk` and `/api/v1/files/metadata` endpoints.
*   **Retrieval**: The Management Console re-assembles chunks via the `/api/v1/files/download_chunk` endpoint for client-side reconstruction.

### 1.2 Automatic Client-Server Synchronization
*   **Sync Agent**: The `Synchronization Agent` (Go CLI) utilizes a recursive directory watcher.
*   **Lifecycle**: Automatic detection of local filesystem events (Write/Create/Remove) triggers the delta-upload protocol with no user intervention.

### 1.3 Versioning and Conflict Resolution
*   **Monotonic Versioning**: Every metadata commit increments a `Version` counter.
*   **Optimistic Concurrency Control**: The Backend implements a `CheckAndSet` mechanism. If a client attempts to commit a metadata state where `server.Version >= client.Version`, the server returns a `409 Conflict` error, preventing data corruption from concurrent writes.

### 1.4 Optimized Delta Synchronization
*   **Content-Addressing**: Chunks are identified by SHA-256 hashes.
*   **Delta Protocol**: Before uploading, the Sync Agent queries `/api/v1/files/check_chunks`. The server returns only the hashes it does not already possess, ensuring only modified segments are transmitted across the network.

### 1.5 Shared Folders and Access Control
*   **ACL Subsystem**: The system supports granular sharing. Ownership is immutable, but access can be granted to multiple user identities via email authorization.
*   **Shared Resources**: The Management Console provides a specialized view for shared inventory, utilizing the `/api/v1/files/share` logic.

### 1.6 Management Interface
*   **Dashboard**: A premium React dashboard provides full visibility into the cloud state, allowing for manual uploads, downloads, and permission management.

---

## 2. Technical Architecture

### 2.1 Storage Orchestration Engine (Backend)
Developed in Go, this component serves as the central authority for metadata consistency (MongoDB), object orchestration (S3/Local), and authentication. It exposes a RESTful API for both the Web Dashboard and the Synchronization Agent.

### 2.2 Synchronization Agent (CLI)
A high-performance daemon that monitors specific local directory trees. It performs client-side computational tasks—including chunking and hash generation—before negotiating with the Backend to transmit only missing data segments.

### 2.3 Management Console (Frontend)
A React-based single-page application (SPA) focused on object visualization and administrative tasks. It provides a professional, low-latency interface for resource management and ACL modification.

---

## 3. Getting Started

### 3.1 Environment Configuration
Create a `.env` file in the root directory using the `.env.example` template.

| Variable | Description |
| :--- | :--- |
| `MONGO_URI` | MongoDB connection string for metadata persistence |
| `JWT_SECRET` | Cryptographic key for session signing |
| `SMTP_EMAIL` | Originating email for sharing notifications |
| `SMTP_PASSWORD` | App-specific password for SMTP authentication |

### 3.2 Execution

**Backend Orchestrator**:
```powershell
go run ./engine/cmd/server/main.go
```

**Management Console**:
```powershell
cd Frontend
npm install
npm run dev
```

**Synchronization Agent**:
```powershell
go run ./client/cmd/client/main.go --dir <target_directory> --server http://localhost:8080
```

---

## 4. Testing specifications

### 4.1 Conflict Resolution Validation
1.  Initialize two Sync Agents on different machines pointing to the same file.
2.  Perform simultaneous modifications.
3.  Observe the Backend logs for the `409 Conflict` response to the second committer.

### 4.2 Deduplication Validation
1.  Upload a 10MB test file.
2.  Upload the same file under a different name.
3.  Verify via Backend metrics that no additional chunk storage was consumed.

---
© 2026 UpStack Core Systems. Proprietary and Confidential.
