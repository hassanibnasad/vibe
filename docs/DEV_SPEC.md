# 👨‍💻 DEV_SPEC.md — VibeAgent Developer & Coding Agent Specification

> **This is the implementation bible.** Every developer and AI coding agent MUST read this before writing a single line of code. It contains exact patterns, boilerplate, and examples for every layer of the application.

---

## Table of Contents

1. [Setup & Run](#1-setup--run)
2. [Backend Patterns](#2-backend-patterns)
3. [Database & Models](#3-database--models)
4. [Repository Layer](#4-repository-layer)
5. [Service Layer](#5-service-layer)
6. [API Route Layer](#6-api-route-layer)
7. [Agent Layer](#7-agent-layer)
8. [Tool Layer](#8-tool-layer)
9. [Workflow Layer (Hatchet)](#9-workflow-layer-hatchet)
10. [Prompt Layer](#10-prompt-layer)
11. [Frontend Patterns](#11-frontend-patterns)
12. [Testing Patterns](#12-testing-patterns)
13. [Error Handling](#13-error-handling)
14. [Environment & Config](#14-environment--config)
15. [Docker & Deployment](#15-docker--deployment)

---

## 1. Setup & Run

### First-time setup

```bash
# 1. Clone
git clone <repo-url> vibeagent && cd vibeagent

# 2. Copy environment
cp .env.example .env

# 3. Start infrastructure (PostgreSQL, Redis, Ollama)
docker compose -f docker-compose.dev.yml up -d

# 4. Backend
cd backend
uv venv
.venv\Scripts\activate          # Windows (or source .venv/bin/activate on Linux/Mac)
uv pip install -e ".[dev]"
uv run alembic upgrade head      # Create database tables
uv run uvicorn app.main:app --reload --port 8000

# 5. Frontend (separate terminal)
cd frontend
npm install
npm run dev

# 6. Seed test data (optional)
python scripts/seed_data.py
```

### Verify

```bash
curl http://localhost:8000/api/v1/health
# → {"status": "healthy", ...}
```

---

## 2. Backend Patterns

### Request Lifecycle

Every API request follows this strict path:

```
HTTP Request
    ↓
Traefik (TLS/Proxy)
    ↓
FastAPI Middleware (logging, auth, rate-limit)
    ↓
API Route (parse request, validate with Pydantic, call service)
    ↓
Service (business logic, orchestrate repos/agents)
    ↓
Repository (database access)  OR  Agent (AI tasks)
    ↓
Response Schema (serialize with Pydantic)
    ↓
HTTP Response
```

### Layer Rules

| Layer | Can Call | Cannot Call |
|---|---|---|
| **API Route** | Service, Schemas | Repository, Agent, Database directly |
| **Service** | Repository, Agent, other Services | API Routes, Schemas |
| **Repository** | Database (SQLAlchemy) | Services, Agents, API Routes |
| **Agent** | Tools, LLM Client, Services | API Routes, Database directly |
| **Tool** | External APIs, LLM Client | Services, Repositories |

---

## 3. Database & Models

### Base Model (All models inherit from this)

```python
# backend/app/models/base.py
import uuid
from datetime import datetime

from sqlalchemy import DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class TimestampMixin:
    """Mixin that adds created_at and updated_at to any model."""

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class BaseModel(Base, TimestampMixin):
    """Abstract base model with UUID primary key and timestamps."""

    __abstract__ = True

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
```

### Example Model: Lead

```python
# backend/app/models/lead.py
from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import CheckConstraint, Integer, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel


class Lead(BaseModel):
    __tablename__ = "leads"
    __table_args__ = (
        UniqueConstraint("platform", "platform_user_id", name="uq_lead_platform_user"),
        CheckConstraint("lead_score >= 0 AND lead_score <= 100", name="ck_lead_score_range"),
    )

    # Identity
    name: Mapped[str | None] = mapped_column(String(255))
    email: Mapped[str | None] = mapped_column(String(255))
    phone: Mapped[str | None] = mapped_column(String(50))
    avatar_url: Mapped[str | None] = mapped_column(String(500))

    # Platform
    platform: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    platform_user_id: Mapped[str] = mapped_column(String(255), nullable=False)
    platform_username: Mapped[str | None] = mapped_column(String(255))
    platform_profile_url: Mapped[str | None] = mapped_column(String(500))

    # Professional
    company: Mapped[str | None] = mapped_column(String(255))
    job_title: Mapped[str | None] = mapped_column(String(255))
    industry: Mapped[str | None] = mapped_column(String(255))
    company_size: Mapped[str | None] = mapped_column(String(50))

    # Scoring
    lead_score: Mapped[int] = mapped_column(Integer, default=0, index=True)
    lead_stage: Mapped[str] = mapped_column(
        String(20), default="cold", nullable=False, index=True
    )

    # Enrichment (JSONB)
    tags: Mapped[dict] = mapped_column(JSONB, default=list)
    pain_points: Mapped[dict] = mapped_column(JSONB, default=list)
    interests: Mapped[dict] = mapped_column(JSONB, default=list)
    metadata: Mapped[dict] = mapped_column(JSONB, default=dict)

    # Source
    source_post_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), nullable=True
    )
    source_type: Mapped[str | None] = mapped_column(String(50))

    # Timestamps
    first_interaction_at: Mapped[datetime] = mapped_column(
        default=datetime.utcnow, nullable=False
    )
    last_interaction_at: Mapped[datetime] = mapped_column(
        default=datetime.utcnow, nullable=False
    )

    # Relationships
    conversations = relationship("Conversation", back_populates="lead", lazy="selectin")
    score_events = relationship("LeadScoreEvent", back_populates="lead", lazy="select")
```

### Model Registration

```python
# backend/app/models/__init__.py
from app.models.base import Base, BaseModel
from app.models.campaign import Campaign
from app.models.conversation import Conversation
from app.models.knowledge_doc import KnowledgeDoc
from app.models.lead import Lead
from app.models.lead_score_event import LeadScoreEvent
from app.models.message import Message
from app.models.platform import Platform
from app.models.post import Post
from app.models.webhook_event import WebhookEvent

__all__ = [
    "Base",
    "BaseModel",
    "Campaign",
    "Conversation",
    "KnowledgeDoc",
    "Lead",
    "LeadScoreEvent",
    "Message",
    "Platform",
    "Post",
    "WebhookEvent",
]
```

---

## 4. Repository Layer

### Base Repository

```python
# backend/app/repositories/base.py
from typing import Generic, TypeVar
from uuid import UUID

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.base import BaseModel

ModelT = TypeVar("ModelT", bound=BaseModel)


class BaseRepository(Generic[ModelT]):
    """Generic repository providing standard CRUD operations."""

    def __init__(self, session: AsyncSession, model_class: type[ModelT]):
        self.session = session
        self.model_class = model_class

    async def get_by_id(self, id: UUID) -> ModelT | None:
        stmt = select(self.model_class).where(self.model_class.id == id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_all(
        self,
        skip: int = 0,
        limit: int = 20,
        order_by: str = "-created_at",
    ) -> list[ModelT]:
        stmt = select(self.model_class)
        # Handle sort direction
        if order_by.startswith("-"):
            column = getattr(self.model_class, order_by[1:])
            stmt = stmt.order_by(column.desc())
        else:
            column = getattr(self.model_class, order_by)
            stmt = stmt.order_by(column.asc())
        stmt = stmt.offset(skip).limit(limit)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def count(self) -> int:
        stmt = select(func.count()).select_from(self.model_class)
        result = await self.session.execute(stmt)
        return result.scalar_one()

    async def create(self, **kwargs) -> ModelT:
        instance = self.model_class(**kwargs)
        self.session.add(instance)
        await self.session.flush()
        await self.session.refresh(instance)
        return instance

    async def update(self, id: UUID, **kwargs) -> ModelT | None:
        instance = await self.get_by_id(id)
        if not instance:
            return None
        for key, value in kwargs.items():
            setattr(instance, key, value)
        await self.session.flush()
        await self.session.refresh(instance)
        return instance

    async def delete(self, id: UUID) -> bool:
        instance = await self.get_by_id(id)
        if not instance:
            return False
        await self.session.delete(instance)
        await self.session.flush()
        return True
```

### Specialized Repository Example: LeadRepository

```python
# backend/app/repositories/lead_repo.py
from uuid import UUID

from sqlalchemy import select, and_

from app.models.lead import Lead
from app.repositories.base import BaseRepository


class LeadRepository(BaseRepository[Lead]):
    """Repository for lead-specific queries."""

    def __init__(self, session):
        super().__init__(session, Lead)

    async def get_by_platform_user(
        self, platform: str, platform_user_id: str
    ) -> Lead | None:
        """Find a lead by their platform identity."""
        stmt = select(Lead).where(
            and_(
                Lead.platform == platform,
                Lead.platform_user_id == platform_user_id,
            )
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def upsert_from_interaction(
        self,
        platform: str,
        platform_user_id: str,
        **extra_fields,
    ) -> Lead:
        """Create or update a lead from a social interaction."""
        lead = await self.get_by_platform_user(platform, platform_user_id)
        if lead:
            for key, value in extra_fields.items():
                if value is not None:
                    setattr(lead, key, value)
            await self.session.flush()
            return lead
        return await self.create(
            platform=platform,
            platform_user_id=platform_user_id,
            **extra_fields,
        )

    async def get_by_stage(self, stage: str, limit: int = 50) -> list[Lead]:
        """Get leads filtered by stage."""
        stmt = (
            select(Lead)
            .where(Lead.lead_stage == stage)
            .order_by(Lead.lead_score.desc())
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_pipeline_counts(self) -> dict[str, int]:
        """Get lead counts per stage for pipeline view."""
        from sqlalchemy import func

        stmt = (
            select(Lead.lead_stage, func.count(Lead.id))
            .group_by(Lead.lead_stage)
        )
        result = await self.session.execute(stmt)
        return {row[0]: row[1] for row in result.all()}
```

---

## 5. Service Layer

### Service Pattern

```python
# backend/app/services/lead_service.py
import structlog
from uuid import UUID

from app.models.lead import Lead
from app.repositories.lead_repo import LeadRepository
from app.repositories.score_event_repo import ScoreEventRepository
from app.schemas.lead import LeadResponse, LeadUpdateRequest, PipelineResponse

logger = structlog.get_logger()


class LeadService:
    """Business logic for lead management."""

    def __init__(
        self,
        lead_repo: LeadRepository,
        score_event_repo: ScoreEventRepository,
    ):
        self.lead_repo = lead_repo
        self.score_event_repo = score_event_repo

    async def get_lead(self, lead_id: UUID) -> Lead:
        """Get a lead by ID. Raises if not found."""
        lead = await self.lead_repo.get_by_id(lead_id)
        if not lead:
            from app.exceptions import LeadNotFoundError
            raise LeadNotFoundError(f"Lead {lead_id} not found")
        return lead

    async def get_leads(
        self,
        stage: str | None = None,
        min_score: int | None = None,
        platform: str | None = None,
        skip: int = 0,
        limit: int = 20,
    ) -> tuple[list[Lead], int]:
        """Get filtered leads with total count."""
        leads = await self.lead_repo.get_all(skip=skip, limit=limit)
        total = await self.lead_repo.count()
        return leads, total

    async def update_lead(self, lead_id: UUID, data: LeadUpdateRequest) -> Lead:
        """Update lead fields."""
        lead = await self.lead_repo.update(
            lead_id,
            **data.model_dump(exclude_unset=True),
        )
        if not lead:
            from app.exceptions import LeadNotFoundError
            raise LeadNotFoundError(f"Lead {lead_id} not found")
        logger.info("lead_updated", lead_id=str(lead_id))
        return lead

    async def update_score(
        self,
        lead_id: UUID,
        new_score: int,
        reason: str,
        event_type: str = "manual",
    ) -> Lead:
        """Update lead score with audit trail."""
        lead = await self.get_lead(lead_id)
        old_score = lead.lead_score
        new_stage = self._calculate_stage(new_score)

        # Update lead
        lead = await self.lead_repo.update(
            lead_id,
            lead_score=new_score,
            lead_stage=new_stage,
        )

        # Log scoring event
        await self.score_event_repo.create(
            lead_id=lead_id,
            event_type=event_type,
            score_before=old_score,
            score_after=new_score,
            score_delta=new_score - old_score,
            reason=reason,
        )

        logger.info(
            "lead_score_updated",
            lead_id=str(lead_id),
            old_score=old_score,
            new_score=new_score,
            new_stage=new_stage,
        )
        return lead

    @staticmethod
    def _calculate_stage(score: int) -> str:
        """Determine lead stage based on score."""
        if score >= 90:
            return "sql"
        elif score >= 75:
            return "mql"
        elif score >= 50:
            return "hot"
        elif score >= 20:
            return "warm"
        return "cold"

    async def get_pipeline(self) -> PipelineResponse:
        """Get lead pipeline data for Kanban view."""
        counts = await self.lead_repo.get_pipeline_counts()
        return PipelineResponse(
            cold=counts.get("cold", 0),
            warm=counts.get("warm", 0),
            hot=counts.get("hot", 0),
            mql=counts.get("mql", 0),
            sql=counts.get("sql", 0),
        )
```

---

## 6. API Route Layer

### Route Pattern

```python
# backend/app/api/v1/leads.py
from uuid import UUID

from fastapi import APIRouter, Depends, Query

from app.api.deps import get_current_user, get_lead_service
from app.schemas.lead import (
    LeadListResponse,
    LeadResponse,
    LeadUpdateRequest,
    PipelineResponse,
)
from app.services.lead_service import LeadService

router = APIRouter(prefix="/leads", tags=["Leads"])


@router.get("", response_model=LeadListResponse)
async def list_leads(
    stage: str | None = Query(None, description="Filter by lead stage"),
    min_score: int | None = Query(None, ge=0, le=100),
    platform: str | None = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    lead_service: LeadService = Depends(get_lead_service),
    current_user=Depends(get_current_user),
) -> LeadListResponse:
    """List leads with optional filtering."""
    skip = (page - 1) * limit
    leads, total = await lead_service.get_leads(
        stage=stage,
        min_score=min_score,
        platform=platform,
        skip=skip,
        limit=limit,
    )
    return LeadListResponse(
        data=[LeadResponse.model_validate(lead) for lead in leads],
        pagination={"page": page, "limit": limit, "total": total},
    )


@router.get("/pipeline", response_model=PipelineResponse)
async def get_pipeline(
    lead_service: LeadService = Depends(get_lead_service),
    current_user=Depends(get_current_user),
) -> PipelineResponse:
    """Get lead pipeline counts for Kanban view."""
    return await lead_service.get_pipeline()


@router.get("/{lead_id}", response_model=LeadResponse)
async def get_lead(
    lead_id: UUID,
    lead_service: LeadService = Depends(get_lead_service),
    current_user=Depends(get_current_user),
) -> LeadResponse:
    """Get a single lead by ID."""
    lead = await lead_service.get_lead(lead_id)
    return LeadResponse.model_validate(lead)


@router.put("/{lead_id}", response_model=LeadResponse)
async def update_lead(
    lead_id: UUID,
    data: LeadUpdateRequest,
    lead_service: LeadService = Depends(get_lead_service),
    current_user=Depends(get_current_user),
) -> LeadResponse:
    """Update a lead's details."""
    lead = await lead_service.update_lead(lead_id, data)
    return LeadResponse.model_validate(lead)
```

### Pydantic Schemas

```python
# backend/app/schemas/lead.py
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class LeadResponse(BaseModel):
    """Lead response schema."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str | None = None
    email: str | None = None
    company: str | None = None
    job_title: str | None = None
    platform: str
    platform_username: str | None = None
    lead_score: int = Field(ge=0, le=100)
    lead_stage: str
    tags: list[str] = []
    last_interaction_at: datetime
    created_at: datetime


class LeadUpdateRequest(BaseModel):
    """Schema for updating a lead."""

    name: str | None = None
    email: str | None = None
    company: str | None = None
    job_title: str | None = None
    tags: list[str] | None = None
    lead_stage: str | None = Field(None, pattern="^(cold|warm|hot|mql|sql)$")


class LeadListResponse(BaseModel):
    """Paginated list of leads."""

    data: list[LeadResponse]
    pagination: dict


class PipelineResponse(BaseModel):
    """Lead pipeline counts."""

    cold: int = 0
    warm: int = 0
    hot: int = 0
    mql: int = 0
    sql: int = 0
```

### Dependency Injection Setup

```python
# backend/app/api/deps.py
from typing import AsyncGenerator

from fastapi import Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.dependencies import get_db_session


async def get_lead_service(
    session: AsyncSession = Depends(get_db_session),
) -> "LeadService":
    from app.repositories.lead_repo import LeadRepository
    from app.repositories.score_event_repo import ScoreEventRepository
    from app.services.lead_service import LeadService

    return LeadService(
        lead_repo=LeadRepository(session),
        score_event_repo=ScoreEventRepository(session),
    )


async def get_current_user(
    # In production: validate JWT from Authentik
    # For MVP dev: return a mock user
) -> dict:
    """Extract and validate the current user from auth token."""
    # TODO: Implement Authentik JWT validation
    return {"id": "dev-user", "role": "admin"}
```

### Main App Setup

```python
# backend/app/main.py
from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_v1_router
from app.config import settings
from app.dependencies import init_db, close_db
from app.exceptions import register_exception_handlers

logger = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown."""
    logger.info("starting_vibeagent", env=settings.APP_ENV)
    await init_db()
    yield
    await close_db()
    logger.info("shutdown_vibeagent")


app = FastAPI(
    title="VibeAgent API",
    description="AI Marketing & Lead Qualification Platform",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(api_v1_router, prefix="/api/v1")

# Register exception handlers
register_exception_handlers(app)
```

```python
# backend/app/api/v1/router.py
from fastapi import APIRouter

from app.api.v1 import posts, leads, conversations, campaigns, webhooks, analytics, health

api_v1_router = APIRouter()

api_v1_router.include_router(health.router)
api_v1_router.include_router(posts.router)
api_v1_router.include_router(leads.router)
api_v1_router.include_router(conversations.router)
api_v1_router.include_router(campaigns.router)
api_v1_router.include_router(webhooks.router)
api_v1_router.include_router(analytics.router)
```

---

## 7. Agent Layer

### Base Agent

```python
# backend/app/agents/base.py
from abc import ABC, abstractmethod
from typing import Any

import structlog
from pydantic import BaseModel

logger = structlog.get_logger()


class AgentResult(BaseModel):
    """Standard result from any agent execution."""

    success: bool
    data: dict = {}
    error: str | None = None


class BaseAgent(ABC):
    """Base class for all VibeAgent agents."""

    name: str = "base_agent"

    def __init__(self, llm_client: "LLMClient"):
        self.llm = llm_client
        self.logger = logger.bind(agent=self.name)

    @abstractmethod
    async def execute(self, **kwargs) -> AgentResult:
        """Execute the agent's main task. Override in subclasses."""
        ...

    async def _call_llm(
        self,
        prompt: str,
        model: str | None = None,
        temperature: float = 0.7,
    ) -> str:
        """Call LLM with logging."""
        self.logger.info("llm_call_start", prompt_length=len(prompt))
        response = await self.llm.generate(
            prompt=prompt,
            model=model,
            temperature=temperature,
        )
        self.logger.info(
            "llm_call_complete",
            response_length=len(response.text),
            tokens_used=response.tokens_used,
            latency_ms=response.latency_ms,
        )
        return response.text
```

### Content Generator Agent

```python
# backend/app/agents/content_generator.py
from app.agents.base import BaseAgent, AgentResult
from app.tools.ai.rag_tool import RAGTool
from app.prompts import load_prompt


class ContentGeneratorAgent(BaseAgent):
    """Generates platform-tailored marketing content."""

    name = "content_generator"

    def __init__(self, llm_client, rag_tool: RAGTool):
        super().__init__(llm_client)
        self.rag = rag_tool
        self.prompt_template = load_prompt("content_generation.j2")

    async def execute(
        self,
        brief: str,
        platform: str,
        tone: str = "professional",
        campaign_context: str | None = None,
    ) -> AgentResult:
        """Generate marketing content for a platform.

        Args:
            brief: What to write about.
            platform: Target platform (linkedin, instagram, etc.).
            tone: Desired tone of voice.
            campaign_context: Optional campaign/brand context.

        Returns:
            AgentResult with generated content.
        """
        # Step 1: Retrieve brand context via RAG
        rag_context = await self.rag.search(
            query=brief,
            doc_types=["brand_guidelines", "product_docs"],
            limit=5,
        )

        # Step 2: Build prompt
        prompt = self.prompt_template.render(
            brief=brief,
            platform=platform,
            tone=tone,
            campaign_context=campaign_context or "",
            brand_context=rag_context.formatted_text,
            platform_guidelines=self._get_platform_guidelines(platform),
        )

        # Step 3: Generate content (use large model for quality)
        from app.config import settings
        response_text = await self._call_llm(
            prompt=prompt,
            model=settings.OLLAMA_MODEL_PRIMARY,
            temperature=0.8,
        )

        # Step 4: Parse structured response
        parsed = self._parse_content(response_text)

        return AgentResult(
            success=True,
            data={
                "content": parsed["content"],
                "hashtags": parsed["hashtags"],
                "cta": parsed["cta"],
                "platform": platform,
            },
        )

    @staticmethod
    def _get_platform_guidelines(platform: str) -> str:
        """Return platform-specific writing guidelines."""
        guidelines = {
            "linkedin": (
                "Professional tone. Max 3000 chars. Use line breaks for readability. "
                "Start with a hook. End with a question or CTA. Use 3-5 hashtags."
            ),
            "instagram": (
                "Casual, visual tone. Max 2200 chars. Use emojis. "
                "First line is the hook. Use 20-30 hashtags at the end."
            ),
            "facebook": (
                "Conversational tone. Max 63,206 chars but keep under 500. "
                "Use questions to drive engagement. 1-3 hashtags."
            ),
            "whatsapp": (
                "Short, conversational. Max 4096 chars. Use emojis sparingly. "
                "Direct and personal. Include clear CTA."
            ),
            "twitter": (
                "Concise and punchy. Max 280 chars. "
                "Use 1-2 hashtags. Thread for longer content."
            ),
        }
        return guidelines.get(platform, "General marketing content.")

    @staticmethod
    def _parse_content(response: str) -> dict:
        """Parse LLM response into structured content."""
        # Try JSON parse first, fallback to text extraction
        import json
        try:
            return json.loads(response)
        except json.JSONDecodeError:
            return {
                "content": response,
                "hashtags": [],
                "cta": "",
            }
```

### Reply Agent

```python
# backend/app/agents/reply_agent.py
from app.agents.base import BaseAgent, AgentResult
from app.tools.ai.rag_tool import RAGTool
from app.tools.ai.sentiment_tool import SentimentTool
from app.prompts import load_prompt


class ReplyAgent(BaseAgent):
    """Generates contextual replies to incoming messages."""

    name = "reply_agent"

    def __init__(self, llm_client, rag_tool: RAGTool, sentiment_tool: SentimentTool):
        super().__init__(llm_client)
        self.rag = rag_tool
        self.sentiment = sentiment_tool
        self.prompt_template = load_prompt("reply_generation.j2")

    async def execute(
        self,
        incoming_message: str,
        conversation_history: list[dict],
        lead_context: dict,
        platform: str,
    ) -> AgentResult:
        """Generate a reply to an incoming message.

        Returns:
            AgentResult with reply text, sentiment, confidence, and review flag.
        """
        # Step 1: Analyze sentiment
        sentiment = await self.sentiment.analyze(incoming_message)

        # Step 2: Get product knowledge via RAG
        rag_context = await self.rag.search(
            query=incoming_message,
            doc_types=["product_docs", "faq"],
            limit=3,
        )

        # Step 3: Build prompt
        prompt = self.prompt_template.render(
            incoming_message=incoming_message,
            conversation_history=conversation_history[-10:],  # Last 10 messages
            lead_name=lead_context.get("name", "there"),
            lead_company=lead_context.get("company", ""),
            platform=platform,
            sentiment=sentiment.label,
            product_knowledge=rag_context.formatted_text,
        )

        # Step 4: Generate reply (use fast model for speed)
        from app.config import settings
        reply_text = await self._call_llm(
            prompt=prompt,
            model=settings.OLLAMA_MODEL_FAST,
            temperature=0.7,
        )

        # Step 5: Assess confidence
        from app.config import settings
        confidence = self._assess_confidence(
            reply_text, sentiment, rag_context.top_score
        )
        requires_review = (
            confidence < settings.REPLY_CONFIDENCE_THRESHOLD
            or sentiment.label == "negative"
            or lead_context.get("lead_score", 0) >= 75  # High-value leads
        )

        return AgentResult(
            success=True,
            data={
                "reply": reply_text,
                "sentiment": sentiment.label,
                "sentiment_score": sentiment.score,
                "confidence": confidence,
                "requires_review": requires_review,
                "review_reason": self._get_review_reason(
                    confidence, sentiment.label, lead_context
                ),
            },
        )

    def _assess_confidence(
        self, reply: str, sentiment, rag_score: float
    ) -> float:
        """Estimate confidence in the generated reply."""
        score = 0.5  # Base confidence

        # Higher RAG match → higher confidence
        if rag_score > 0.8:
            score += 0.3
        elif rag_score > 0.5:
            score += 0.15

        # Short replies are less confident
        if len(reply) < 50:
            score -= 0.1

        # Negative sentiment → lower confidence
        if sentiment.label == "negative":
            score -= 0.2

        return max(0.0, min(1.0, score))

    @staticmethod
    def _get_review_reason(
        confidence: float, sentiment: str, lead_context: dict
    ) -> str | None:
        if confidence < 0.75:
            return f"Low confidence ({confidence:.0%})"
        if sentiment == "negative":
            return "Negative sentiment detected"
        if lead_context.get("lead_score", 0) >= 75:
            return "High-value lead (score >= 75)"
        return None
```

---

## 8. Tool Layer

### LLM Client

```python
# backend/app/tools/ai/llm_client.py
import time
from pydantic import BaseModel
import httpx
import structlog

from app.config import settings

logger = structlog.get_logger()


class LLMResponse(BaseModel):
    text: str
    model: str
    tokens_used: int
    latency_ms: int


class LLMClient:
    """Async client for Ollama LLM API."""

    def __init__(self, base_url: str | None = None):
        self.base_url = base_url or settings.OLLAMA_BASE_URL
        self.client = httpx.AsyncClient(timeout=120.0)

    async def generate(
        self,
        prompt: str,
        model: str | None = None,
        temperature: float = 0.7,
        max_tokens: int = 2048,
    ) -> LLMResponse:
        """Generate text completion via Ollama."""
        model = model or settings.OLLAMA_MODEL_FAST
        start = time.monotonic()

        response = await self.client.post(
            f"{self.base_url}/api/generate",
            json={
                "model": model,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": temperature,
                    "num_predict": max_tokens,
                },
            },
        )
        response.raise_for_status()
        data = response.json()

        latency_ms = int((time.monotonic() - start) * 1000)
        return LLMResponse(
            text=data["response"],
            model=model,
            tokens_used=data.get("eval_count", 0),
            latency_ms=latency_ms,
        )

    async def embed(
        self,
        text: str,
        model: str | None = None,
    ) -> list[float]:
        """Generate embedding vector via Ollama."""
        model = model or settings.OLLAMA_EMBED_MODEL
        response = await self.client.post(
            f"{self.base_url}/api/embeddings",
            json={"model": model, "prompt": text},
        )
        response.raise_for_status()
        return response.json()["embedding"]

    async def close(self):
        await self.client.aclose()
```

### RAG Tool (pgvector)

```python
# backend/app/tools/ai/rag_tool.py
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


class RAGResult(BaseModel):
    documents: list[dict]
    formatted_text: str
    top_score: float


class RAGTool:
    """Retrieval-Augmented Generation using pgvector."""

    def __init__(self, session: AsyncSession, llm_client: "LLMClient"):
        self.session = session
        self.llm = llm_client

    async def search(
        self,
        query: str,
        doc_types: list[str] | None = None,
        limit: int = 5,
        similarity_threshold: float = 0.3,
    ) -> RAGResult:
        """Semantic search across knowledge base."""
        # Generate query embedding
        query_embedding = await self.llm.embed(query)

        # Build pgvector query
        sql = """
            SELECT id, title, content, doc_type,
                   1 - (embedding <=> :embedding::vector) AS similarity
            FROM knowledge_docs
            WHERE 1 - (embedding <=> :embedding::vector) > :threshold
        """
        params = {
            "embedding": str(query_embedding),
            "threshold": similarity_threshold,
        }

        if doc_types:
            sql += " AND doc_type = ANY(:doc_types)"
            params["doc_types"] = doc_types

        sql += " ORDER BY similarity DESC LIMIT :limit"
        params["limit"] = limit

        result = await self.session.execute(text(sql), params)
        rows = result.fetchall()

        documents = [
            {
                "id": str(row.id),
                "title": row.title,
                "content": row.content,
                "doc_type": row.doc_type,
                "similarity": round(row.similarity, 4),
            }
            for row in rows
        ]

        formatted_text = "\n\n---\n\n".join(
            f"[{doc['doc_type']}] {doc['title']}:\n{doc['content']}"
            for doc in documents
        )

        top_score = documents[0]["similarity"] if documents else 0.0

        return RAGResult(
            documents=documents,
            formatted_text=formatted_text,
            top_score=top_score,
        )
```

---

## 9. Workflow Layer (Hatchet)

```python
# backend/app/workflows/engagement_workflow.py
from hatchet_sdk import Hatchet, Context

from app.agents.reply_agent import ReplyAgent
from app.agents.lead_qualifier import LeadQualifierAgent

hatchet = Hatchet()


@hatchet.workflow(on_events=["interaction:received"])
class EngagementWorkflow:
    """Process incoming social media interaction end-to-end."""

    @hatchet.step(timeout="30s")
    async def normalize_event(self, context: Context):
        """Normalize platform webhook into unified format."""
        event = context.workflow_input()
        return {
            "platform": event["platform"],
            "user_id": event["user_id"],
            "message": event["message"],
            "event_type": event.get("event_type", "comment"),
        }

    @hatchet.step(parents=["normalize_event"], retries=3, timeout="60s")
    async def generate_reply(self, context: Context):
        """Generate AI reply using Reply Agent."""
        data = context.step_output("normalize_event")
        # Agent execution happens here
        # Return reply + metadata
        return {"reply": "...", "confidence": 0.85, "requires_review": False}

    @hatchet.step(parents=["generate_reply"], timeout="30s")
    async def send_or_queue(self, context: Context):
        """Send reply if confident, else queue for human review."""
        reply_data = context.step_output("generate_reply")
        if reply_data["requires_review"]:
            return {"action": "queued_for_review"}
        # Send via platform API
        return {"action": "sent"}

    @hatchet.step(parents=["send_or_queue"], timeout="30s")
    async def score_lead(self, context: Context):
        """Update lead score based on interaction."""
        # Lead Qualifier Agent execution
        return {"new_score": 65, "new_stage": "hot"}
```

---

## 10. Prompt Layer

### Prompt Template Example

```jinja2
{# backend/app/prompts/content_generation.j2 #}
{# Version: 2.0 #}
{# Purpose: Generate marketing content for a social media platform #}

You are an expert social media marketer. Generate a marketing post based on the brief below.

## Brief
{{ brief }}

## Target Platform: {{ platform }}
{{ platform_guidelines }}

## Tone: {{ tone }}

{% if campaign_context %}
## Campaign Context
{{ campaign_context }}
{% endif %}

{% if brand_context %}
## Brand Knowledge (Reference Only)
{{ brand_context }}
{% endif %}

## Output Format
Respond with a JSON object:
```json
{
  "content": "The full post text",
  "hashtags": ["#hashtag1", "#hashtag2"],
  "cta": "Call to action text"
}
```

Important:
- Content must be original and engaging
- Follow platform character limits
- Include a compelling hook in the first line
- End with a clear call-to-action
- Respond ONLY with the JSON object, no other text
```

### Prompt Loader

```python
# backend/app/prompts/__init__.py
from pathlib import Path
from jinja2 import Environment, FileSystemLoader

PROMPTS_DIR = Path(__file__).parent

_env = Environment(
    loader=FileSystemLoader(str(PROMPTS_DIR)),
    autoescape=False,
)


def load_prompt(template_name: str):
    """Load a Jinja2 prompt template."""
    return _env.get_template(template_name)
```

---

## 11. Frontend Patterns

### API Client

```typescript
// frontend/src/lib/api.ts
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

class ApiClient {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
    };

    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: { ...headers, ...options.headers },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new ApiError(response.status, error.error?.message || "Unknown error");
    }

    return response.json();
  }

  // Posts
  generateContent(data: GenerateContentRequest) {
    return this.request<GenerateContentResponse>("/posts/generate", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  listPosts(params?: PostFilters) {
    const query = new URLSearchParams(params as any).toString();
    return this.request<PostListResponse>(`/posts?${query}`);
  }

  publishPost(postId: string, scheduledAt?: string) {
    return this.request(`/posts/${postId}/publish`, {
      method: "POST",
      body: JSON.stringify({ scheduled_at: scheduledAt }),
    });
  }

  // Leads
  listLeads(params?: LeadFilters) {
    const query = new URLSearchParams(params as any).toString();
    return this.request<LeadListResponse>(`/leads?${query}`);
  }

  getLead(leadId: string) {
    return this.request<LeadDetail>(`/leads/${leadId}`);
  }

  getPipeline() {
    return this.request<PipelineData>("/leads/pipeline");
  }

  // Conversations
  getReviewQueue() {
    return this.request<ReviewQueueResponse>("/conversations/review-queue");
  }

  approveReply(messageId: string) {
    return this.request(`/conversations/review-queue/${messageId}/approve`, {
      method: "POST",
    });
  }

  // Analytics
  getOverview() {
    return this.request<AnalyticsOverview>("/analytics/overview");
  }
}

export const api = new ApiClient();
```

### TanStack Query Hook Pattern

```typescript
// frontend/src/hooks/useLeads.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useLeads(filters?: LeadFilters) {
  return useQuery({
    queryKey: ["leads", filters],
    queryFn: () => api.listLeads(filters),
  });
}

export function useLead(leadId: string) {
  return useQuery({
    queryKey: ["leads", leadId],
    queryFn: () => api.getLead(leadId),
    enabled: !!leadId,
  });
}

export function usePipeline() {
  return useQuery({
    queryKey: ["leads", "pipeline"],
    queryFn: () => api.getPipeline(),
    refetchInterval: 30_000,  // Refresh every 30s
  });
}

export function useUpdateLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ leadId, data }: { leadId: string; data: LeadUpdate }) =>
      api.updateLead(leadId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
  });
}
```

---

## 12. Testing Patterns

### Test Fixtures

```python
# backend/tests/conftest.py
import asyncio
from uuid import uuid4

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

from app.main import app
from app.models.base import Base
from app.dependencies import get_db_session

TEST_DATABASE_URL = "postgresql+asyncpg://vibeagent:vibeagent@localhost:5432/vibeagent_test"


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="session")
async def test_engine():
    engine = create_async_engine(TEST_DATABASE_URL)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest_asyncio.fixture
async def db_session(test_engine):
    session_factory = async_sessionmaker(test_engine, expire_on_commit=False)
    async with session_factory() as session:
        yield session
        await session.rollback()


@pytest_asyncio.fixture
async def client(db_session):
    async def override_session():
        yield db_session

    app.dependency_overrides[get_db_session] = override_session
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client
    app.dependency_overrides.clear()


# ── Factory Fixtures ──

@pytest_asyncio.fixture
async def sample_lead(db_session):
    """Create a sample lead for testing."""
    from app.models.lead import Lead
    lead = Lead(
        name="Test User",
        platform="linkedin",
        platform_user_id="test-user-123",
        lead_score=50,
        lead_stage="hot",
    )
    db_session.add(lead)
    await db_session.flush()
    return lead
```

### Test Examples

```python
# backend/tests/test_api/test_leads.py
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_list_leads_returns_paginated_results(client: AsyncClient, sample_lead):
    response = await client.get("/api/v1/leads")
    assert response.status_code == 200
    data = response.json()
    assert "data" in data
    assert "pagination" in data
    assert len(data["data"]) >= 1


@pytest.mark.asyncio
async def test_get_lead_returns_lead_detail(client: AsyncClient, sample_lead):
    response = await client.get(f"/api/v1/leads/{sample_lead.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Test User"
    assert data["lead_score"] == 50
    assert data["lead_stage"] == "hot"


@pytest.mark.asyncio
async def test_get_lead_not_found_returns_404(client: AsyncClient):
    from uuid import uuid4
    response = await client.get(f"/api/v1/leads/{uuid4()}")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_update_lead_changes_fields(client: AsyncClient, sample_lead):
    response = await client.put(
        f"/api/v1/leads/{sample_lead.id}",
        json={"company": "Acme Corp", "tags": ["enterprise"]},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["company"] == "Acme Corp"
    assert "enterprise" in data["tags"]


@pytest.mark.asyncio
async def test_get_pipeline_returns_stage_counts(client: AsyncClient, sample_lead):
    response = await client.get("/api/v1/leads/pipeline")
    assert response.status_code == 200
    data = response.json()
    assert "cold" in data
    assert "hot" in data
    assert data["hot"] >= 1
```

---

## 13. Error Handling

```python
# backend/app/exceptions.py
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse


# ── Base Exceptions ──

class VibeAgentError(Exception):
    """Base exception for all VibeAgent errors."""
    status_code: int = 500
    error_code: str = "INTERNAL_ERROR"


class NotFoundError(VibeAgentError):
    status_code = 404
    error_code = "NOT_FOUND"


class ValidationError(VibeAgentError):
    status_code = 400
    error_code = "VALIDATION_ERROR"


class UnauthorizedError(VibeAgentError):
    status_code = 401
    error_code = "UNAUTHORIZED"


class ForbiddenError(VibeAgentError):
    status_code = 403
    error_code = "FORBIDDEN"


# ── Domain Exceptions ──

class LeadNotFoundError(NotFoundError):
    pass


class PostNotFoundError(NotFoundError):
    pass


class LLMError(VibeAgentError):
    status_code = 503
    error_code = "SERVICE_UNAVAILABLE"


class PlatformAPIError(VibeAgentError):
    status_code = 502
    error_code = "PLATFORM_API_ERROR"


# ── Handler Registration ──

def register_exception_handlers(app: FastAPI):
    @app.exception_handler(VibeAgentError)
    async def vibeagent_error_handler(request: Request, exc: VibeAgentError):
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": {
                    "code": exc.error_code,
                    "message": str(exc),
                }
            },
        )
```

---

## 14. Environment & Config

```python
# backend/app/config.py
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
    )

    # App
    APP_NAME: str = "vibeagent"
    APP_ENV: str       # required — development, staging, production
    APP_DEBUG: bool = False
    APP_SECRET_KEY: str  # required — no default

    # Database
    DATABASE_URL: str   # required — no default
    DATABASE_POOL_SIZE: int = 20

    # Redis
    REDIS_URL: str      # required — no default

    # Ollama
    OLLAMA_BASE_URL: str         # required — no default
    OLLAMA_MODEL_PRIMARY: str    # required — no default
    OLLAMA_MODEL_FAST: str       # required — no default
    OLLAMA_EMBED_MODEL: str      # required — no default

    # Agent Thresholds
    REPLY_CONFIDENCE_THRESHOLD: float = 0.75
    MAX_RETRIES: int = 3

    # Hatchet
    HATCHET_CLIENT_TOKEN: str   # required
    HATCHET_HOST: str            # required

    # Authentik
    AUTHENTIK_BASE_URL: str      # required
    AUTHENTIK_CLIENT_ID: str     # required
    AUTHENTIK_CLIENT_SECRET: str # required

    # RustFS
    RUSTFS_ENDPOINT: str         # required
    RUSTFS_ACCESS_KEY: str       # required
    RUSTFS_SECRET_KEY: str       # required
    RUSTFS_BUCKET: str           # required

    # LinkedIn (optional — empty string = not configured)
    LINKEDIN_CLIENT_ID: str = ""
    LINKEDIN_CLIENT_SECRET: str = ""
    LINKEDIN_ACCESS_TOKEN: str = ""

    # Webhook
    WEBHOOK_SECRET: str          # required

    # Monitoring
    PROMETHEUS_ENABLED: bool = True
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "json"


settings = Settings()
```

---

## 15. Docker & Deployment

### Development Docker Compose

```yaml
# docker-compose.dev.yml
version: "3.9"

services:
  postgres:
    image: pgvector/pgvector:pg16
    environment:
      POSTGRES_USER: vibeagent
      POSTGRES_PASSWORD: vibeagent
      POSTGRES_DB: vibeagent
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U vibeagent"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7.4-alpine
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

  ollama:
    image: ollama/ollama:latest
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: all
              capabilities: [gpu]

volumes:
  pgdata:
  ollama_data:
```

### requirements.txt

```
# backend/requirements.txt

# Web Framework
fastapi==0.115.6
uvicorn[standard]==0.34.0
python-multipart==0.0.20

# Database
sqlalchemy[asyncio]==2.0.36
asyncpg==0.30.0
alembic==1.14.1
pgvector==0.3.6

# Validation & Config
pydantic==2.10.4
pydantic-settings==2.7.1

# HTTP Client
httpx==0.28.1

# AI/ML
langchain==0.3.14
langchain-community==0.3.14
sentence-transformers==3.4.1

# Workflow
hatchet-sdk==0.40.3

# Templating
jinja2==3.1.5

# Logging
structlog==24.4.0

# Redis
redis[hiredis]==5.2.1

# Testing
pytest==8.3.4
pytest-asyncio==0.25.0

# Linting
ruff==0.8.6
mypy==1.14.1
```

---

## Quick Reference Card

### Creating a New Feature (Checklist)

```
1. □ Add database model       → backend/app/models/<name>.py
2. □ Create Alembic migration → alembic revision --autogenerate -m "add <name>"
3. □ Add Pydantic schemas     → backend/app/schemas/<name>.py
4. □ Create repository        → backend/app/repositories/<name>_repo.py
5. □ Create service           → backend/app/services/<name>_service.py
6. □ Add DI provider          → backend/app/api/deps.py
7. □ Create API route         → backend/app/api/v1/<name>.py
8. □ Register route           → backend/app/api/v1/router.py
9. □ Write tests              → backend/tests/test_api/test_<name>.py
10. □ Update API.md            → API.md
```

### File Templates Quick Lookup

| I need to... | Copy pattern from |
|---|---|
| Create a new model | [Section 3: Lead model](#3-database--models) |
| Create a new repo | [Section 4: LeadRepository](#4-repository-layer) |
| Create a new service | [Section 5: LeadService](#5-service-layer) |
| Create a new API route | [Section 6: leads.py route](#6-api-route-layer) |
| Create a new agent | [Section 7: ContentGeneratorAgent](#7-agent-layer) |
| Create a new tool | [Section 8: LLMClient / RAGTool](#8-tool-layer) |
| Create a new workflow | [Section 9: EngagementWorkflow](#9-workflow-layer-hatchet) |
| Create a new prompt | [Section 10: content_generation.j2](#10-prompt-layer) |
| Add a frontend hook | [Section 11: useLeads](#11-frontend-patterns) |
| Write a test | [Section 12: test_leads.py](#12-testing-patterns) |
