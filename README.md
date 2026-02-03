# UpStack Distributed Object Storage System

UpStack is an enterprise-grade, distributed, content-addressable storage (CAS) solution. It is engineered to provide strong consistency for metadata management and eventual consistency for high-volume object data. The system utilizes a decoupled architecture, separating metadata orchestration from physical object persistence to facilitate efficient deduplication, delta synchronization, and secure multi-tenant collaboration.

---

## 1. Core Capabilities

*   **Content-Addressable Storage**: Objects are decomposed into fixed-size 4MB chunks, each identified by a unique SHA-256 cryptographic hash.
*   **Intelligent Deduplication**: Identical data blocks are stored only once across the global namespace, significantly reducing physical storage overhead.
*   **State-of-the-Art Security**: Implementation of JWT (JSON Web Tokens) for stateless session management and Bcrypt for secure credential hashing.
*   **Granular Access Control**: Robust Access Control List (ACL) implementation allowing for secure resource sharing between authenticated identities.
*   **Automated Notifications**: Integrated SMTP subsystem for real-time email alerts during collaborative authorization events.
*   **Delta Synchronization**: High-performance sync agent that transmits only modified or unique data blocks, optimizing bandwidth consumption.

---

## 2. Technical Architecture

The UpStack ecosystem is comprised of three primary sub-systems:

### 2.1 Storage Orchestration Engine (Backend)
Developed in Go, this component serves as the central authority for metadata consistency (MongoDB), object orchestration (S3/Local), and authentication. It exposes a RESTful API for both the Web Dashboard and the Synchronization Agent.

### 2.2 Synchronization Agent (CLI)
A high-performance daemon that monitors specific local directory trees. It performs client-side computational tasks—including chunking and hash generation—before Negotiating with the Backend to transmit only missing data segments.

### 2.3 Management Console (Frontend)
A React-based single-page application (SPA) focused on object visualization and administrative tasks. It provides a professional, low-latency interface for resource management and ACL modification.

---

## 3. Getting Started

### 3.1 Prerequisites
*   **Go**: Version 1.22 or higher
*   **Node.js**: Version 18.x or higher
*   **MongoDB**: An active cluster (Local or Atlas)
*   **AWS S3**: Optional, for cloud-native object persistence

### 3.2 Environment Configuration
Initialize your environment by creating a `.env` file in the root directory. Use the provided `.env.example` as a template.

| Variable | Description | Requirement |
| :--- | :--- | :--- |
| `MONGO_URI` | Connection string for metadata persistence | Required |
| `JWT_SECRET` | Cryptographic key for session signing | Required |
| `SMTP_EMAIL` | Originating email for notifications | Optional |
| `SMTP_PASSWORD` | App-specific password for SMTP authentication | Optional |
| `S3_BUCKET` | AWS S3 Bucket name for chunk storage | Optional |

---

## 4. Operational Procedures

### 4.1 Backend Execution
```powershell
# Navigate to root and execute the server
go run ./engine/cmd/server/main.go
```

### 4.2 Frontend Execution
```powershell
cd Frontend
npm install
npm run dev
```

### 4.3 Sync Agent Initialization
```powershell
go run ./client/cmd/client/main.go --dir <target_directory> --server http://localhost:8080
```

---

## 5. Testing and Validation Specifications

The following testing flows define the standard validation process for an UpStack deployment.

### 5.1 Identity and Session Management
1.  **Identity Creation**: Utilize the register flow to initialize a new user record in the MongoDB cluster.
2.  **Credential Verification**: Perform a login operation to obtain a JWT.
3.  **Session Persistence**: Verify that the authentication state is maintained across browser sessions and hard redirects.

### 5.2 Object Storage and Synchronization
1.  **Ingestion Verification**: Upload a multi-megabyte file to trigger multi-part chunking.
2.  **Data Integrity**: Download the object to verify the re-assembly process and hash matching.
3.  **Deduplication Efficiency**: Re-upload the same file and verify via server logs that zero new bytes were written to the storage backend.

### 5.3 Collaborative Authorization
1.  **ACL Modification**: Share a private resource with a secondary email identity.
2.  **SMTP Verification**: Confirm receipt of the automated security notification.
3.  **Cross-Identity Access**: Authenticate as the secondary user and verify visibility of the shared object in the "Shared with me" view.

---

## 6. API Reference

### 6.1 Authentication Endpoints
*   `POST /api/v1/auth/register`: Creates a new user identity.
*   `POST /api/v1/auth/login`: Authenticates credentials and returns a session token.

### 6.2 Resource Endpoints
*   `GET /api/v1/files`: Retrieves a list of objects accessible to the current identity.
*   `POST /api/v1/files/upload_chunk`: Ingests a unique data segment.
*   `POST /api/v1/files/metadata`: Commits the structural mapping of an object.
*   `POST /api/v1/files/share`: Modifies the ACL and triggers recipient notification.

---
© 2026 UpStack Core Systems. Proprietary and Confidential.
