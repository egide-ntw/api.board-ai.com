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

**Response (201):**
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

### Login
```http
POST /auth/email/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "StrongPassword123!"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": {
      "id": 2,
      "name": "user"
    },
    "status": {
      "id": 1,
      "name": "active"
    }
  }
}
```

### Get Current User
```http
GET /auth/me
*No authentication required*
```

**Response (200):**
```json
{
  "id": 1,
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": {
    "id": 2,
    "name": "user"
  },
  "status": {
    "id": 1,
    "name": "active"
  }
}
```

---

## Personas

### List All Personas
```http
GET /personas
```
*No authentication required*

**Response (200):**
```json
[
  {
    "id": "marketing",
    "name": "Marketing Expert",
    "description": "Specializes in brand strategy, customer acquisition, and market analysis",
    "systemPrompt": "You are a Marketing Expert with deep knowledge...",
    "color": "#FF6B6B",
    "icon": "MKT",
    "capabilities": [
      "Market Analysis",
      "Brand Strategy",
      "Customer Acquisition",
      "Campaign Planning"
    ],
    "isActive": true,
    "createdAt": "2026-01-01T10:00:00.000Z",
    "updatedAt": "2026-01-01T10:00:00.000Z"
  },
  {
    "id": "developer",
    "name": "Senior Developer",
    "description": "Expert in software architecture, code quality, and technical solutions",
    "color": "#4ECDC4",
    "icon": "DEV",
    "capabilities": [
      "System Architecture",
      "Code Review",
      "Performance Optimization",
      "Technical Feasibility"
    ],
    "isActive": true,
    "createdAt": "2026-01-01T10:00:00.000Z",
    "updatedAt": "2026-01-01T10:00:00.000Z"
  },
  {
    "id": "designer",
    "name": "UX/UI Designer",
    "description": "Focuses on user experience, visual design, and product usability",
    "color": "#95E1D3",
    "icon": "UX",
    "capabilities": [
      "User Experience",
      "Visual Design",
      "Accessibility",
      "Usability Testing"
    ],
    "isActive": true
  },
  {
    "id": "legal",
    "name": "Legal Advisor",
    "description": "Provides legal compliance, risk assessment, and regulatory guidance",
    "color": "#F38181",
    "icon": "LAW",
    "capabilities": [
      "Compliance Review",
      "Risk Assessment",
      "Privacy Law",
      "Contract Analysis"
    ],
    "isActive": true
  },
  {
    "id": "finance",
    "name": "Financial Analyst",
    "description": "Expert in budgeting, financial planning, and ROI analysis",
    "color": "#AA96DA",
    "icon": "FIN",
    "capabilities": [
      "Budget Analysis",
      "ROI Calculation",
      "Cost Optimization",
      "Financial Planning"
    ],
    "isActive": true
  }
]
```

### Get Single Persona
```http
GET /personas/{id}
*No authentication required*
```

**Response (200):**
```json
{
  "id": "marketing",
  "name": "Marketing Expert",
  "description": "Specializes in brand strategy, customer acquisition, and market analysis",
  "systemPrompt": "You are a Marketing Expert with deep knowledge...",
  "color": "#FF6B6B",
  "icon": "MKT",
  "capabilities": [
    "Market Analysis",
    "Brand Strategy",
    "Customer Acquisition",
    "Campaign Planning"
  ],
  "isActive": true,
  "createdAt": "2026-01-01T10:00:00.000Z",
  "updatedAt": "2026-01-01T10:00:00.000Z"
}
```

---

## Conversations

### Create Conversation
```http
POST /conversations
*No authentication required*
Content-Type: application/json

{
  "title": "Marketing Strategy Discussion",
  "activePersonas": ["marketing", "developer", "designer"],
  "maxRounds": 3
}
```

**Response (201):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Marketing Strategy Discussion",
  "status": "ACTIVE",
  "activePersonas": ["marketing", "developer", "designer"],
  "maxRounds": 3,
  "currentRound": 0,
  "user": {
    "id": 1,
    "email": "user@example.com"
  },
  "createdAt": "2026-01-01T12:00:00.000Z",
  "updatedAt": "2026-01-01T12:00:00.000Z"
}
```

### List User Conversations
```http
GET /conversations?page=1&limit=20
*No authentication required*
```

**Response (200):**
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Marketing Strategy Discussion",
      "status": "ACTIVE",
      "activePersonas": ["marketing", "developer", "designer"],
      "maxRounds": 3,
      "currentRound": 1,
      "createdAt": "2026-01-01T12:00:00.000Z",
      "updatedAt": "2026-01-01T12:05:00.000Z",
      "messages": [
        {
          "id": "msg-uuid-1",
          "role": "USER",
          "content": "How should we approach our product launch?",
          "createdAt": "2026-01-01T12:01:00.000Z"
        }
      ]
    }
  ],
  "total": 15,
  "page": 1,
  "limit": 20
}
```

### Get Single Conversation
```http
GET /conversations/{id}
*No authentication required*
```

**Response (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Marketing Strategy Discussion",
  "status": "ACTIVE",
  "activePersonas": ["marketing", "developer", "designer"],
  "maxRounds": 3,
  "currentRound": 1,
  "user": {
    "id": 1,
    "email": "user@example.com"
  },
  "messages": [
    {
      "id": "msg-uuid-1",
      "role": "USER",
      "content": "How should we approach our product launch?",
      "createdAt": "2026-01-01T12:01:00.000Z"
    },
    {
      "id": "msg-uuid-2",
      "role": "AGENT",
      "agentType": "marketing",
      "content": "From a marketing perspective, I recommend...",
      "structuredOutput": {
        "reasoning": "Based on current market trends...",
        "confidence": 0.85,
        "suggestions": [
          "Focus on digital channels",
          "Target Gen Z audience"
        ]
      },
      "roundNumber": 1,
      "createdAt": "2026-01-01T12:02:00.000Z"
    }
  ],
  "createdAt": "2026-01-01T12:00:00.000Z",
  "updatedAt": "2026-01-01T12:05:00.000Z"
}
```

### Update Conversation
```http
PATCH /conversations/{id}
*No authentication required*
Content-Type: application/json

{
  "title": "Updated Marketing Strategy",
  "status": "ARCHIVED"
}
```

**Response (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Updated Marketing Strategy",
  "status": "ARCHIVED",
  "activePersonas": ["marketing", "developer", "designer"],
  "maxRounds": 3,
  "currentRound": 1,
  "updatedAt": "2026-01-01T12:10:00.000Z"
}
```

### Delete Conversation
```http
DELETE /conversations/{id}
*No authentication required*
```

**Response (204):** No content

---

## Messages

### List Messages in Conversation
```http
GET /conversations/{conversationId}/messages
*No authentication required*
```

**Response (200):**
```json
[
  {
    "id": "msg-uuid-1",
    "role": "USER",
    "content": "How should we approach our product launch?",
    "conversation": {
      "id": "550e8400-e29b-41d4-a716-446655440000"
    },
    "createdAt": "2026-01-01T12:01:00.000Z"
  },
  {
    "id": "msg-uuid-2",
    "role": "AGENT",
    "agentType": "marketing",
    "content": "From a marketing perspective, I recommend focusing on digital channels...",
    "structuredOutput": {
      "reasoning": "Based on current market trends and your target audience demographics...",
      "confidence": 0.85,
      "suggestions": [
        "Focus on digital channels with strong ROI",
        "Target Gen Z and Millennial audiences",
        "Leverage social media influencers"
      ]
    },
    "roundNumber": 1,
    "createdAt": "2026-01-01T12:02:00.000Z"
  },
  {
    "id": "msg-uuid-3",
    "role": "AGENT",
    "agentType": "developer",
    "content": "From a technical standpoint, we need to ensure our infrastructure can handle the expected traffic...",
    "structuredOutput": {
      "reasoning": "Considering scalability and performance requirements...",
      "confidence": 0.92,
      "suggestions": [
        "Implement CDN for static assets",
        "Set up auto-scaling infrastructure",
        "Conduct load testing before launch"
      ]
    },
    "roundNumber": 1,
    "createdAt": "2026-01-01T12:02:30.000Z"
  }
]
```

### Create Message
```http
POST /conversations/{conversationId}/messages
*No authentication required*
Content-Type: application/json

{
  "content": "What about the budget considerations?"
}
```

**Response (201):**
```json
{
  "id": "msg-uuid-4",
  "role": "USER",
  "content": "What about the budget considerations?",
  "conversation": {
    "id": "550e8400-e29b-41d4-a716-446655440000"
  },
  "createdAt": "2026-01-01T12:15:00.000Z"
}
```

---

## Orchestration (Multi-Agent Processing)

### Process User Message
This endpoint sends a message and triggers all active AI personas to respond in sequence.

```http
POST /orchestration/conversations/{id}/process
*No authentication required*
Content-Type: application/json

{
  "message": "How should we approach our product launch?"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "msg-uuid-2",
      "role": "AGENT",
      "agentType": "marketing",
      "content": "From a marketing perspective, I recommend focusing on digital channels and building strong brand awareness before the launch. Consider a phased rollout strategy that creates anticipation.",
      "structuredOutput": {
        "reasoning": "Based on current market trends and successful product launches, a digital-first approach with strong pre-launch buzz has shown 40% higher conversion rates. Your target audience is primarily online, making digital channels the most cost-effective choice.",
        "confidence": 0.85,
        "suggestions": [
          "Focus on digital channels with strong ROI",
          "Target Gen Z and Millennial audiences",
          "Leverage social media influencers for authentic reach",
          "Create a countdown campaign to build anticipation"
        ]
      },
      "roundNumber": 1,
      "createdAt": "2026-01-01T12:02:00.000Z"
    },
    {
      "id": "msg-uuid-3",
      "role": "AGENT",
      "agentType": "developer",
      "content": "From a technical standpoint, we need to ensure our infrastructure can handle the expected traffic surge during launch. I recommend implementing a robust scaling strategy and conducting thorough load testing.",
      "structuredOutput": {
        "reasoning": "Product launches typically see 10-50x normal traffic in the first 24 hours. Our current infrastructure can handle 5x load, so we need to prepare for potential bottlenecks and ensure zero downtime during the critical launch window.",
        "confidence": 0.92,
        "suggestions": [
          "Implement CDN for static assets to reduce server load",
          "Set up auto-scaling infrastructure with AWS/GCP",
          "Conduct load testing at 20x expected traffic",
          "Prepare rollback strategy in case of critical issues",
          "Monitor application performance in real-time"
        ]
      },
      "roundNumber": 1,
      "createdAt": "2026-01-01T12:02:30.000Z"
    },
    {
      "id": "msg-uuid-4",
      "role": "AGENT",
      "agentType": "designer",
      "content": "From a UX perspective, the launch experience should be seamless and delightful. Focus on clear messaging, intuitive onboarding, and accessibility to ensure all users can easily engage with the product.",
      "structuredOutput": {
        "reasoning": "First impressions matter significantly - 88% of users won't return after a bad experience. A well-designed launch page with clear value proposition and smooth onboarding flow can increase conversion rates by 35%.",
        "confidence": 0.88,
        "suggestions": [
          "Design clear value proposition above the fold",
          "Create interactive product tour for new users",
          "Ensure mobile-responsive design for all devices",
          "Implement accessible design (WCAG 2.1 AA compliance)",
          "Use micro-interactions to guide user actions"
        ]
      },
      "roundNumber": 1,
      "createdAt": "2026-01-01T12:03:00.000Z"
    }
  ],
  "count": 3
}
```

**WebSocket Events (Emitted during processing):**

The orchestration service also emits real-time WebSocket events:

```javascript
// Connect to WebSocket
const socket = io('http://localhost:8080/board');

// Join conversation room
socket.emit('join_conversation', { conversationId: 'conversation-uuid' });

// Listen for events
socket.on('agent_typing', (data) => {
  // { conversationId, agentType: 'marketing', agentName: 'Marketing Expert' }
});

socket.on('agent_response', (data) => {
  // { conversationId, message: { id, role, agentType, content, structuredOutput, ... } }
});

socket.on('round_completed', (data) => {
  // { conversationId, roundNumber: 1 }
});

socket.on('status_change', (data) => {
  // { conversationId, status: 'COMPLETED' }
});
```

### Generate Discussion Summary
```http
GET /orchestration/conversations/{id}/summary
*No authentication required*
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "summary": "The team discussed the product launch strategy with multiple perspectives:\n\nMarketing Expert emphasized a digital-first approach with strong pre-launch buzz and influencer partnerships to maximize reach and engagement.\n\nSenior Developer highlighted the importance of infrastructure readiness, recommending auto-scaling solutions and thorough load testing to ensure system stability during the traffic surge.\n\nUX/UI Designer focused on creating a seamless and accessible user experience with clear messaging and intuitive onboarding to maximize conversion rates.\n\nKey Consensus: A phased rollout with strong digital presence, robust technical infrastructure, and user-centric design will provide the best foundation for a successful launch."
  }
}
```

---

## Attachments

### Upload File
```http
POST /attachments/upload
*No authentication required*
Content-Type: multipart/form-data

file: [binary file data]
messageId: msg-uuid-1
```

**Response (201):**
```json
{
  "id": "att-uuid-1",
  "fileName": "product-specs.pdf",
  "fileType": "application/pdf",
  "fileSize": 245760,
  "storagePath": "/uploads/2026/01/01/product-specs-1234567890.pdf",
  "publicUrl": "http://localhost:8080/uploads/2026/01/01/product-specs-1234567890.pdf",
  "message": {
    "id": "msg-uuid-1"
  },
  "createdAt": "2026-01-01T12:05:00.000Z"
}
```

### Get Attachment
```http
GET /attachments/{id}
*No authentication required*
```

**Response (200):**
```json
{
  "id": "att-uuid-1",
  "fileName": "product-specs.pdf",
  "fileType": "application/pdf",
  "fileSize": 245760,
  "storagePath": "/uploads/2026/01/01/product-specs-1234567890.pdf",
  "publicUrl": "http://localhost:8080/uploads/2026/01/01/product-specs-1234567890.pdf",
  "message": {
    "id": "msg-uuid-1",
    "content": "Here are the product specifications"
  },
  "createdAt": "2026-01-01T12:05:00.000Z"
}
```

---

## Analytics

### Get Conversation Analytics
```http
GET /analytics/conversations/{id}
*No authentication required*
```

**Response (200):**
```json
{
  "id": "analytics-uuid-1",
  "totalTokens": 1250,
  "promptTokens": 450,
  "completionTokens": 800,
  "estimatedCost": 0.0375,
  "agentParticipation": {
    "marketing": 2,
    "developer": 2,
    "designer": 1
  },
  "conversation": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Marketing Strategy Discussion"
  },
  "createdAt": "2026-01-01T12:00:00.000Z",
  "updatedAt": "2026-01-01T12:10:00.000Z"
}
```

---

## Error Responses

All endpoints may return the following error formats:

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": ["title should not be empty", "activePersonas must be an array"],
  "error": "Bad Request"
}
```

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "Forbidden resource",
  "error": "Forbidden"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Conversation not found",
  "error": "Not Found"
}
```

### 500 Internal Server Error
```json
{
  "statusCode": 500,
  "message": "Internal server error",
  "error": "Internal Server Error"
}
```

---

## Integration Flow Example

### Complete Workflow (Without Authentication)
```javascript
// 1. Get available personas (no auth required)
const personasResponse = await fetch('http://localhost:8080/api/v1/personas');
const personas = await personasResponse.json();

// 2. Create conversation (no auth required)
const conversationResponse = await fetch('http://localhost:8080/api/v1/conversations', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: 'Product Launch Strategy',
    activePersonas: ['marketing', 'developer', 'designer'],
    maxRounds: 3
  })
});
const conversation = await conversationResponse.json();

// 3. Connect to WebSocket (no auth required)
const socket = io('http://localhost:8080/board');

socket.emit('join_conversation', { conversationId: conversation.id });

socket.on('agent_typing', (data) => {
  console.log(`${data.agentName} is typing...`);
});

socket.on('agent_response', (data) => {
  console.log('New response:', data.message);
});

// 4. Process user message (triggers all agents, no auth required)
const processResponse = await fetch(
  `http://localhost:8080/api/v1/orchestration/conversations/${conversation.id}/process`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: 'How should we approach our product launch?'
    })
  }
);
const { data: agentResponses } = await processResponse.json();

// 5. Get analytics (no auth required)
const analyticsResponse = await fetch(
  `http://localhost:8080/api/v1/analytics/conversations/${conversation.id}`
);
const analytics = await analyticsResponse.json();
```

---

## Notes

1. **Authentication**: OPTIONAL - All Board AI endpoints work without authentication. Use auth only if you want to associate conversations with user accounts.
2. **WebSocket**: Real-time updates available at `/board` namespace
3. **Pagination**: List endpoints support `page` and `limit` query parameters
4. **File Upload**: Use `multipart/form-data` for attachment uploads
5. **Token Costs**: GPT-4o pricing: $5/1M input tokens, $15/1M output tokens
6. **Rate Limiting**: Consider implementing rate limiting on production
7. **CORS**: Configure CORS settings for your frontend domain
