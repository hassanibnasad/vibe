# 🗄️ DATABASE.md — VibeAgent

## Overview

VibeAgent uses **PostgreSQL 16** with the **pgvector** extension as its single data store for both relational data and vector embeddings. This eliminates the need for a separate vector database.

**ORM**: SQLAlchemy 2.0 (async)
**Migrations**: Alembic
**Connection Pooling**: asyncpg + SQLAlchemy async engine

---

## Entity Relationship Diagram

```
┌──────────────┐       ┌──────────────────┐       ┌──────────────┐
│   campaigns  │       │      posts       │       │   platforms   │
│──────────────│       │──────────────────│       │──────────────│
│ id (PK)      │◄──┐   │ id (PK)          │   ┌──▶│ id (PK)      │
│ name         │   │   │ campaign_id (FK)──┼───┘   │ name         │
│ description  │   │   │ platform_id (FK)──┼───────│ api_type     │
│ brand_voice  │   │   │ content          │       │ credentials  │
│ target_aud   │   └───┤ media_urls       │       │ rate_limits  │
│ status       │       │ hashtags         │       │ status       │
│ created_at   │       │ status           │       └──────────────┘
│ updated_at   │       │ platform_post_id │
└──────────────┘       │ scheduled_at     │
                       │ published_at     │
                       │ engagement       │
                       │ created_at       │
                       └──────────────────┘

┌──────────────┐       ┌──────────────────┐       ┌──────────────────┐
│    leads     │       │  conversations   │       │    messages      │
│──────────────│       │──────────────────│       │──────────────────│
│ id (PK)      │◄──┐   │ id (PK)          │◄──┐   │ id (PK)          │
│ name         │   │   │ lead_id (FK) ────┼───┘   │ conversation_id  │
│ email        │   │   │ platform_id (FK) │   └───┤ (FK)             │
│ phone        │   │   │ thread_id        │       │ direction        │
│ platform     │   │   │ status           │       │ content          │
│ platform_uid │   │   │ context          │       │ content_type     │
│ company      │   │   │ created_at       │       │ platform         │
│ job_title    │   │   │ updated_at       │       │ sentiment        │
│ lead_score   │   │   └──────────────────┘       │ intent_signals   │
│ lead_stage   │   │                               │ requires_review  │
│ tags         │   │   ┌──────────────────┐       │ reviewed_by      │
│ metadata     │   │   │lead_score_events │       │ created_at       │
│ source_post  │   │   │──────────────────│       └──────────────────┘
│ created_at   │   └───┤ lead_id (FK)     │
│ updated_at   │       │ id (PK)          │
└──────────────┘       │ event_type       │       ┌──────────────────┐
                       │ score_delta      │       │  knowledge_docs  │
                       │ reason           │       │──────────────────│
                       │ created_at       │       │ id (PK)          │
                       └──────────────────┘       │ title            │
                                                  │ content          │
                                                  │ doc_type         │
                                                  │ embedding (vec)  │
                                                  │ metadata         │
                                                  │ created_at       │
                                                  └──────────────────┘
```

---

## Schema Definitions

### Extension Setup

```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgvector";
```

---

### Table: `platforms`

Stores platform connection configurations.

```sql
CREATE TABLE platforms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,        -- linkedin, facebook, instagram, whatsapp, twitter
    display_name VARCHAR(100) NOT NULL,
    api_type VARCHAR(50) NOT NULL,            -- oauth2, page_token, system_token
    credentials JSONB NOT NULL DEFAULT '{}',  -- encrypted tokens, keys (encrypt at app level)
    rate_limits JSONB NOT NULL DEFAULT '{}',  -- { "requests_per_minute": 100, "daily_limit": 1000 }
    webhook_url VARCHAR(500),
    webhook_secret VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'inactive',  -- active, inactive, error
    last_synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_platforms_name ON platforms(name);
CREATE INDEX idx_platforms_status ON platforms(status);
```

---

### Table: `campaigns`

Groups posts under marketing campaigns.

```sql
CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    brand_voice TEXT,                          -- Brand voice guidelines for AI
    target_audience TEXT,                      -- Target audience description
    goals JSONB DEFAULT '[]',                 -- Campaign goals / KPIs
    status VARCHAR(20) NOT NULL DEFAULT 'draft',  -- draft, active, paused, completed
    starts_at TIMESTAMPTZ,
    ends_at TIMESTAMPTZ,
    created_by UUID,                           -- User ID from Authentik
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_created_at ON campaigns(created_at DESC);
```

---

### Table: `posts`

Individual content pieces published to platforms.

```sql
CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
    platform_id UUID REFERENCES platforms(id) ON DELETE CASCADE,
    
    -- Content
    content TEXT NOT NULL,                     -- Post text / caption
    media_urls JSONB DEFAULT '[]',             -- ["https://rustfs.local/image1.jpg"]
    hashtags JSONB DEFAULT '[]',               -- ["#marketing", "#ai"]
    cta TEXT,                                  -- Call to action text
    
    -- Platform-specific
    platform_post_id VARCHAR(255),             -- ID from platform after publishing
    platform_post_url VARCHAR(500),            -- Direct URL to the post
    
    -- Status & Scheduling
    status VARCHAR(20) NOT NULL DEFAULT 'draft',  -- draft, scheduled, publishing, published, failed
    error_message TEXT,                        -- Error details if status=failed
    retry_count INTEGER DEFAULT 0,
    scheduled_at TIMESTAMPTZ,
    published_at TIMESTAMPTZ,
    
    -- Engagement Metrics (updated periodically)
    engagement_metrics JSONB DEFAULT '{}',     -- { "likes": 0, "comments": 0, "shares": 0, "views": 0 }
    
    -- AI Metadata
    generation_prompt TEXT,                    -- The prompt used to generate this content
    variant_group UUID,                        -- Group A/B test variants
    variant_label VARCHAR(10),                 -- 'A', 'B', 'C'
    
    -- Audit
    created_by UUID,
    approved_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_posts_campaign ON posts(campaign_id);
CREATE INDEX idx_posts_platform ON posts(platform_id);
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_posts_scheduled ON posts(scheduled_at) WHERE status = 'scheduled';
CREATE INDEX idx_posts_published ON posts(published_at DESC);
```

---

### Table: `leads`

Contacts identified from social media interactions.

```sql
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identity
    name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    avatar_url VARCHAR(500),
    
    -- Platform Identity
    platform VARCHAR(50) NOT NULL,             -- linkedin, instagram, facebook, whatsapp
    platform_user_id VARCHAR(255) NOT NULL,    -- Platform-specific user ID
    platform_username VARCHAR(255),
    platform_profile_url VARCHAR(500),
    
    -- Professional Info
    company VARCHAR(255),
    job_title VARCHAR(255),
    industry VARCHAR(255),
    company_size VARCHAR(50),                  -- 1-10, 11-50, 51-200, 201-1000, 1000+
    
    -- Lead Scoring
    lead_score INTEGER NOT NULL DEFAULT 0 CHECK (lead_score >= 0 AND lead_score <= 100),
    lead_stage VARCHAR(20) NOT NULL DEFAULT 'cold',  -- cold, warm, hot, mql, sql
    
    -- Enrichment
    tags JSONB DEFAULT '[]',                   -- ["interested-in-enterprise", "decision-maker"]
    pain_points JSONB DEFAULT '[]',            -- Extracted pain points from conversations
    interests JSONB DEFAULT '[]',              -- Extracted interests
    metadata JSONB DEFAULT '{}',               -- Additional enrichment data
    
    -- Source
    source_post_id UUID REFERENCES posts(id) ON DELETE SET NULL,
    source_type VARCHAR(50),                   -- comment, dm, mention, reaction
    
    -- Timestamps
    first_interaction_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_interaction_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    qualified_at TIMESTAMPTZ,                  -- When lead became MQL/SQL
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(platform, platform_user_id)
);

CREATE INDEX idx_leads_platform ON leads(platform);
CREATE INDEX idx_leads_stage ON leads(lead_stage);
CREATE INDEX idx_leads_score ON leads(lead_score DESC);
CREATE INDEX idx_leads_last_interaction ON leads(last_interaction_at DESC);
CREATE INDEX idx_leads_platform_user ON leads(platform, platform_user_id);
```

---

### Table: `conversations`

Conversation threads with leads.

```sql
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    platform_id UUID REFERENCES platforms(id) ON DELETE SET NULL,
    
    platform_thread_id VARCHAR(255),           -- Platform-specific thread/conversation ID
    status VARCHAR(20) NOT NULL DEFAULT 'active',  -- active, paused, escalated, closed
    
    -- AI Context (conversation memory for the reply agent)
    context JSONB DEFAULT '{}',                -- Summary of conversation so far
    topic VARCHAR(255),                        -- Main topic of conversation
    
    -- Metadata
    total_messages INTEGER DEFAULT 0,
    last_message_at TIMESTAMPTZ,
    assigned_to UUID,                          -- Human agent if escalated
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_conversations_lead ON conversations(lead_id);
CREATE INDEX idx_conversations_status ON conversations(status);
CREATE INDEX idx_conversations_last_message ON conversations(last_message_at DESC);
```

---

### Table: `messages`

Individual messages within conversations.

```sql
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    
    -- Content
    direction VARCHAR(10) NOT NULL,            -- inbound, outbound
    content TEXT NOT NULL,
    content_type VARCHAR(20) DEFAULT 'text',   -- text, image, video, carousel
    media_urls JSONB DEFAULT '[]',
    
    -- Platform
    platform VARCHAR(50) NOT NULL,
    platform_message_id VARCHAR(255),          -- Platform-specific message ID
    
    -- AI Analysis
    sentiment VARCHAR(20),                     -- positive, neutral, negative
    sentiment_score FLOAT,                     -- -1.0 to 1.0
    intent_signals JSONB DEFAULT '[]',         -- ["pricing_inquiry", "demo_request", "buying_signal"]
    confidence_score FLOAT,                    -- AI confidence in the generated reply
    
    -- Human Review
    requires_review BOOLEAN DEFAULT FALSE,
    review_status VARCHAR(20),                 -- pending, approved, rejected, edited
    reviewed_by UUID,
    reviewed_at TIMESTAMPTZ,
    original_content TEXT,                     -- If human edited, store original AI reply
    
    -- Metadata
    llm_model VARCHAR(100),                    -- Which model generated this reply
    generation_time_ms INTEGER,                -- Time taken to generate reply
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_direction ON messages(direction);
CREATE INDEX idx_messages_review ON messages(requires_review) WHERE requires_review = TRUE;
CREATE INDEX idx_messages_created ON messages(created_at DESC);
```

---

### Table: `lead_score_events`

Audit trail for lead score changes.

```sql
CREATE TABLE lead_score_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    
    event_type VARCHAR(100) NOT NULL,          -- engagement, intent_signal, profile_update, decay
    score_before INTEGER NOT NULL,
    score_after INTEGER NOT NULL,
    score_delta INTEGER NOT NULL,
    
    reason TEXT NOT NULL,                      -- Human-readable reason for score change
    metadata JSONB DEFAULT '{}',               -- Additional context data
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_score_events_lead ON lead_score_events(lead_id);
CREATE INDEX idx_score_events_created ON lead_score_events(created_at DESC);
```

---

### Table: `knowledge_docs` (RAG)

Documents for the RAG knowledge base, with vector embeddings stored via pgvector.

```sql
CREATE TABLE knowledge_docs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    doc_type VARCHAR(50) NOT NULL,             -- brand_guidelines, product_docs, faq, templates
    
    -- Vector embedding for semantic search
    embedding vector(384),                     -- 384 dimensions for all-MiniLM-L6-v2
    
    -- Metadata
    source_file VARCHAR(500),                  -- Original file path
    metadata JSONB DEFAULT '{}',
    chunk_index INTEGER DEFAULT 0,             -- Chunk number if document was split
    parent_doc_id UUID,                        -- Reference to parent doc if chunked
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- HNSW index for fast approximate nearest neighbor search
CREATE INDEX idx_knowledge_embedding ON knowledge_docs
    USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

CREATE INDEX idx_knowledge_doc_type ON knowledge_docs(doc_type);
```

---

### Table: `webhook_events`

Raw webhook event log for debugging and replay.

```sql
CREATE TABLE webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    platform VARCHAR(50) NOT NULL,
    event_type VARCHAR(100) NOT NULL,          -- comment, message, mention, reaction
    event_id VARCHAR(255),                     -- Platform event ID (for dedup)
    
    raw_payload JSONB NOT NULL,                -- Raw webhook payload
    normalized_payload JSONB,                  -- Normalized event data
    
    processing_status VARCHAR(20) DEFAULT 'pending',  -- pending, processing, processed, failed
    error_message TEXT,
    processed_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(platform, event_id)                -- Deduplication constraint
);

CREATE INDEX idx_webhook_status ON webhook_events(processing_status);
CREATE INDEX idx_webhook_platform ON webhook_events(platform, created_at DESC);
```

---

## Migrations Strategy

- **Tool**: Alembic
- **Auto-generate**: `alembic revision --autogenerate -m "description"`
- **Apply**: `alembic upgrade head`
- **Rollback**: `alembic downgrade -1`
- **Naming Convention**: `YYYY_MM_DD_HHMM_description.py`

### Rules:
1. Every schema change MUST have an Alembic migration
2. Migrations MUST be backward-compatible (no dropping columns in production)
3. Add indexes CONCURRENTLY in production: `CREATE INDEX CONCURRENTLY ...`
4. Large data migrations should be done in batches
5. Always test migrations on a staging database first

---

## Backup Strategy

| What | Method | Frequency |
|---|---|---|
| Full database | `pg_dump` | Daily |
| WAL archiving | Continuous archiving | Real-time |
| Point-in-time recovery | WAL replay | As needed |
| Knowledge base vectors | Included in pg_dump | Daily |
| Media files (RustFS) | RustFS replication / rsync | Daily |
