# 🏗️ ARCHITECTURE.md — VibeAgent

## System Overview

VibeAgent uses a **multi-agent architecture** with 5 specialized AI agents orchestrated by CrewAI/LangGraph, backed by durable workflows (Hatchet), and connected to social platforms via official APIs.

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        🖥️ Frontend (Next.js)                       │
│  Content Calendar │ Lead Pipeline │ Conversations │ Analytics │ CRM │
└────────────┬──────────────────────────────────┬─────────────────────┘
             │            REST / WebSocket       │
             ▼                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      ⚙️ API Layer (FastAPI)                         │
│                                                                     │
│  /api/posts  /api/leads  /api/conversations  /api/webhooks          │
│                                                                     │
│  Auth Middleware (Authentik OIDC) │ Rate Limiter │ Validators        │
└────────┬───────────────┬────────────────┬──────────────┬────────────┘
         │               │                │              │
         ▼               ▼                ▼              ▼
┌─────────────────────────────────────────────────────────────────────┐
│              🤖 Agentic Orchestration (CrewAI / LangGraph)          │
│                                                                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│  │ Content  │ │Publisher │ │ Monitor  │ │  Reply   │ │  Lead    │ │
│  │Generator │ │  Agent   │ │  Agent   │ │  Agent   │ │Qualifier │ │
│  │  Agent   │ │          │ │          │ │          │ │  Agent   │ │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ │
│       │             │            │             │            │       │
│  ┌────┴─────────────┴────────────┴─────────────┴────────────┴────┐ │
│  │              Hatchet (Durable Workflow Engine)                 │ │
│  │  Retries │ Scheduling │ Concurrency │ Event-driven │ Cron     │ │
│  └───────────────────────────────────────────────────────────────┘ │
└────────┬───────────────┬────────────────┬──────────────┬────────────┘
         │               │                │              │
         ▼               ▼                ▼              ▼
┌──────────────┐ ┌──────────────┐ ┌─────────────┐ ┌──────────────────┐
│   🧠 AI Core │ │ 🔌 Platform  │ │ 📦 Storage  │ │ 🔐 Auth          │
│              │ │   APIs       │ │             │ │                  │
│ Ollama/vLLM  │ │ LinkedIn     │ │ PostgreSQL  │ │ Authentik        │
│ LangChain    │ │ Facebook     │ │ + pgvector  │ │ OAuth 2.0 / OIDC │
│ sentence-    │ │ Instagram    │ │ Redis       │ │ RBAC             │
│ transformers │ │ WhatsApp     │ │ RustFS      │ │ SSO              │
│ ComfyUI/SDXL │ │ X/Twitter    │ │             │ │                  │
└──────────────┘ └──────────────┘ └─────────────┘ └──────────────────┘
         │               │                │              │
         ▼               ▼                ▼              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    📊 Observability Layer                            │
│  Prometheus (Metrics) │ Grafana (Dashboards) │ Loki (Logs)          │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Component Architecture

### 1. Frontend Layer

```
frontend/
├── src/app/
│   ├── (auth)/login/          # Authentik OAuth login flow
│   ├── dashboard/             # Main dashboard with overview metrics
│   ├── content/               # Content generation & calendar
│   │   ├── generate/          # AI content generation interface
│   │   ├── calendar/          # Visual content calendar
│   │   └── [postId]/          # Post detail / edit view
│   ├── leads/                 # Lead management
│   │   ├── pipeline/          # Kanban-style lead pipeline
│   │   └── [leadId]/          # Lead detail with conversation history
│   ├── conversations/         # Conversation threads
│   │   ├── inbox/             # Unified inbox across platforms
│   │   └── review/            # Human-in-the-loop review queue
│   ├── analytics/             # Performance analytics & AI insights
│   └── settings/              # Platform connections, team, config
├── src/components/            # Reusable UI components (shadcn/ui)
├── src/lib/                   # API client, auth helpers, utils
└── src/hooks/                 # Custom React hooks
```

**Key Decisions:**
- **Next.js App Router** for file-based routing and server components
- **shadcn/ui** for consistent, accessible component library
- **Recharts** for analytics visualizations
- **WebSocket** for real-time conversation updates

---

### 2. API Layer (FastAPI)

```
backend/app/
├── main.py                    # FastAPI app entry point
├── config.py                  # Settings (pydantic-settings)
├── dependencies.py            # Dependency injection (DB, Redis, Auth)
├── middleware/
│   ├── auth.py                # Authentik OIDC token validation
│   ├── rate_limiter.py        # Per-endpoint rate limiting
│   └── logging.py             # Request/response logging
├── api/
│   ├── v1/
│   │   ├── posts.py           # POST /api/v1/posts (CRUD + generate + publish)
│   │   ├── leads.py           # GET/PUT /api/v1/leads (CRUD + scoring)
│   │   ├── conversations.py   # GET /api/v1/conversations (threads + messages)
│   │   ├── campaigns.py       # POST /api/v1/campaigns (campaign management)
│   │   ├── webhooks.py        # POST /api/v1/webhooks/{platform} (platform webhooks)
│   │   ├── analytics.py       # GET /api/v1/analytics (metrics + insights)
│   │   └── health.py          # GET /api/v1/health (health checks)
│   └── deps.py                # Shared dependencies
├── schemas/                   # Pydantic request/response models
│   ├── post.py
│   ├── lead.py
│   ├── conversation.py
│   └── webhook.py
└── exceptions.py              # Custom exception handlers
```

**Key Decisions:**
- **API versioning** via URL prefix (`/api/v1/`)
- **Pydantic v2** for request/response validation
- **Dependency injection** for database sessions, Redis, and auth context
- **Structured error responses** with error codes

---

### 3. Agent Layer

```
backend/app/agents/
├── orchestrator.py            # Main agent orchestrator (CrewAI/LangGraph)
├── content_generator.py       # Content Generator Agent
├── publisher.py               # Publisher Agent
├── monitor.py                 # Monitor Agent
├── reply_agent.py             # Reply Agent
├── lead_qualifier.py          # Lead Qualifier Agent
└── base.py                    # Base agent class with shared utilities
```

**Agent Communication Pattern:**

```
                    ┌──────────────┐
                    │ Orchestrator │
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
     ┌────────────┐ ┌────────────┐ ┌────────────┐
     │  Content   │ │  Monitor   │ │   Lead     │
     │ Generator  │ │   Agent    │ │ Qualifier  │
     └─────┬──────┘ └─────┬──────┘ └────────────┘
           │               │              ▲
           ▼               ▼              │
     ┌────────────┐ ┌────────────┐        │
     │ Publisher  │ │   Reply    │────────┘
     │   Agent    │ │   Agent    │
     └────────────┘ └────────────┘
```

**Agent → Tool Mapping:**

| Agent | Tools |
|---|---|
| Content Generator | `rag_retrieval`, `image_generation`, `hashtag_generator`, `trend_analyzer` |
| Publisher | `linkedin_publish`, `facebook_publish`, `instagram_publish`, `whatsapp_send`, `twitter_publish`, `media_upload` |
| Monitor | `webhook_receiver`, `poll_platform`, `event_normalizer`, `priority_classifier` |
| Reply Agent | `conversation_retriever`, `rag_retrieval`, `sentiment_analyzer`, `reply_sender` |
| Lead Qualifier | `lead_scorer`, `signal_extractor`, `crm_connector`, `lead_tagger` |

---

### 4. Tools Layer

```
backend/app/tools/
├── platform/
│   ├── base.py                # Abstract platform connector
│   ├── linkedin_tool.py       # LinkedIn Marketing API connector
│   ├── facebook_tool.py       # Meta Graph API connector
│   ├── instagram_tool.py      # Instagram Graph API connector
│   ├── whatsapp_tool.py       # WhatsApp Business Cloud API connector
│   └── twitter_tool.py        # X API v2 connector
├── ai/
│   ├── rag_tool.py            # RAG retrieval tool (pgvector)
│   ├── image_gen_tool.py      # Stable Diffusion XL tool (ComfyUI)
│   └── sentiment_tool.py      # Sentiment analysis tool
└── utils/
    ├── rate_limiter.py        # Per-platform rate limiter
    └── platform_formatter.py  # Content formatter per platform
```

---

### 5. Workflow Layer (Hatchet)

```
backend/app/workflows/
├── content_workflow.py        # Generate → Review → Publish pipeline
├── engagement_workflow.py     # Webhook → Classify → Reply → Score pipeline
├── nurture_workflow.py        # Lead nurture drip sequences
├── scheduled_publish.py       # Cron-based scheduled publishing
└── monitoring_workflow.py     # Platform polling fallback workflow
```

**Example Workflow: Engagement Pipeline**

```python
@hatchet.workflow()
class EngagementWorkflow:
    """Webhook → Normalize → Reply → Score → Route"""

    @hatchet.step()
    async def normalize_event(self, context):
        """Normalize platform-specific webhook into unified format"""

    @hatchet.step(parents=["normalize_event"])
    async def classify_intent(self, context):
        """Classify: question, complaint, interest, spam"""

    @hatchet.step(parents=["classify_intent"], retries=3)
    async def generate_reply(self, context):
        """Generate contextual reply using LLM + RAG"""

    @hatchet.step(parents=["generate_reply"])
    async def human_review(self, context):
        """Route to review queue if high-value lead or low confidence"""

    @hatchet.step(parents=["human_review"], timeout="30s", retries=2)
    async def send_reply(self, context):
        """Send reply via platform API"""

    @hatchet.step(parents=["send_reply"])
    async def score_lead(self, context):
        """Update lead score and stage"""
```

---

### 6. Data Layer

```
backend/app/
├── models/                    # SQLAlchemy ORM models
│   ├── base.py                # Base model with id, timestamps
│   ├── lead.py                # Lead model
│   ├── conversation.py        # Conversation model
│   ├── message.py             # Message model
│   ├── post.py                # Post model
│   ├── campaign.py            # Campaign model
│   └── lead_score_event.py    # Lead scoring event log
├── repositories/              # Data access layer (Repository pattern)
│   ├── lead_repo.py
│   ├── conversation_repo.py
│   ├── message_repo.py
│   └── post_repo.py
├── services/                  # Business logic layer
│   ├── lead_scoring.py
│   ├── content_service.py
│   └── notification_service.py
└── alembic/                   # Database migrations
    └── versions/
```

**Key Decisions:**
- **Repository pattern** to abstract database queries from business logic
- **Alembic** for database migrations
- **pgvector** extension for RAG embeddings in the same PostgreSQL instance
- **SQLAlchemy 2.0** with async support

---

## Data Flow Diagrams

### Flow 1: Content Generation → Publishing

```
User                  API              Content Agent      Publisher Agent     Platform API       DB
 │                     │                    │                   │                  │              │
 │─── POST /posts ────▶│                    │                   │                  │              │
 │   (campaign brief)  │                    │                   │                  │              │
 │                     │── trigger ────────▶│                   │                  │              │
 │                     │                    │── RAG query ─────▶│                  │              │── read brand docs
 │                     │                    │◀── context ───────│                  │              │
 │                     │                    │                   │                  │              │
 │                     │                    │── generate ──────▶│ (LLM)            │              │
 │                     │                    │◀── content ───────│                  │              │
 │                     │                    │                   │                  │              │
 │                     │◀── draft post ─────│                   │                  │              │── save draft
 │◀── review ──────────│                    │                   │                  │              │
 │                     │                    │                   │                  │              │
 │─── approve ────────▶│                    │                   │                  │              │
 │                     │──────────────────────── trigger ──────▶│                  │              │
 │                     │                    │                   │── publish ──────▶│              │
 │                     │                    │                   │◀── post_id ──────│              │
 │                     │                    │                   │                  │              │── update status
 │◀── published ───────│                    │                   │                  │              │
```

### Flow 2: Lead Engagement → Qualification

```
Platform       Webhook        Monitor Agent    Redis Queue     Reply Agent      Lead Qualifier    DB
  │              │                 │               │               │                 │             │
  │── event ────▶│                 │               │               │                 │             │
  │              │── forward ─────▶│               │               │                 │             │
  │              │                 │── normalize ──│               │                 │             │
  │              │                 │── classify ───│               │                 │             │
  │              │                 │── push ──────▶│               │                 │             │
  │              │                 │               │── dequeue ───▶│                 │             │
  │              │                 │               │               │── fetch ctx ───▶│             │── read history
  │              │                 │               │               │── RAG query ───▶│             │── read knowledge
  │              │                 │               │               │── generate ────▶│ (LLM)       │
  │              │                 │               │               │── review? ─────▶│ (optional)  │
  │◀── reply ────│─────────────────│───────────────│───────────────│                 │             │── save message
  │              │                 │               │               │── trigger ─────▶│             │
  │              │                 │               │               │                 │── score ───▶│── update lead
  │              │                 │               │               │                 │── stage ───▶│── update stage
```

---

## Deployment Architecture

```
┌─────────────────────────── Docker Compose ────────────────────────────┐
│                                                                       │
│  ┌────────┐ ┌────────┐ ┌──────────┐ ┌───────┐ ┌────────┐ ┌────────┐ │
│  │Traefik │ │FastAPI │ │ Next.js  │ │Ollama │ │ComfyUI │ │Hatchet │ │
│  │ :443   │ │ :8000  │ │  :3000   │ │:11434 │ │ :8188  │ │ :7077  │ │
│  └───┬────┘ └───┬────┘ └────┬─────┘ └───┬───┘ └───┬────┘ └───┬────┘ │
│      │          │           │           │         │          │       │
│  ┌───┴──────────┴───────────┴───────────┴─────────┴──────────┴────┐  │
│  │                     Docker Network                              │  │
│  └───┬──────────┬───────────┬───────────┬─────────┬──────────┬────┘  │
│      │          │           │           │         │          │       │
│  ┌───┴────┐ ┌───┴────┐ ┌───┴─────┐ ┌───┴────┐ ┌──┴─────┐ ┌─┴─────┐│
│  │Postgres│ │ Redis  │ │ RustFS  │ │Authentik│ │Promethe│ │Grafana ││
│  │+ pgvec │ │  :6379 │ │  :9000  │ │ :9001  │ │us:9090 │ │ :3001  ││
│  │ :5432  │ │        │ │         │ │        │ │        │ │        ││
│  └────────┘ └────────┘ └─────────┘ └────────┘ └────────┘ └────────┘│
└───────────────────────────────────────────────────────────────────────┘
```

---

## Security Architecture

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│  Browser │────▶│ Traefik  │────▶│ FastAPI  │
│          │     │ (TLS)    │     │          │
└──────────┘     └──────────┘     └─────┬────┘
                                        │
                                   ┌────▼────┐
                                   │Authentik│
                                   │(OIDC)   │
                                   └─────────┘

Auth Flow:
1. User → Traefik (HTTPS) → Frontend
2. Frontend → Authentik (OAuth 2.0 login)
3. Authentik → JWT token
4. Frontend → API (Bearer token in header)
5. API → Authentik (validate token)
6. API → Check RBAC permissions
7. API → Execute request
```

**Roles:**

| Role | Permissions |
|---|---|
| `admin` | Full access. Manage users, settings, platform connections. |
| `manager` | Create/edit/publish content. View leads. Approve replies. |
| `viewer` | View-only access to dashboard, analytics, and leads. |

---

## Error Handling Strategy

| Error Type | Strategy |
|---|---|
| Platform API failure | Retry with exponential backoff (max 3 retries). Dead letter queue on final failure. |
| LLM timeout | Retry once with fallback to smaller model (8B). Queue for later if both fail. |
| Webhook delivery failure | Platform retries. Deduplication on our side via event ID. |
| Database connection error | Connection pool with health checks. Circuit breaker. |
| Auth token expired | Auto-refresh. Re-authenticate if refresh fails. |
