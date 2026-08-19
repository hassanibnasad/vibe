# 🌐 API.md — VibeAgent

## Overview

- **Base URL**: `http://localhost:8000/api/v1`
- **Auth**: Bearer token (Authentik OIDC JWT)
- **Format**: JSON
- **Versioning**: URL prefix (`/api/v1/`)
- **Docs**: OpenAPI at `/docs` (Swagger) and `/redoc`

---

## Authentication

All endpoints (except `/health` and `/webhooks`) require authentication.

```
Authorization: Bearer <jwt_token>
```

Roles: `admin`, `manager`, `viewer`

---

## Error Response Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable error message",
    "details": [
      {
        "field": "content",
        "message": "Content must not be empty"
      }
    ]
  }
}
```

| HTTP Status | Error Code | Meaning |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Invalid request body |
| 401 | `UNAUTHORIZED` | Missing or invalid token |
| 403 | `FORBIDDEN` | Insufficient permissions |
| 404 | `NOT_FOUND` | Resource not found |
| 409 | `CONFLICT` | Duplicate resource |
| 429 | `RATE_LIMITED` | Too many requests |
| 500 | `INTERNAL_ERROR` | Server error |
| 503 | `SERVICE_UNAVAILABLE` | LLM or external service down |

---

## Endpoints

### Health

#### `GET /api/v1/health`

No auth required.

**Response `200`:**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "services": {
    "database": "up",
    "redis": "up",
    "ollama": "up",
    "hatchet": "up"
  },
  "timestamp": "2026-08-19T00:00:00Z"
}
```

---

### Posts

#### `POST /api/v1/posts/generate`

Generate content using AI. Returns draft post(s).

**Role**: `manager`, `admin`

**Request:**
```json
{
  "campaign_id": "uuid",
  "platforms": ["linkedin", "instagram"],
  "brief": "Announce our new AI marketing tool launch",
  "tone": "professional",
  "include_image": true,
  "variants": 2
}
```

**Response `201`:**
```json
{
  "posts": [
    {
      "id": "uuid",
      "platform": "linkedin",
      "content": "Excited to announce the launch of...",
      "hashtags": ["#AI", "#Marketing", "#Launch"],
      "cta": "Try it free at vibeagent.com",
      "media_urls": ["https://rustfs.local/generated/img1.jpg"],
      "variant_label": "A",
      "status": "draft"
    },
    {
      "id": "uuid",
      "platform": "linkedin",
      "content": "We built something incredible...",
      "hashtags": ["#OpenSource", "#MarTech"],
      "cta": "See it in action →",
      "media_urls": ["https://rustfs.local/generated/img2.jpg"],
      "variant_label": "B",
      "status": "draft"
    }
  ]
}
```

---

#### `GET /api/v1/posts`

List posts with filtering and pagination.

**Role**: `viewer`, `manager`, `admin`

**Query Params:**
| Param | Type | Default | Description |
|---|---|---|---|
| `status` | string | all | `draft`, `scheduled`, `published`, `failed` |
| `platform` | string | all | `linkedin`, `facebook`, `instagram`, `whatsapp`, `twitter` |
| `campaign_id` | UUID | — | Filter by campaign |
| `page` | int | 1 | Page number |
| `limit` | int | 20 | Items per page (max 100) |
| `sort` | string | `-created_at` | Sort field. Prefix `-` for DESC. |

**Response `200`:**
```json
{
  "data": [
    {
      "id": "uuid",
      "campaign_id": "uuid",
      "platform": "linkedin",
      "content": "...",
      "status": "published",
      "published_at": "2026-08-19T10:00:00Z",
      "engagement_metrics": { "likes": 42, "comments": 7, "shares": 3 }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "total_pages": 8
  }
}
```

---

#### `PUT /api/v1/posts/{postId}`

Update a draft post.

**Role**: `manager`, `admin`

**Request:**
```json
{
  "content": "Updated content...",
  "hashtags": ["#updated"],
  "scheduled_at": "2026-08-20T10:00:00Z"
}
```

---

#### `POST /api/v1/posts/{postId}/publish`

Publish a post immediately or schedule it.

**Role**: `manager`, `admin`

**Request:**
```json
{
  "scheduled_at": "2026-08-20T10:00:00Z"
}
```
*Omit `scheduled_at` to publish immediately.*

**Response `200`:**
```json
{
  "id": "uuid",
  "status": "publishing",
  "message": "Post is being published to linkedin"
}
```

---

#### `POST /api/v1/posts/{postId}/approve`

Approve a draft post for publishing.

**Role**: `manager`, `admin`

---

### Leads

#### `GET /api/v1/leads`

List leads with filtering.

**Query Params:**
| Param | Type | Description |
|---|---|---|
| `stage` | string | `cold`, `warm`, `hot`, `mql`, `sql` |
| `platform` | string | Filter by source platform |
| `min_score` | int | Minimum lead score |
| `max_score` | int | Maximum lead score |
| `tags` | string[] | Filter by tags |
| `search` | string | Search name, email, company |
| `sort` | string | `-lead_score`, `-last_interaction_at` |

**Response `200`:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "John Doe",
      "company": "Acme Corp",
      "job_title": "VP Marketing",
      "platform": "linkedin",
      "lead_score": 85,
      "lead_stage": "hot",
      "tags": ["decision-maker", "enterprise"],
      "last_interaction_at": "2026-08-19T15:30:00Z",
      "total_conversations": 3
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 342 }
}
```

---

#### `GET /api/v1/leads/{leadId}`

Get lead detail with recent conversations.

**Response `200`:**
```json
{
  "id": "uuid",
  "name": "John Doe",
  "email": "john@acme.com",
  "company": "Acme Corp",
  "job_title": "VP Marketing",
  "platform": "linkedin",
  "platform_profile_url": "https://linkedin.com/in/johndoe",
  "lead_score": 85,
  "lead_stage": "hot",
  "tags": ["decision-maker", "enterprise"],
  "pain_points": ["manual social media management", "no lead tracking"],
  "interests": ["AI automation", "marketing analytics"],
  "score_history": [
    { "date": "2026-08-15", "score": 20 },
    { "date": "2026-08-17", "score": 55 },
    { "date": "2026-08-19", "score": 85 }
  ],
  "recent_conversations": [
    {
      "id": "uuid",
      "platform": "linkedin",
      "status": "active",
      "last_message_at": "2026-08-19T15:30:00Z",
      "total_messages": 8
    }
  ]
}
```

---

#### `PUT /api/v1/leads/{leadId}`

Update lead details or manually adjust score/stage.

**Role**: `manager`, `admin`

---

### Conversations

#### `GET /api/v1/conversations`

List conversations. Supports filtering by status, platform, lead.

---

#### `GET /api/v1/conversations/{conversationId}/messages`

Get messages in a conversation thread.

**Response `200`:**
```json
{
  "conversation": {
    "id": "uuid",
    "lead": { "id": "uuid", "name": "John Doe", "lead_score": 85 },
    "platform": "linkedin",
    "status": "active"
  },
  "messages": [
    {
      "id": "uuid",
      "direction": "inbound",
      "content": "Hi! Saw your post about AI marketing. Can you tell me more?",
      "sentiment": "positive",
      "created_at": "2026-08-19T14:00:00Z"
    },
    {
      "id": "uuid",
      "direction": "outbound",
      "content": "Thanks for reaching out, John! Happy to share more...",
      "confidence_score": 0.92,
      "review_status": "approved",
      "created_at": "2026-08-19T14:00:45Z"
    }
  ]
}
```

---

#### `GET /api/v1/conversations/review-queue`

Get messages pending human review.

**Role**: `manager`, `admin`

**Response `200`:**
```json
{
  "data": [
    {
      "message_id": "uuid",
      "conversation_id": "uuid",
      "lead": { "id": "uuid", "name": "John Doe", "lead_score": 85 },
      "inbound_message": "What's your enterprise pricing?",
      "suggested_reply": "Great question! Our enterprise plan...",
      "confidence_score": 0.65,
      "reason": "Low confidence — pricing question",
      "platform": "linkedin",
      "created_at": "2026-08-19T15:30:00Z"
    }
  ]
}
```

---

#### `POST /api/v1/conversations/review-queue/{messageId}/approve`

Approve a pending reply.

---

#### `POST /api/v1/conversations/review-queue/{messageId}/reject`

Reject and optionally provide alternative reply.

**Request:**
```json
{
  "alternative_reply": "Custom human-written reply text"
}
```

---

### Campaigns

#### `POST /api/v1/campaigns`

Create a new campaign.

#### `GET /api/v1/campaigns`

List campaigns.

#### `GET /api/v1/campaigns/{campaignId}`

Get campaign detail with associated posts and metrics.

---

### Webhooks (Platform Callbacks)

#### `POST /api/v1/webhooks/meta`

Receive webhooks from Meta (Facebook, Instagram, WhatsApp).

**No auth** — Verified via `X-Hub-Signature-256` header.

#### `POST /api/v1/webhooks/linkedin`

Receive webhooks from LinkedIn.

#### `POST /api/v1/webhooks/twitter`

Receive webhooks from X/Twitter.

---

### Analytics

#### `GET /api/v1/analytics/overview`

Dashboard overview metrics.

**Response `200`:**
```json
{
  "period": "last_30_days",
  "posts": {
    "total": 45,
    "published": 42,
    "scheduled": 3,
    "total_engagement": 1234
  },
  "leads": {
    "total": 342,
    "new_this_period": 67,
    "qualified": 23,
    "by_stage": { "cold": 180, "warm": 89, "hot": 50, "mql": 18, "sql": 5 }
  },
  "conversations": {
    "total": 156,
    "active": 34,
    "avg_response_time_seconds": 45
  }
}
```

#### `GET /api/v1/analytics/content-performance`

Content performance analytics with AI insights.

---

### Knowledge Base

#### `POST /api/v1/knowledge/ingest`

Upload documents to the RAG knowledge base.

**Role**: `admin`

**Request**: `multipart/form-data`
```
file: brand-guidelines.pdf
doc_type: brand_guidelines
```

#### `GET /api/v1/knowledge/search`

Semantic search across the knowledge base.

**Query Params:**
| Param | Type | Description |
|---|---|---|
| `query` | string | Search query |
| `doc_type` | string | Filter by doc type |
| `limit` | int | Max results (default 5) |

---

## WebSocket API

### `WS /api/v1/ws/conversations`

Real-time conversation updates.

**Events:**
```json
{"type": "new_message", "conversation_id": "uuid", "message": {...}}
{"type": "lead_scored", "lead_id": "uuid", "new_score": 85, "new_stage": "hot"}
{"type": "review_needed", "message_id": "uuid", "reason": "..."}
{"type": "post_published", "post_id": "uuid", "platform": "linkedin"}
```

---

## Rate Limits

| Endpoint | Limit |
|---|---|
| `POST /posts/generate` | 10 requests/minute |
| `POST /posts/{id}/publish` | 30 requests/minute |
| `GET /leads` | 60 requests/minute |
| `GET /conversations` | 60 requests/minute |
| `POST /knowledge/ingest` | 5 requests/minute |
| All other endpoints | 120 requests/minute |
