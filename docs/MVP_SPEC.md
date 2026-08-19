# 🎯 MVP_SPEC.md — VibeAgent Minimum Viable Product

## Purpose

This document is the **single source of truth** for developers and AI coding agents building the VibeAgent MVP. It defines exactly what to build, in what order, with precise file paths, interfaces, and acceptance criteria.

---

## MVP Scope — What We're Building

The MVP delivers a **functional end-to-end pipeline**: Generate → Publish → Monitor → Reply → Score.

### In MVP ✅

| Feature | Description |
|---|---|
| Content Generation | Generate LinkedIn posts using Ollama + Llama 3.1 with RAG |
| Content Publishing | Publish to LinkedIn via Marketing API |
| Content Calendar | View scheduled/published posts in calendar view |
| Webhook Monitoring | Receive LinkedIn comment/message webhooks |
| AI Reply Generation | Generate context-aware replies with conversation memory |
| Human Review Queue | Review and approve/reject AI replies before sending |
| Lead Scoring | Score leads (0-100) based on engagement + intent |
| Lead Pipeline | View leads in Kanban-style pipeline (Cold → SQL) |
| Dashboard | Overview metrics (posts, leads, conversations) |
| Auth | Login via Authentik (admin + manager roles) |

### NOT in MVP ❌

| Feature | When |
|---|---|
| Facebook, Instagram, WhatsApp, Twitter | Phase 2 (post-MVP) |
| Image generation (Stable Diffusion) | Phase 2 |
| A/B testing | Phase 2 |
| CRM integration | Phase 2 |
| Multi-language support | Phase 3 |
| Lead nurture sequences | Phase 3 |
| Competitor monitoring | Phase 3 |

---

## Project Directory Structure (Create This)

```
vibeagent/
├── docker-compose.yml
├── docker-compose.dev.yml
├── .env.example
├── .gitignore
├── README.md
├── PROJECT.md
├── REQUIREMENTS.md
├── ARCHITECTURE.md
├── TECH_STACK.md
├── DATABASE.md
├── API.md
├── AI_RULES.md
├── MVP_SPEC.md
│
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── pyproject.toml
│   ├── alembic.ini
│   ├── alembic/
│   │   ├── env.py
│   │   └── versions/
│   │       └── 001_initial_schema.py
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                         # FastAPI app entry
│   │   ├── config.py                       # pydantic-settings config
│   │   ├── dependencies.py                 # DI providers
│   │   ├── exceptions.py                   # Custom exceptions
│   │   │
│   │   ├── models/                         # SQLAlchemy ORM models
│   │   │   ├── __init__.py
│   │   │   ├── base.py                     # Base model (id, timestamps)
│   │   │   ├── platform.py
│   │   │   ├── campaign.py
│   │   │   ├── post.py
│   │   │   ├── lead.py
│   │   │   ├── conversation.py
│   │   │   ├── message.py
│   │   │   ├── lead_score_event.py
│   │   │   ├── knowledge_doc.py
│   │   │   └── webhook_event.py
│   │   │
│   │   ├── schemas/                        # Pydantic request/response
│   │   │   ├── __init__.py
│   │   │   ├── post.py
│   │   │   ├── lead.py
│   │   │   ├── conversation.py
│   │   │   ├── campaign.py
│   │   │   ├── webhook.py
│   │   │   └── analytics.py
│   │   │
│   │   ├── repositories/                   # Data access layer
│   │   │   ├── __init__.py
│   │   │   ├── base.py
│   │   │   ├── post_repo.py
│   │   │   ├── lead_repo.py
│   │   │   ├── conversation_repo.py
│   │   │   ├── message_repo.py
│   │   │   └── knowledge_repo.py
│   │   │
│   │   ├── services/                       # Business logic
│   │   │   ├── __init__.py
│   │   │   ├── content_service.py
│   │   │   ├── publishing_service.py
│   │   │   ├── lead_service.py
│   │   │   ├── conversation_service.py
│   │   │   └── scoring_service.py
│   │   │
│   │   ├── api/                            # API routes
│   │   │   ├── __init__.py
│   │   │   ├── v1/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── router.py               # Main v1 router
│   │   │   │   ├── posts.py
│   │   │   │   ├── leads.py
│   │   │   │   ├── conversations.py
│   │   │   │   ├── campaigns.py
│   │   │   │   ├── webhooks.py
│   │   │   │   ├── analytics.py
│   │   │   │   ├── knowledge.py
│   │   │   │   └── health.py
│   │   │   └── deps.py
│   │   │
│   │   ├── agents/                         # AI Agents
│   │   │   ├── __init__.py
│   │   │   ├── base.py                     # Base agent class
│   │   │   ├── orchestrator.py             # Main orchestrator
│   │   │   ├── content_generator.py
│   │   │   ├── publisher.py
│   │   │   ├── monitor.py
│   │   │   ├── reply_agent.py
│   │   │   └── lead_qualifier.py
│   │   │
│   │   ├── tools/                          # Agent tools
│   │   │   ├── __init__.py
│   │   │   ├── platform/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── base.py
│   │   │   │   └── linkedin_tool.py
│   │   │   ├── ai/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── rag_tool.py
│   │   │   │   └── sentiment_tool.py
│   │   │   └── utils/
│   │   │       ├── __init__.py
│   │   │       ├── rate_limiter.py
│   │   │       └── platform_formatter.py
│   │   │
│   │   ├── workflows/                      # Hatchet workflows
│   │   │   ├── __init__.py
│   │   │   ├── content_workflow.py
│   │   │   ├── engagement_workflow.py
│   │   │   └── scheduled_publish.py
│   │   │
│   │   ├── prompts/                        # LLM prompt templates
│   │   │   ├── content_generation.j2
│   │   │   ├── reply_generation.j2
│   │   │   ├── lead_scoring.j2
│   │   │   └── sentiment_analysis.j2
│   │   │
│   │   └── middleware/
│   │       ├── __init__.py
│   │       ├── auth.py
│   │       ├── rate_limiter.py
│   │       └── logging.py
│   │
│   └── tests/
│       ├── conftest.py                     # Shared fixtures
│       ├── test_api/
│       ├── test_services/
│       ├── test_agents/
│       └── test_tools/
│
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.js
│   ├── tailwind.config.ts
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx                  # Root layout
│   │   │   ├── page.tsx                    # Redirect to dashboard
│   │   │   ├── (auth)/
│   │   │   │   └── login/page.tsx
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx                # Overview metrics
│   │   │   ├── content/
│   │   │   │   ├── page.tsx                # Content list
│   │   │   │   ├── generate/page.tsx       # AI content generation
│   │   │   │   └── calendar/page.tsx       # Calendar view
│   │   │   ├── leads/
│   │   │   │   ├── page.tsx                # Lead pipeline (Kanban)
│   │   │   │   └── [leadId]/page.tsx       # Lead detail
│   │   │   ├── conversations/
│   │   │   │   ├── page.tsx                # Conversation list
│   │   │   │   └── review/page.tsx         # Human review queue
│   │   │   └── settings/
│   │   │       └── page.tsx                # Platform connections
│   │   ├── components/
│   │   │   ├── ui/                         # shadcn/ui components
│   │   │   ├── layout/
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   ├── Header.tsx
│   │   │   │   └── AppShell.tsx
│   │   │   ├── posts/
│   │   │   │   ├── PostCard.tsx
│   │   │   │   ├── PostEditor.tsx
│   │   │   │   └── ContentCalendar.tsx
│   │   │   ├── leads/
│   │   │   │   ├── LeadCard.tsx
│   │   │   │   ├── LeadPipeline.tsx
│   │   │   │   └── ScoreChart.tsx
│   │   │   └── conversations/
│   │   │       ├── MessageThread.tsx
│   │   │       └── ReviewCard.tsx
│   │   ├── lib/
│   │   │   ├── api.ts                      # API client (fetch wrapper)
│   │   │   ├── auth.ts                     # Auth helpers
│   │   │   └── utils.ts                    # Shared utilities
│   │   └── hooks/
│   │       ├── usePosts.ts
│   │       ├── useLeads.ts
│   │       └── useConversations.ts
│   └── public/
│
├── knowledge-base/
│   ├── brand-guidelines/
│   ├── product-docs/
│   ├── faq/
│   └── templates/
│
├── monitoring/
│   ├── prometheus.yml
│   └── grafana/
│       └── dashboards/
│           └── vibeagent.json
│
└── scripts/
    ├── setup.sh                            # One-command setup
    ├── seed_data.py                        # Seed test data
    └── ingest_knowledge.py                 # Ingest docs into pgvector
```

---

## MVP Build Order (Follow This Sequence)

### Sprint 1: Foundation (Week 1)

**Goal**: Backend boots, database exists, health endpoint works.

| # | Task | Files | Acceptance Criteria |
|---|---|---|---|
| 1.1 | Create `docker-compose.dev.yml` | `docker-compose.dev.yml` | PostgreSQL 16 + pgvector, Redis 7, Ollama start with `docker compose up` |
| 1.2 | Create `.env.example` | `.env.example` | All required env vars documented |
| 1.3 | Bootstrap FastAPI app | `backend/app/main.py`, `config.py` | `uvicorn` starts, `/docs` shows Swagger UI |
| 1.4 | Create SQLAlchemy models | `backend/app/models/*.py` | All tables from DATABASE.md defined |
| 1.5 | Set up Alembic migrations | `alembic/`, `alembic.ini` | `alembic upgrade head` creates all tables |
| 1.6 | Health endpoint | `backend/app/api/v1/health.py` | `GET /api/v1/health` returns service status |
| 1.7 | Create base repository | `backend/app/repositories/base.py` | Generic CRUD operations |
| 1.8 | Create custom exceptions | `backend/app/exceptions.py` | All exception classes from AI_RULES.md |
| 1.9 | Set up structlog | `backend/app/middleware/logging.py` | JSON structured logging on all requests |
| 1.10 | Write conftest + first tests | `backend/tests/conftest.py` | Test DB fixture, async test setup |

**Verification**: `docker compose up` → `curl localhost:8000/api/v1/health` returns `200`.

---

### Sprint 2: Content Generation (Week 2)

**Goal**: User can generate LinkedIn content via API.

| # | Task | Files | Acceptance Criteria |
|---|---|---|---|
| 2.1 | Ollama LLM client wrapper | `backend/app/tools/ai/llm_client.py` | Async calls to Ollama API. Supports model routing (8B vs 70B). |
| 2.2 | RAG tool (pgvector) | `backend/app/tools/ai/rag_tool.py` | Semantic search across knowledge_docs table |
| 2.3 | Knowledge ingestion script | `scripts/ingest_knowledge.py` | Ingest markdown/PDF → chunk → embed → store in pgvector |
| 2.4 | Content generation prompts | `backend/app/prompts/content_generation.j2` | Jinja2 template with platform, tone, brief variables |
| 2.5 | Content Generator Agent | `backend/app/agents/content_generator.py` | Takes brief → RAG context → LLM → returns structured content |
| 2.6 | Content Service | `backend/app/services/content_service.py` | Business logic: generate, save draft, list, update |
| 2.7 | Post Repository | `backend/app/repositories/post_repo.py` | CRUD for posts table |
| 2.8 | Post API routes | `backend/app/api/v1/posts.py` | `POST /generate`, `GET /`, `PUT /{id}`, `POST /{id}/approve` |
| 2.9 | Post schemas | `backend/app/schemas/post.py` | Request/response Pydantic models per API.md |
| 2.10 | Tests | `backend/tests/test_api/test_posts.py` | Generate content, list posts, update draft |

**Verification**: `POST /api/v1/posts/generate` with brief returns AI-generated LinkedIn content.

---

### Sprint 3: Publishing (Week 3)

**Goal**: Approved posts can be published to LinkedIn.

| # | Task | Files | Acceptance Criteria |
|---|---|---|---|
| 3.1 | LinkedIn API tool | `backend/app/tools/platform/linkedin_tool.py` | OAuth 2.0 auth, publish post, upload media |
| 3.2 | Platform base class | `backend/app/tools/platform/base.py` | Abstract interface all platform tools implement |
| 3.3 | Rate limiter utility | `backend/app/tools/utils/rate_limiter.py` | Per-platform rate limiting using Redis |
| 3.4 | Publisher Agent | `backend/app/agents/publisher.py` | Takes approved post → format → publish → store result |
| 3.5 | Publishing Service | `backend/app/services/publishing_service.py` | Publish, schedule, retry logic |
| 3.6 | Content Workflow (Hatchet) | `backend/app/workflows/content_workflow.py` | Durable workflow: generate → approve → publish |
| 3.7 | Scheduled Publish (Hatchet) | `backend/app/workflows/scheduled_publish.py` | Cron job to publish scheduled posts |
| 3.8 | Platform settings API | `backend/app/api/v1/settings.py` | Save/retrieve platform OAuth credentials |
| 3.9 | Publish endpoint | `backend/app/api/v1/posts.py` | `POST /{id}/publish` triggers publishing |
| 3.10 | Tests | `backend/tests/test_tools/test_linkedin.py` | Mock LinkedIn API, test publish flow |

**Verification**: Create post → Approve → Publish → Post appears on LinkedIn with correct post ID stored.

---

### Sprint 4: Monitoring & Replies (Week 4-5)

**Goal**: System receives LinkedIn interactions and generates AI replies.

| # | Task | Files | Acceptance Criteria |
|---|---|---|---|
| 4.1 | Webhook receiver | `backend/app/api/v1/webhooks.py` | Receive LinkedIn webhooks, verify signature |
| 4.2 | Event normalizer | `backend/app/tools/utils/event_normalizer.py` | Normalize webhook payload to unified format |
| 4.3 | Monitor Agent | `backend/app/agents/monitor.py` | Process webhook → classify → create/update lead → queue for reply |
| 4.4 | Lead Repository | `backend/app/repositories/lead_repo.py` | CRUD + upsert by platform_user_id |
| 4.5 | Conversation Repository | `backend/app/repositories/conversation_repo.py` | CRUD + find by lead + add message |
| 4.6 | Reply generation prompts | `backend/app/prompts/reply_generation.j2` | Template with conversation history, lead context, product knowledge |
| 4.7 | Sentiment tool | `backend/app/tools/ai/sentiment_tool.py` | Analyze sentiment of incoming message |
| 4.8 | Reply Agent | `backend/app/agents/reply_agent.py` | Fetch context → RAG → generate reply → check confidence → send or queue |
| 4.9 | Engagement Workflow | `backend/app/workflows/engagement_workflow.py` | Durable: normalize → classify → reply → score |
| 4.10 | Review queue API | `backend/app/api/v1/conversations.py` | `GET /review-queue`, `POST /approve`, `POST /reject` |
| 4.11 | Conversation API | `backend/app/api/v1/conversations.py` | `GET /`, `GET /{id}/messages` |
| 4.12 | Lead API | `backend/app/api/v1/leads.py` | `GET /`, `GET /{id}`, `PUT /{id}` |
| 4.13 | Tests | `backend/tests/test_agents/` | Test reply generation with mock LLM, test webhook processing |

**Verification**: Send a test webhook → Lead created → AI reply generated → Shows in review queue → Approve → Sent to LinkedIn.

---

### Sprint 5: Lead Scoring (Week 5-6)

**Goal**: Leads are automatically scored and staged.

| # | Task | Files | Acceptance Criteria |
|---|---|---|---|
| 5.1 | Lead scoring prompts | `backend/app/prompts/lead_scoring.j2` | Extract BANT signals from conversation |
| 5.2 | Lead Qualifier Agent | `backend/app/agents/lead_qualifier.py` | Score = engagement(0.3) + intent(0.3) + profile(0.2) + recency(0.2) |
| 5.3 | Scoring Service | `backend/app/services/scoring_service.py` | Calculate score, update stage, log events |
| 5.4 | Score event logging | `backend/app/repositories/score_event_repo.py` | Log every score change with reason |
| 5.5 | Auto-stage transitions | `backend/app/services/scoring_service.py` | cold(<20), warm(20-49), hot(50-74), mql(75-89), sql(90+) |
| 5.6 | Lead pipeline API | `backend/app/api/v1/leads.py` | Filter by stage, sort by score |
| 5.7 | Tests | `backend/tests/test_services/test_scoring.py` | Test score calculation, stage transitions |

**Verification**: Lead interacts multiple times → Score increases → Stage transitions from Cold → Warm → Hot.

---

### Sprint 6: Frontend Dashboard (Week 6-8)

**Goal**: Functional web dashboard for all MVP features.

| # | Task | Files | Acceptance Criteria |
|---|---|---|---|
| 6.1 | Bootstrap Next.js app | `frontend/` | `npm run dev` starts dashboard on :3000 |
| 6.2 | shadcn/ui setup | `frontend/components/ui/` | Button, Card, Table, Dialog, Badge components |
| 6.3 | App shell (Sidebar + Header) | `frontend/src/components/layout/` | Sidebar nav: Dashboard, Content, Leads, Conversations, Settings |
| 6.4 | API client | `frontend/src/lib/api.ts` | Typed fetch wrapper with auth headers |
| 6.5 | Auth flow | `frontend/src/app/(auth)/login/` | Authentik OAuth login/logout |
| 6.6 | Dashboard page | `frontend/src/app/dashboard/page.tsx` | Overview cards: total posts, leads, conversations, response time |
| 6.7 | Content generation page | `frontend/src/app/content/generate/page.tsx` | Form: brief, platform, tone → Generate → Edit → Approve |
| 6.8 | Content calendar | `frontend/src/app/content/calendar/page.tsx` | Monthly calendar showing scheduled/published posts |
| 6.9 | Lead pipeline (Kanban) | `frontend/src/app/leads/page.tsx` | Drag-and-drop columns: Cold, Warm, Hot, MQL, SQL |
| 6.10 | Lead detail page | `frontend/src/app/leads/[leadId]/page.tsx` | Lead info, score history chart, conversation threads |
| 6.11 | Conversation inbox | `frontend/src/app/conversations/page.tsx` | List conversations, click to view message thread |
| 6.12 | Review queue | `frontend/src/app/conversations/review/page.tsx` | Pending replies with Approve/Reject/Edit actions |
| 6.13 | Settings page | `frontend/src/app/settings/page.tsx` | Connect LinkedIn, view API keys |

**Verification**: Login → Dashboard shows metrics → Generate content → See in calendar → View leads in pipeline → Review AI replies.

---

### Sprint 7: Polish & Hardening (Week 8)

**Goal**: Production-ready MVP.

| # | Task | Files | Acceptance Criteria |
|---|---|---|---|
| 7.1 | Authentik setup | `docker-compose.yml` | OAuth provider configured, roles created |
| 7.2 | Auth middleware | `backend/app/middleware/auth.py` | JWT validation, role extraction |
| 7.3 | Prometheus metrics | `backend/app/middleware/metrics.py` | Request count, latency, error rate metrics |
| 7.4 | Grafana dashboard | `monitoring/grafana/dashboards/` | Publishing pipeline, engagement, lead funnel |
| 7.5 | Rate limiting middleware | `backend/app/middleware/rate_limiter.py` | Per-endpoint limits from API.md |
| 7.6 | Error handling | `backend/app/main.py` | Global exception handlers → structured error responses |
| 7.7 | Production Docker Compose | `docker-compose.yml` | All services, volumes, networks, health checks |
| 7.8 | Seed script | `scripts/seed_data.py` | Create sample campaigns, posts, leads for demo |
| 7.9 | Integration tests | `backend/tests/` | End-to-end test of full pipeline |
| 7.10 | Documentation review | All `.md` files | All docs accurate and up-to-date |

**Verification**: `docker compose up` → All services healthy → Login → Full feature walkthrough → Grafana shows metrics.

---

## Key Interfaces (For AI Agents)

### LLM Client Interface

```python
class LLMClient:
    """Wrapper around Ollama API for LLM inference."""
    
    async def generate(
        self,
        prompt: str,
        model: str = "llama3.1:8b",
        temperature: float = 0.7,
        max_tokens: int = 2048,
        response_format: type[BaseModel] | None = None,
    ) -> LLMResponse:
        """Generate text completion."""
    
    async def embed(
        self,
        text: str,
        model: str = "all-minilm:l6-v2",
    ) -> list[float]:
        """Generate embedding vector."""
```

### Platform Tool Interface

```python
class PlatformTool(ABC):
    """Abstract base class for all platform API connectors."""
    
    @abstractmethod
    async def publish_post(self, content: str, media_urls: list[str]) -> PublishResult:
        """Publish a post to the platform."""
    
    @abstractmethod
    async def send_reply(self, thread_id: str, content: str) -> SendResult:
        """Send a reply in a conversation thread."""
    
    @abstractmethod
    async def get_profile(self, user_id: str) -> UserProfile:
        """Get a user's profile information."""
```

### Agent Interface

```python
class BaseAgent(ABC):
    """Base class for all VibeAgent agents."""
    
    def __init__(self, llm: LLMClient, tools: list[BaseTool]):
        self.llm = llm
        self.tools = tools
    
    @abstractmethod
    async def execute(self, input_data: dict) -> AgentResult:
        """Execute the agent's main task."""
```

### Repository Interface

```python
class BaseRepository(Generic[ModelT]):
    """Generic repository with standard CRUD operations."""
    
    async def get_by_id(self, id: UUID) -> ModelT | None: ...
    async def get_all(self, skip: int = 0, limit: int = 20) -> list[ModelT]: ...
    async def create(self, data: dict) -> ModelT: ...
    async def update(self, id: UUID, data: dict) -> ModelT: ...
    async def delete(self, id: UUID) -> bool: ...
```

---

## Environment Variables (.env.example)

```env
# ── App ──
APP_NAME=vibeagent
APP_ENV=development
APP_DEBUG=true
APP_SECRET_KEY=change-me-in-production

# ── Database ──
DATABASE_URL=postgresql+asyncpg://vibeagent:vibeagent@localhost:5432/vibeagent
DATABASE_POOL_SIZE=20

# ── Redis ──
REDIS_URL=redis://localhost:6379/0

# ── Ollama ──
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL_PRIMARY=llama3.1:70b
OLLAMA_MODEL_FAST=llama3.1:8b
OLLAMA_EMBED_MODEL=all-minilm:l6-v2

# ── Hatchet ──
HATCHET_CLIENT_TOKEN=your-hatchet-token
HATCHET_HOST=localhost:7077

# ── Authentik ──
AUTHENTIK_BASE_URL=http://localhost:9000
AUTHENTIK_CLIENT_ID=vibeagent
AUTHENTIK_CLIENT_SECRET=change-me

# ── RustFS ──
RUSTFS_ENDPOINT=http://localhost:9001
RUSTFS_ACCESS_KEY=minioadmin
RUSTFS_SECRET_KEY=minioadmin
RUSTFS_BUCKET=vibeagent-media

# ── LinkedIn ──
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=
LINKEDIN_ACCESS_TOKEN=
LINKEDIN_ORGANIZATION_ID=

# ── Webhook ──
WEBHOOK_SECRET=your-webhook-secret

# ── Monitoring ──
PROMETHEUS_ENABLED=true
LOG_LEVEL=INFO
LOG_FORMAT=json
```

---

## Definition of Done (MVP)

The MVP is complete when:

- [ ] `docker compose up` starts all services with zero manual steps
- [ ] User can login via Authentik
- [ ] User can generate LinkedIn post content via AI
- [ ] User can edit and approve generated content
- [ ] User can publish approved content to LinkedIn
- [ ] User can schedule posts for future publishing
- [ ] Content calendar shows scheduled and published posts
- [ ] LinkedIn webhooks are received and processed
- [ ] AI generates contextual replies to comments/DMs
- [ ] Low-confidence replies go to human review queue
- [ ] Human can approve/reject/edit AI replies
- [ ] Leads are created from interactions
- [ ] Leads are scored (0-100) and staged (Cold → SQL)
- [ ] Lead pipeline shows Kanban board
- [ ] Dashboard shows overview metrics
- [ ] Grafana shows system health metrics
- [ ] All P0 requirements from REQUIREMENTS.md are met
- [ ] Test coverage meets minimums from AI_RULES.md
- [ ] Zero critical security issues
- [ ] Documentation is accurate and complete
