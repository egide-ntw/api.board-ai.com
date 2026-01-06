# Board AI Backend API Documentation

## Base URL
```
http://localhost:8080/api/v1
```

## Authentication

**Authentication is OPTIONAL** for all Board AI endpoints. You can use the API without logging in.

If you want to associate conversations with a user account, you can optionally authenticate:

### Register User
```http
POST /auth/email/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "StrongPassword123!",
  "firstName": "John",
  "lastName": "Doe"
}
```
# Board AI Backend API (current implementation)

Base URL (local default):
```
http://localhost:3000/api/v1
```
Adjust the host/port if you set `APP_PORT` or run behind a proxy.

Auth: JWT scaffolding exists, but the main endpoints listed below are open right now. When auth is enforced, add the bearer token header shown in Swagger.

---

## Personas

- **List personas** – `GET /personas`
- **Get one persona** – `GET /personas/:id`

Response shape (example):
```json
{
  "success": true,
  "data": [
    {
      "id": "marketing",
      "name": "Marketing Expert",
      "description": "Brand strategy, customer acquisition, and market analysis",
      "color": "#FF6B6B",
      "icon": "MKT",
      "capabilities": ["Market Analysis", "Brand Strategy"],
      "isActive": true
    }
  ]
}
```

---

## Conversations

- **Create** – `POST /conversations`
- **List** – `GET /conversations?page=1&limit=20`
- **Get one** – `GET /conversations/:id`
- **Update** – `PATCH /conversations/:id`
- **Delete** – `DELETE /conversations/:id`

Create request:
```json
{
  "title": "Marketing Strategy Discussion",
  "activePersonas": ["marketing", "developer", "designer"],
  "maxRounds": 3
}
```

List response:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Marketing Strategy Discussion",
      "status": "active",
      "activePersonas": ["marketing", "developer", "designer"],
      "maxRounds": 3,
      "currentRound": 0,
      "createdAt": "2026-01-01T12:00:00.000Z",
      "updatedAt": "2026-01-01T12:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

---

## Messages

Messages are scoped to a conversation.

- **Create** – `POST /conversations/:conversationId/messages`
- **List** – `GET /conversations/:conversationId/messages`

Create request:
```json
{
  "content": "How should we approach our product launch?",
  "attachmentIds": []
}
```

List response:
```json
{
  "success": true,
  "data": [
    {
      "id": "msg-uuid",
      "role": "user",
      "content": "How should we approach our product launch?",
      "createdAt": "2026-01-01T12:01:00.000Z"
    }
  ],
  "total": 1
}
```

---

## Attachments

- **Upload** – `POST /attachments/upload` (multipart form, field name `file`)
- **Get metadata** – `GET /attachments/:id`

Upload response (example):
```json
{
  "success": true,
  "data": {
    "id": "att-uuid",
    "fileName": "product-specs.pdf",
    "fileType": "application/pdf",
    "fileSize": 245760,
    "storagePath": "/uploads/2026/01/01/product-specs.pdf",
    "createdAt": "2026-01-01T12:05:00.000Z"
  }
}
```

---

## WebSockets

- Namespace: `/board`
- Use Socket.IO client to connect. Auth can be added later via the `auth` option when JWT is enforced.

Basic flow:
```javascript
import { io } from 'socket.io-client';
const socket = io('http://localhost:3000/board');

socket.emit('join_conversation', { conversationId: 'uuid' });

socket.on('agent_response', (payload) => {
  // Handle streamed or completed agent messages
});
```

---

## Errors

Standard NestJS error shape:
```json
{
  "statusCode": 400,
  "message": ["title should not be empty"],
  "error": "Bad Request"
}
```

---

## Quick local workflow

1) Start the API (defaults to port 3000).  
2) Hit `GET /api/v1/personas` to confirm the service is up.  
3) Create a conversation, then post messages under it.  
4) Upload a file if you need attachments.  
5) Watch WebSocket events on `/board` if you’re integrating real-time updates.
  "capabilities": [
