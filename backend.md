# Board: Backend Architecture & Engineering Blueprint

This document defines the server-side infrastructure for the Board autonomous multi-agent system, focusing on high-performance AI orchestration, state persistence, and distributed processing to serve the React/Next.js frontend.

---

## 1. High-Level Backend Stack

**Runtime**: NestJS (Node.js) – Selected for its modular architecture and native support for Microservices/WebSockets.

**Orchestration**: LangGraph (JS/TS) – Manages the cyclical state machine of agent debates.

**Persistence Layer**: PostgreSQL (Prisma ORM) – Stores users, conversations, messages, and session metadata.

**Caching & State**: Redis 7.x – Centralized "hot" storage for active session states, distributed locking, and LLM response caching.

**AI Engine**: GPT-4o (via OpenAI SDK) with Structured Output enforcement.

**Vector Search**: Pinecone – For Retrieval-Augmented Generation (RAG) over attached documents.

**File Storage**: AWS S3 / Azure Blob Storage – For uploaded file persistence with CDN support.

---

## 2. Database Schema (PostgreSQL)

### 2.1 Core Tables

```sql
-- Users table for authentication
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  avatar_url TEXT,
  password_hash VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Conversations (Boardroom sessions)
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL DEFAULT 'New brainstorming',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Metadata
  status VARCHAR(50) DEFAULT 'active', -- active, archived, deleted
  consensus_reached BOOLEAN DEFAULT false,
  viability_score DECIMAL(5,2),
  
  -- Performance metrics
  total_turns INTEGER DEFAULT 0,
  active_agents TEXT[], -- Array of active persona IDs
  
  INDEX idx_user_conversations (user_id, updated_at DESC)
);

-- Messages in conversations
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  persona_id VARCHAR(50) NOT NULL, -- 'user', 'marketing', 'developer', etc.
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Message metadata
  is_typing BOOLEAN DEFAULT false,
  is_rebuttal BOOLEAN DEFAULT false,
  is_resolution BOOLEAN DEFAULT false,
  sentiment_score DECIMAL(3,2), -- 0.0 to 1.0
  
  -- AI metadata
  model_used VARCHAR(100),
  tokens_used INTEGER,
  latency_ms INTEGER,
  
  INDEX idx_conversation_messages (conversation_id, created_at ASC)
);

-- File attachments
CREATE TABLE attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(100) NOT NULL,
  file_size INTEGER NOT NULL,
  storage_url TEXT NOT NULL, -- S3/Azure URL
  
  -- Vector search integration
  vector_indexed BOOLEAN DEFAULT false,
  pinecone_namespace VARCHAR(255),
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_message_attachments (message_id)
);

-- Agent personas configuration
CREATE TABLE personas (
  id VARCHAR(50) PRIMARY KEY, -- 'marketing', 'developer', etc.
  name VARCHAR(100) NOT NULL,
  role VARCHAR(100) NOT NULL,
  avatar_text VARCHAR(5) NOT NULL, -- 'M', 'D', etc.
  color_hex VARCHAR(7) NOT NULL, -- '#10B981'
  system_prompt TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  priority_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Session analytics and metrics
CREATE TABLE session_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  
  -- Consensus metrics
  agreement_score DECIMAL(5,2),
  conflict_count INTEGER DEFAULT 0,
  resolution_count INTEGER DEFAULT 0,
  
  -- Performance metrics
  total_tokens_used INTEGER DEFAULT 0,
  total_cost_usd DECIMAL(10,4) DEFAULT 0,
  avg_response_time_ms INTEGER,
  
  -- Outcome tracking
  final_recommendation TEXT,
  key_insights JSONB, -- Structured insights from the debate
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 3. REST API Endpoints

### 3.1 Authentication & User Management

```typescript
POST   /api/auth/register          // Create new user account
POST   /api/auth/login             // Authenticate user (returns JWT)
POST   /api/auth/logout            // Invalidate session
GET    /api/auth/me                // Get current user profile
PATCH  /api/auth/me                // Update user profile
```

### 3.2 Conversation Management

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

### 3.3 Message Management

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

### 3.4 File Upload & Attachments

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

### 3.5 Persona Management

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

### 3.6 Analytics & Insights

```typescript
GET    /api/conversations/:id/analytics      // Get conversation metrics
GET    /api/conversations/:id/consensus      // Get current consensus status
GET    /api/analytics/user                   // User-level usage statistics
```

**Analytics Response**:
```json
{
  "success": true,
  "data": {
    "agreementScore": 0.78,
    "totalTurns": 12,
    "tokensUsed": 15420,
    "estimatedCost": 0.15,
    "consensusReached": false,
    "viabilityScore": 8.2,
    "conflictCount": 2,
    "resolutionCount": 1,
    "keyInsights": [
      "Market validation required",
      "Technical feasibility confirmed",
      "Resource allocation concerns"
    ]
  }
}
```

---

## 4. WebSocket Events (Socket.IO)

### 4.1 Connection & Namespaces

```typescript
// Client connects to specific conversation
const socket = io('/conversations/:conversationId', {
  auth: { token: 'JWT_TOKEN' }
});

// Namespace: /conversations/:conversationId
// Rooms: Each user gets their own room for private updates
```

### 4.2 Client → Server Events

```typescript
// Join conversation room
socket.emit('JOIN_CONVERSATION', { 
  conversationId: 'uuid' 
});

// Start new agent discussion
socket.emit('START_SESSION', {
  conversationId: 'uuid',
  userMessage: 'I want to build...',
  attachments: ['file-id-1', 'file-id-2'],
  activeAgents: ['marketing', 'developer', 'pm', 'qa'] // Optional
});

// Request specific agent response
socket.emit('REQUEST_AGENT', {
  conversationId: 'uuid',
  personaId: 'qa',
  context: 'How do we handle...'
});

// Stop ongoing agent discussion
socket.emit('STOP_SESSION', { 
  conversationId: 'uuid' 
});

// User is typing indicator
socket.emit('USER_TYPING', { 
  conversationId: 'uuid', 
  isTyping: true 
});
```

### 4.3 Server → Client Events

```typescript
// Real-time agent message streaming (token by token)
socket.on('AGENT_STREAM', (data) => {
  {
    messageId: 'uuid',
    personaId: 'marketing',
    chunk: 'text fragment...',
    isComplete: false
  }
});

// Complete agent message
socket.on('AGENT_MESSAGE', (data) => {
  {
    id: 'uuid',
    conversationId: 'uuid',
    personaId: 'marketing',
    content: 'Full message text...',
    createdAt: '2025-12-31T15:30:00Z',
    sentimentScore: 0.85,
    isRebuttal: false,
    isResolution: false
  }
});

// Agent started typing
socket.on('AGENT_TYPING', (data) => {
  {
    personaId: 'developer',
    isTyping: true,
    message: 'is working on ideas...'
  }
});

// Consensus & metrics update (real-time)
socket.on('METRIC_UPDATE', (data) => {
  {
    agreementScore: 0.78,
    viabilityScore: 8.2,
    conflictCount: 2,
    turnNumber: 8,
    activeAgent: 'pm'
  }
});

// Session completed with consensus
socket.on('SESSION_COMPLETE', (data) => {
  {
    conversationId: 'uuid',
    consensusReached: true,
    finalRecommendation: 'Proceed with MVP...',
    analytics: {
      totalTurns: 15,
      tokensUsed: 25000,
      cost: 0.25
    }
  }
});

// Error handling
socket.on('ERROR', (error) => {
  {
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Token limit reached for this session',
    retryAfter: 60
  }
});
```

---

## 5. Core Modules & Services

### 5.1 The Gateway (Ingress & WebSockets)

**Module**: `gateway.module.ts`

**Responsibilities**:
- Handles WebSocket connections via Socket.IO
- Namespace management for conversation isolation
- JWT authentication for socket connections
- Event routing to orchestration service

**Event Pipeline**:
- `subscribe('START_SESSION')`: Initializes the LangGraph state
- `emit('AGENT_STREAM')`: Forwards LLM chunks to the specific client
- `emit('METRIC_UPDATE')`: Pushes real-time scoring to dashboard
- `emit('AGENT_TYPING')`: Broadcasts agent typing indicators
- `emit('SESSION_COMPLETE')`: Notifies frontend when consensus is reached

### 5.2 The Orchestration Service (LangGraph)

**Module**: `orchestration.module.ts`

The backend manages a `StateGraph` that determines the "Next Speaker" based on conversation context.

**State Machine Flow**:

```
Entry Node → Process user prompt + document context
    ↓
Deliberation Loop:
    ↓
Marketing Agent → Evaluates market opportunity
    ↓
Developer Agent → Assesses technical feasibility  
    ↓
PM Agent → Analyzes resource requirements
    ↓
UX Agent → Evaluates user experience
    ↓
QA Agent → Identifies risks and edge cases
    ↓
Consensus Check → Analyzes semantic alignment
    ↓
If no consensus → Loop to next relevant agent
If consensus → Generate final recommendation
```

**Key Features**:
- Dynamic agent selection based on conversation context
- Parallel agent invocation for efficiency (configurable)
- Maximum turn limit (15 turns) to prevent infinite loops
- State persistence to Redis for recovery
- Conflict detection and resolution tracking

### 5.3 The Tooling Service (RAG & Extraction)

**Module**: `tooling.module.ts`

**File Processing Pipeline**:
1. **Upload Handler**: Multer for multipart uploads
2. **Parser**: Converts PDFs, DOCX, TXT to plain text
3. **Chunking**: 512-token chunks with overlap
4. **Embedding**: `text-embedding-3-small` vectors
5. **Storage**: Pinecone with conversation namespace

**Search Tool**:
- Agents invoke `searchDocuments(query: string)` during deliberation
- Returns top-k relevant chunks with citations
- Integrates with external APIs for market data

**Supported File Types**:
- PDF (pdf-parse)
- DOCX (mammoth)
- TXT, CSV, JSON
- Images (OCR via Tesseract.js)

### 5.4 The Persona Service

**Module**: `persona.module.ts`

**AgentPersona Factory**:
```typescript
interface AgentPersona {
  id: string;
  name: string;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  tools: Tool[];
}

class PersonaFactory {
  create(personaId: string): AgentPersona {
    // Load from DB and inject specialized prompts
  }
}
```

**Default Personas**:
- **Marketing** (Strategist): Market analysis, TAM calculation
- **Developer** (Engineer): Technical feasibility, architecture
- **PM** (Product Manager): Resource planning, roadmap
- **UX** (Designer): User experience, friction points
- **QA** (Quality Assurance): Risk analysis, edge cases

### 5.5 The Consensus Engine

**Module**: `consensus.module.ts`

**Consensus Calculation** (weighted, not boolean):

1. **Sentiment Extraction**: Score agreement level (0.0 to 1.0) of last message

2. **Conflict Matrix**: Track unresolved rebuttals. Session cannot end if `isRebuttal` not followed by `isResolution`

3. **Metric Stability**: Consensus flagged if `viabilityScore` moves < 5% across 3 consecutive turns

4. **Vote Aggregation**: Each agent implicitly "votes" through semantic analysis

**Consensus Criteria**:
```typescript
interface ConsensusCheck {
  agreementThreshold: number;     // >= 0.75
  conflictResolution: boolean;    // All rebuttals resolved
  metricStability: boolean;       // < 5% variance over 3 turns
  minTurns: number;               // >= 5 turns required
  allAgentsParticipated: boolean; // Each active agent contributed
}
```

---

## 6. Redis Persistence Strategy

Redis acts as the **Message Bus** and **State Store** for stateless horizontal scaling.

### Key Patterns

| Key Pattern | Data Type | Purpose | TTL |
|------------|-----------|---------|-----|
| `session:{id}:graph` | STRING (JSON) | Serialized LangGraph state | 24h |
| `lock:debate:{id}` | STRING | Redlock for single agent speaking | 30s |
| `cache:llm:{hash}` | STRING | Caches expensive reasoning | 7d |
| `stream:{id}:buffer` | LIST | Buffers outgoing chunks | 1h |
| `conv:{id}:metrics` | HASH | Real-time conversation metrics | 24h |
| `user:{id}:rate` | STRING | Token bucket for rate limiting | 1m |
| `typing:{conv}:{persona}` | STRING | Agent typing state | 10s |

### Redis Pub/Sub Channels

```typescript
// Distributed system coordination
PUBLISH agent:response:{conversationId} { messageId, personaId, content }
SUBSCRIBE agent:response:*

PUBLISH consensus:reached:{conversationId} { analytics }
SUBSCRIBE consensus:reached:*
```

---

## 7. Security & Rate Limiting

### 7.1 Authentication

**JWT Strategy**:
- Access token (15 min expiry)
- Refresh token (7 days expiry)
- httpOnly cookies for web clients

**Guards**:
```typescript
@UseGuards(JwtAuthGuard)          // REST endpoints
@UseGuards(WsJwtGuard)            // WebSocket connections
@UseGuards(RoleGuard)             // Admin routes
```

### 7.2 Rate Limiting

**Token Bucket (Redis)**:
- Limits LLM tokens per session per minute
- Default: 50,000 tokens/minute per user
- Prevents runaway API costs

**Request Rate Limits**:
- Anonymous: 10 req/min
- Authenticated: 100 req/min
- Premium: 500 req/min

### 7.3 Input Validation

```typescript
class CreateMessageDto {
  @IsString()
  @MaxLength(5000)
  @Transform(sanitizeHtml)
  content: string;

  @IsArray()
  @ArrayMaxSize(5)
  attachmentIds?: string[];
}
```

### 7.4 Sandbox Execution

Code generation by Developer Agent runs in isolated environment:
- No network access
- Limited CPU/Memory
- 5-second timeout
- Uses `vm2` or Docker containers

---

## 8. Frontend Integration Examples

### 8.1 REST API Usage

```typescript
// Fetch conversations
const response = await fetch('/api/conversations?page=1&limit=20', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const { data, pagination } = await response.json();

// Send message
const response = await fetch(`/api/conversations/${conversationId}/messages`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    content: 'I want to build...',
    attachmentIds: ['file-1', 'file-2']
  })
});
```

### 8.2 WebSocket Integration

```typescript
import io from 'socket.io-client';

const socket = io(`${API_URL}/conversations/${conversationId}`, {
  auth: { token: localStorage.getItem('token') }
});

// Listen for agent messages
socket.on('AGENT_STREAM', (data) => {
  appendStreamingText(data.personaId, data.chunk);
});

socket.on('AGENT_MESSAGE', (message) => {
  addMessageToUI(message);
});

socket.on('AGENT_TYPING', (data) => {
  showTypingIndicator(data.personaId);
});

socket.on('METRIC_UPDATE', (metrics) => {
  updateDashboard(metrics);
});

// Send message
socket.emit('START_SESSION', {
  conversationId: conversationId,
  userMessage: message,
  attachments: fileIds
});
```

### 8.3 File Upload

```typescript
const formData = new FormData();
files.forEach(file => formData.append('files', file));

const response = await fetch(`/api/conversations/${conversationId}/upload`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData
});

const { attachments } = await response.json();
```

---

## 9. Implementation Checklist

### Phase 1: Core Infrastructure
- [ ] Set up NestJS project with modular architecture
- [ ] Configure Prisma ORM with PostgreSQL schema
- [ ] Implement RedisModule for distributed locking
- [ ] Set up JWT authentication with refresh tokens
- [ ] Configure CORS and security middleware

### Phase 2: API Development
- [ ] Implement user authentication endpoints
- [ ] Build conversation CRUD operations
- [ ] Create message management APIs
- [ ] Implement file upload with S3/Azure
- [ ] Add pagination and filtering

### Phase 3: Real-Time Communication
- [ ] Set up Socket.IO with namespace management
- [ ] Implement WebSocket authentication guards
- [ ] Build event handlers for agent communication
- [ ] Create streaming response pipeline
- [ ] Add typing indicators and presence

### Phase 4: AI Orchestration
- [ ] Integrate LangGraph state machine
- [ ] Build AgentPersona factory with system prompts
- [ ] Implement consensus engine logic
- [ ] Create conflict detection and tracking
- [ ] Add maximum turn limit (15 turns) safeguard

### Phase 5: RAG & Document Processing
- [ ] Set up PineconeClient for vector search
- [ ] Build file processing pipeline
- [ ] Implement document chunking and embedding
- [ ] Create search tool for agent queries
- [ ] Add citation tracking for RAG responses

### Phase 6: Testing & Deployment
- [ ] Write unit tests (80% coverage)
- [ ] Create integration tests for APIs
- [ ] Build E2E tests for WebSocket flows
- [ ] Set up CI/CD pipeline
- [ ] Configure production monitoring