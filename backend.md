# Board: Backend Architecture & Engineering Blueprint

This is the backend that powers Board AI. It is a NestJS service that exposes REST and WebSocket endpoints for multi‑persona debates, conversations, messages, and attachments. The current codebase uses TypeORM with PostgreSQL, Socket.IO for real-time events, and simple, typed DTOs for request validation.

---

## 1. High-Level Backend Stack

- Runtime: NestJS (Node.js) with versioned REST routes and Swagger docs
- Persistence: PostgreSQL via TypeORM entities and migrations
- Caching: Redis module is available for caching/locks (feature-gated by env)
- Real-time: Socket.IO adapter on the `/board` namespace
- File handling: Multer + local/S3 driver wiring in `file.config`
- Auth: JWT scaffolding exists; most public endpoints are currently open while auth wiring is finished
- AI/Orchestration: AI and orchestration modules are present and evolve as we iterate; core CRUD (personas, conversations, messages, attachments) is live today

---

## 2. Database schema 

```sql
-- Users (optional; conversations can be anonymous)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE,
  name VARCHAR(255),
  avatar_url TEXT,
  password_hash VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Conversations
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  title VARCHAR(255),
  context TEXT,
  status VARCHAR(20) DEFAULT 'active',
  max_rounds INT DEFAULT 3,
  current_round INT DEFAULT 0,
  active_personas JSONB,
  current_speaker VARCHAR(255),
  turn_index INT DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Messages
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL,            -- user | agent | system
  agent_type VARCHAR(50),               -- marketing | developer | ...
  content TEXT NOT NULL,
  round_number INT DEFAULT 0,
  structured_output JSONB,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Attachments
CREATE TABLE attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(100) NOT NULL,
  file_size INTEGER NOT NULL,
  storage_url TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Personas
CREATE TABLE personas (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  role VARCHAR(100) NOT NULL,
  avatar_text VARCHAR(5) NOT NULL,
  color_hex VARCHAR(7) NOT NULL,
  system_prompt TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  priority_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 3. REST API endpoints (current controllers)

### Conversations

```typescript
GET    /api/conversations                    // List all user conversations (paginated)
POST   /api/conversations                    // Create new conversation
GET    /api/conversations/:id                // Get conversation details
PATCH  /api/conversations/:id                // Update conversation (title, status)
DELETE /api/conversations/:id                // Delete conversation

// Query parameters for GET /conversations
?page=1&limit=20&status=active&sort=updatedAt:desc
```

**Response Format**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "userId": "uuid",
      "title": "I want to build a mobile app...",
      "status": "active",
      "consensusReached": false,
      "viabilityScore": 8.2,
      "totalTurns": 12,
      "activeAgents": ["marketing", "developer", "pm", "qa"],
      "createdAt": "2025-12-31T10:00:00Z",
      "updatedAt": "2025-12-31T15:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

### Messages

```typescript
GET    /api/conversations/:id/messages       // Get all messages in conversation
POST   /api/conversations/:id/messages       // Send user message (triggers agent responses)
GET    /api/messages/:id                     // Get specific message details
DELETE /api/messages/:id                     // Delete message (admin only)
```

**Request Format (POST)**:
```json
{
  "content": "I want to build a high-end mobile app...",
  "attachmentIds": ["uuid1", "uuid2"]
}
```

**Response Format**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "conversationId": "uuid",
    "personaId": "user",
    "content": "I want to build...",
    "createdAt": "2025-12-31T15:30:00Z",
    "attachments": [
      {
        "id": "uuid",
        "fileName": "requirements.pdf",
        "fileType": "application/pdf",
        "storageUrl": "https://cdn.example.com/files/..."
      }
    ]
  }
}
```

### Attachments

```typescript
POST   /api/conversations/:id/upload         // Upload file to conversation
GET    /api/attachments/:id                  // Get attachment metadata
GET    /api/attachments/:id/download         // Download attachment file
DELETE /api/attachments/:id                  // Delete attachment
```

**Upload Request (multipart/form-data)**:
```typescript
FormData: {
  files: File[], // Max 5 files, 10MB each
  messageId?: string  // Optional: attach to existing message
}
```

**Upload Response**:
```json
{
  "success": true,
  "data": {
    "attachments": [
      {
        "id": "uuid",
        "fileName": "architecture.pdf",
        "fileType": "application/pdf",
        "fileSize": 1024000,
        "storageUrl": "https://cdn.example.com/files/...",
        "vectorIndexed": false
      }
    ]
  }
}
```

### Personas

```typescript
GET    /api/personas                         // List all available personas
GET    /api/personas/:id                     // Get persona details
POST   /api/personas                         // Create custom persona (admin)
PATCH  /api/personas/:id                     // Update persona configuration
DELETE /api/personas/:id                     // Delete custom persona
```

**Response Format**:
```json
{
  "success": true,
  "data": [
    {
      "id": "marketing",
      "name": "Marketing",
      "role": "Strategist",
      "avatarText": "M",
      "colorHex": "#10B981",
      "enabled": true,
      "priorityOrder": 1
    }
  ]
}
```

### (Not wired yet)
- Auth routes exist but are not enforced for the above resources.
- Analytics/consensus endpoints are not implemented in the current code.

---

## 4. WebSockets (current state)

- Socket.IO adapter is enabled on `/board`.
- Use it for real-time conversation updates; event names and payloads may change as streaming is built out.

---

## 5. Core modules (current)

- Conversations: CRUD, pagination, soft status via enum
- Messages: Create/list under a conversation, optional structured output metadata
- Personas: Seeded persona list with ids, colors, prompts
- Attachments: Single-file upload and lookup

Planned but not yet wired: orchestration/consensus logic and advanced analytics.

---

## 6. Redis

Redis is optional. If `REDIS_URL` is set, it can be used for caching/locks in future orchestration work. No Redis keys are currently defined in code.

---

## 7. Security & validation

- JWT config exists; most routes are currently open. Enable guards when auth is finalized.
- DTOs enforce payload shape and limits (see create/update DTOs in controllers).

---

## 8. Frontend integration (minimal examples)

- REST: call `/api/v1/conversations` and `/api/v1/conversations/:id/messages`; bearer auth can be added later.
- WebSockets: connect to `/board` via Socket.IO for real-time updates as streaming is added.
- File uploads: `POST /api/v1/attachments/upload` with `file` form field.

---

## 9. Implementation checklist (what’s left vs done)

- [x] NestJS app with TypeORM entities for conversations/messages/personas/attachments
- [x] REST controllers for conversations, messages, personas, attachments
- [x] File upload via Multer (single file)
- [x] Swagger docs and API versioning
- [x] Socket.IO namespace mounted on `/board` (no streaming payloads yet)
- [ ] Enforce auth/guards on routes (JWT scaffolding exists)
- [ ] Real-time streaming events over Socket.IO (no event schema implemented)
- [ ] Analytics/consensus endpoints (not implemented)
- [ ] Redis-backed orchestration/caching (env-gated, unused)
- [ ] RAG/vector search pipeline
- [ ] Broader test coverage and CI (only skeleton tests)