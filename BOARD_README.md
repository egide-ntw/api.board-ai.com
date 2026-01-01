# Board AI - Multi-Agent Debate System

A NestJS backend implementing an autonomous multi-agent system where AI personas debate and provide diverse perspectives on user queries.

## 🏗️ Architecture Overview

### Core Modules

#### 1. **Conversations Module**
- **Entity**: `Conversation` - Manages boardroom sessions
- **Features**:
  - Create/Read/Update/Delete conversations
  - Track conversation status (active, archived, completed)
  - Configure max rounds and active personas
  - Store conversation context and metadata
- **Endpoints**:
  - `GET /api/v1/conversations` - List all user conversations
  - `POST /api/v1/conversations` - Create new conversation
  - `GET /api/v1/conversations/:id` - Get conversation details
  - `PATCH /api/v1/conversations/:id` - Update conversation
  - `DELETE /api/v1/conversations/:id` - Delete conversation

#### 2. **Messages Module**
- **Entity**: `Message` - Stores user messages and agent responses
- **Features**:
  - User message storage
  - Agent response storage with structured output
  - Round tracking
  - Support for attachments
- **Endpoints**:
  - `GET /api/v1/conversations/:id/messages` - Get all messages
  - `POST /api/v1/conversations/:id/messages` - Create user message

#### 3. **Personas Module**
- **Entity**: `Persona` - AI agent configurations
- **Default Personas**:
  - 🎤 **Marketing Expert** - Brand strategy, customer acquisition
  - 💻 **Senior Developer** - Technical architecture, code quality
  - 🎨 **UX/UI Designer** - User experience, visual design
  - ⚖️ **Legal Advisor** - Compliance, risk assessment
  - 💰 **Financial Analyst** - Budget analysis, ROI calculation
- **Endpoints**:
  - `GET /api/v1/personas` - List all active personas
  - `GET /api/v1/personas/:id` - Get persona details

#### 4. **Attachments Module**
- **Entity**: `Attachment` - File upload management
- **Features**:
  - Multipart file upload
  - Local and S3 storage support
  - File metadata tracking
- **Endpoints**:
  - `POST /api/v1/attachments/upload` - Upload file
  - `GET /api/v1/attachments/:id` - Get attachment details

#### 5. **Analytics Module**
- **Entity**: `SessionAnalytics` - Tracks conversation metrics
- **Features**:
  - Token usage tracking (prompt/completion)
  - Cost estimation
  - Agent participation metrics
  - Session duration tracking
- **Endpoints**:
  - `GET /api/v1/analytics/conversations/:id` - Get conversation analytics

#### 6. **AI Module**
- **Service**: `AiService` - OpenAI GPT-4o integration
- **Features**:
  - Structured output enforcement (JSON Schema)
  - Agent response generation
  - Discussion summarization
  - Conversation history management

#### 7. **Orchestration Module**
- **Service**: `OrchestrationService` - Multi-agent workflow coordinator
- **Features**:
  - Sequential agent processing
  - Round management
  - Token tracking
  - WebSocket event emission
- **Endpoints**:
  - `POST /api/v1/orchestration/conversations/:id/process` - Process user message
  - `GET /api/v1/orchestration/conversations/:id/summary` - Generate summary

#### 8. **Board Module (WebSocket)**
- **Gateway**: `BoardGateway` - Real-time communication
- **Events**:
  - `join_conversation` - Join conversation room
  - `leave_conversation` - Leave conversation room
  - `agent_typing` - Agent typing indicator
  - `agent_response` - New agent response
  - `round_completed` - Round completion notification
  - `status_change` - Conversation status update

## 📊 Database Schema

### Tables
- `conversations` - Boardroom sessions
- `messages` - User and agent messages
- `attachments` - File uploads
- `personas` - Agent configurations
- `session_analytics` - Usage metrics
- `users` - User accounts (existing)
- `roles` - User roles (existing)
- `statuses` - User statuses (existing)

## 🚀 Getting Started

### Prerequisites
```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
```

### Required Environment Variables
```env
# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=board_ai

# Redis
REDIS_URL=redis://localhost:6379
```

### Database Setup
```bash
# Run migrations
npm run migration:run

# Seed data (includes personas)
npm run seed:run
```

### Run the Application
```bash
# Development
npm run dev

# Production
npm run build
npm run start:prod
```

## 📡 API Usage Example

### 1. Create a Conversation
```bash
POST /api/v1/conversations
Authorization: Bearer <jwt_token>

{
  "title": "Marketing Campaign Discussion",
  "context": "Discuss Q1 2026 marketing strategy",
  "activePersonas": ["marketing", "developer", "designer"],
  "maxRounds": 3
}
```

### 2. Send a Message & Get Agent Responses
```bash
POST /api/v1/orchestration/conversations/{id}/process
Authorization: Bearer <jwt_token>

{
  "message": "What's the best approach for our Q1 marketing campaign?"
}
```

### 3. Connect to WebSocket
```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3000/board');

socket.emit('join_conversation', {
  conversationId: 'conversation-id',
  userId: 'user-id'
});

socket.on('agent_typing', (data) => {
  console.log(`${data.agentType} is typing...`);
});

socket.on('agent_response', (data) => {
  console.log('New response:', data.message);
});
```

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Coverage
npm run test:cov
```

## 📝 Key Features

✅ Multi-agent debate system with 5 specialized personas
✅ Real-time WebSocket communication
✅ GPT-4o structured output enforcement
✅ Token usage tracking and cost estimation
✅ File attachment support
✅ Round-based debate management
✅ Conversation analytics
✅ Redis caching for performance
✅ TypeORM with PostgreSQL
✅ Swagger API documentation
✅ JWT authentication

## 🔧 Tech Stack

- **Framework**: NestJS 9.4
- **Database**: PostgreSQL + TypeORM
- **Cache**: Redis 7.x
- **AI**: OpenAI GPT-4o
- **WebSocket**: Socket.io
- **Auth**: Passport JWT
- **Docs**: Swagger/OpenAPI

## 📚 API Documentation

Once the application is running, visit:
- Swagger UI: http://localhost:3000/docs
- Health Check: http://localhost:3000/

## 🔐 Authentication

All Board API endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

Get a token by registering/logging in through the existing auth endpoints.

## 🎯 Next Steps

- [ ] Implement Pinecone RAG for document search
- [ ] Add LangGraph for advanced agent workflows
- [ ] Implement debate branching and forking
- [ ] Add agent memory and context retention
- [ ] Implement consensus mechanism
- [ ] Add more specialized personas
- [ ] Implement voting and rating system

## 📄 License

UNLICENSED - Private use only
