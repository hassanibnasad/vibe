#!/usr/bin/env python
"""Seed script for rapid local development.

Populates the database with:
  1. Platform records  — LinkedIn active, others inactive.
  2. Campaign record   — demo B2B SaaS campaign.
  3. KnowledgeDoc records — sample brand/product knowledge (no vector embeddings;
     run the ingestion pipeline to compute real embeddings).
  4. Lead records across all funnel stages (cold → sql).
  5. Conversation + message threads tied to leads.

Usage:
    python backend/scripts/seed_dev_data.py

The script is idempotent: it uses upsert-style ON CONFLICT DO NOTHING so it
can safely be re-run after a fresh migration without duplicating data.

Requirements: DATABASE_URL in environment or .env file.
"""

from __future__ import annotations

import asyncio
import sys
import uuid
from datetime import UTC, datetime, timedelta
from pathlib import Path

# Allow running from repo root
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import text
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.config import settings

# ── Fixed UUIDs (stable across re-runs) ───────────────────────────────────────
TENANT_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")
OPERATOR_ID = uuid.UUID("00000000-0000-0000-0000-000000000002")

PLATFORM_LINKEDIN_ID = uuid.UUID("11000000-0000-0000-0000-000000000001")
PLATFORM_TWITTER_ID  = uuid.UUID("11000000-0000-0000-0000-000000000002")
PLATFORM_THREADS_ID  = uuid.UUID("11000000-0000-0000-0000-000000000003")

CAMPAIGN_ID = uuid.UUID("22000000-0000-0000-0000-000000000001")

LEAD_COLD_ID  = uuid.UUID("33000000-0000-0000-0000-000000000001")
LEAD_WARM_ID  = uuid.UUID("33000000-0000-0000-0000-000000000002")
LEAD_HOT_ID   = uuid.UUID("33000000-0000-0000-0000-000000000003")
LEAD_MQL_ID   = uuid.UUID("33000000-0000-0000-0000-000000000004")
LEAD_SQL_ID   = uuid.UUID("33000000-0000-0000-0000-000000000005")

CONV_COLD_ID  = uuid.UUID("44000000-0000-0000-0000-000000000001")
CONV_HOT_ID   = uuid.UUID("44000000-0000-0000-0000-000000000003")
CONV_SQL_ID   = uuid.UUID("44000000-0000-0000-0000-000000000005")


async def seed(engine) -> None:
    async_session = async_sessionmaker(engine, expire_on_commit=False)
    async with async_session() as session:
        now = datetime.now(UTC)

        # ── 1. Platforms ───────────────────────────────────────────────────────
        print("  → seeding platforms...")
        await session.execute(text("""
            INSERT INTO platforms (id, name, display_name, api_type, status, credentials, rate_limits, created_at, updated_at)
            VALUES
                (:li_id,  'linkedin', 'LinkedIn',  'oauth2', 'active',   '{}', '{"per_day": 100}', now(), now()),
                (:tw_id,  'twitter',  'Twitter/X', 'oauth2', 'inactive', '{}', '{"per_day": 300}', now(), now()),
                (:th_id,  'threads',  'Threads',   'oauth2', 'inactive', '{}', '{"per_day": 200}', now(), now())
            ON CONFLICT (name) DO NOTHING
        """), {
            "li_id": PLATFORM_LINKEDIN_ID,
            "tw_id": PLATFORM_TWITTER_ID,
            "th_id": PLATFORM_THREADS_ID,
        })

        # ── 2. Campaign ────────────────────────────────────────────────────────
        print("  → seeding campaign...")
        await session.execute(text("""
            INSERT INTO campaigns (id, tenant_id, name, description, status, target_audience, content_themes, created_at, updated_at)
            VALUES (
                :id, :tenant_id,
                'VibeAgent Demo Campaign',
                'Automated LinkedIn thought leadership for B2B SaaS teams',
                'active',
                '{"industries": ["SaaS", "FinTech"], "company_sizes": ["50-200", "200-500"], "job_titles": ["VP Marketing", "CMO", "Head of Growth"]}',
                '["AI automation", "marketing ROI", "content at scale", "LinkedIn organic growth"]',
                now(), now()
            )
            ON CONFLICT (id) DO NOTHING
        """), {"id": CAMPAIGN_ID, "tenant_id": TENANT_ID})

        # ── 3. KnowledgeDocs (text only — no vector embedding) ────────────────
        print("  → seeding knowledge docs...")
        kdocs = [
            {
                "id": uuid.UUID("55000000-0000-0000-0000-000000000001"),
                "title": "VibeAgent Product Overview",
                "source_url": "https://vibeagent.io/about",
                "content": (
                    "VibeAgent is an AI-powered marketing automation platform for B2B SaaS companies. "
                    "It automates LinkedIn content generation, lead qualification using BANT methodology, "
                    "and intelligent reply suggestions — all without requiring a dedicated marketing team. "
                    "Key differentiators: zero-GPU inference via Groq, fastembed for local RAG, "
                    "and a human-in-the-loop review queue before any content goes live."
                ),
                "doc_type": "product_overview",
            },
            {
                "id": uuid.UUID("55000000-0000-0000-0000-000000000002"),
                "title": "Ideal Customer Profile",
                "source_url": "https://vibeagent.io/icp",
                "content": (
                    "Our ideal customer is a B2B SaaS company with 50–500 employees, a sales-led motion, "
                    "and a marketing team of 2–5 people. They struggle with LinkedIn content consistency, "
                    "spend 10+ hours/week on manual outreach, and have a CAC > $5,000. "
                    "Common pain points: inconsistent posting schedule, poor engagement rates (<2%), "
                    "no systematic lead qualification from social comments."
                ),
                "doc_type": "icp",
            },
            {
                "id": uuid.UUID("55000000-0000-0000-0000-000000000003"),
                "title": "Pricing and ROI Calculator",
                "source_url": "https://vibeagent.io/pricing",
                "content": (
                    "VibeAgent is priced at $499/month for Starter (1 LinkedIn profile, 20 posts/month) "
                    "and $1,499/month for Growth (3 profiles, unlimited posts, BANT scoring). "
                    "Average customer sees 3x engagement increase in 60 days and qualifies 8–12 leads/month "
                    "from LinkedIn alone. ROI typically achieved within 90 days."
                ),
                "doc_type": "pricing",
            },
        ]
        for kd in kdocs:
            await session.execute(text("""
                INSERT INTO knowledge_docs (
                    id, tenant_id, title, source_url, content, doc_type,
                    embedding_status, chunk_count, metadata, created_at, updated_at
                )
                VALUES (
                    :id, :tenant_id, :title, :source_url, :content, :doc_type,
                    'pending', 0, '{}', now(), now()
                )
                ON CONFLICT (id) DO NOTHING
            """), {"tenant_id": TENANT_ID, **kd})

        # ── 4. Leads ───────────────────────────────────────────────────────────
        print("  → seeding leads across funnel stages...")
        leads = [
            # score=5 → cold
            {
                "id": LEAD_COLD_ID, "name": "Sarah Chen", "company": "CloudMetrics Inc",
                "job_title": "Marketing Manager", "industry": "SaaS", "company_size": "50-200",
                "platform": "linkedin", "platform_user_id": "li_sarah_chen_001",
                "platform_username": "sarahchen_cm", "lead_score": 5, "lead_stage": "cold",
                "pain_points": '["inconsistent posting"]', "interests": '["AI content"]',
                "budget": "null", "authority": "null", "need": "null", "timeline": "null",
                "is_qualified": False,
            },
            # score=30 → warm
            {
                "id": LEAD_WARM_ID, "name": "Marcus Rivera", "company": "Nexus Analytics",
                "job_title": "VP of Marketing", "industry": "FinTech", "company_size": "200-500",
                "platform": "linkedin", "platform_user_id": "li_marcus_rivera_002",
                "platform_username": "marcusr_nexus", "lead_score": 30, "lead_stage": "warm",
                "pain_points": '["low LinkedIn engagement", "manual outreach"]', "interests": '["marketing automation", "ROI"]',
                "budget": "null", "authority": '{"role": "VP Marketing", "is_decision_maker": true}',
                "need": "null", "timeline": "null", "is_qualified": False,
            },
            # score=55 → hot
            {
                "id": LEAD_HOT_ID, "name": "Priya Nair", "company": "ScaleOps Ltd",
                "job_title": "CMO", "industry": "HR Tech", "company_size": "200-500",
                "platform": "linkedin", "platform_user_id": "li_priya_nair_003",
                "platform_username": "priyanair_so", "lead_score": 55, "lead_stage": "hot",
                "pain_points": '["content consistency", "lead qual bottleneck"]', "interests": '["AI", "growth hacking"]',
                "budget": '{"amount": 2000, "currency": "USD", "notes": "monthly budget available"}',
                "authority": '{"role": "CMO", "is_decision_maker": true}',
                "need": '{"core_problem": "needs automated linkedin content and lead scoring"}',
                "timeline": "null", "is_qualified": False,
            },
            # score=78 → mql
            {
                "id": LEAD_MQL_ID, "name": "James Okoye", "company": "TechForce Solutions",
                "job_title": "Head of Growth", "industry": "B2B SaaS", "company_size": "50-200",
                "platform": "linkedin", "platform_user_id": "li_james_okoye_004",
                "platform_username": "jamesokoye_tf", "lead_score": 78, "lead_stage": "mql",
                "pain_points": '["10+ hrs/week manual outreach", "no systematic qualification"]',
                "interests": '["BANT scoring", "LinkedIn automation", "AI"]',
                "budget": '{"amount": 1500, "currency": "USD", "notes": "approved Q4 budget"}',
                "authority": '{"role": "Head of Growth", "is_decision_maker": true}',
                "need": '{"core_problem": "scale linkedin presence without hiring"}',
                "timeline": '{"timeframe": "Q4 2026", "urgency": "high"}',
                "is_qualified": True,
            },
            # score=92 → sql
            {
                "id": LEAD_SQL_ID, "name": "Elena Vasquez", "company": "DataPulse Corp",
                "job_title": "CEO", "industry": "Data & Analytics", "company_size": "200-500",
                "platform": "linkedin", "platform_user_id": "li_elena_vasquez_005",
                "platform_username": "elenavasquez_dp", "lead_score": 92, "lead_stage": "sql",
                "pain_points": '["CAC too high", "marketing team of 2 cant scale", "zero LinkedIn ROI"]',
                "interests": '["AI marketing", "content at scale", "automated lead qualification"]',
                "budget": '{"amount": 5000, "currency": "USD", "notes": "dedicated marketing automation budget"}',
                "authority": '{"role": "CEO", "is_decision_maker": true}',
                "need": '{"core_problem": "10x linkedin output with same team size"}',
                "timeline": '{"timeframe": "immediately", "urgency": "critical"}',
                "is_qualified": True,
            },
        ]
        for lead in leads:
            await session.execute(text("""
                INSERT INTO leads (
                    id, tenant_id, name, company, job_title, industry, company_size,
                    platform, platform_user_id, platform_username,
                    lead_score, lead_stage, is_qualified,
                    pain_points, interests, budget, authority, need, timeline,
                    metadata, first_interaction_at, last_interaction_at, created_at, updated_at
                ) VALUES (
                    :id, :tenant_id, :name, :company, :job_title, :industry, :company_size,
                    :platform, :platform_user_id, :platform_username,
                    :lead_score, :lead_stage, :is_qualified,
                    :pain_points::jsonb, :interests::jsonb,
                    :budget::jsonb, :authority::jsonb, :need::jsonb, :timeline::jsonb,
                    '{}', now() - interval '14 days', now(), now(), now()
                )
                ON CONFLICT ON CONSTRAINT uq_lead_tenant_platform_user DO NOTHING
            """), {"tenant_id": TENANT_ID, **lead})

        # ── 5. Conversations + messages ────────────────────────────────────────
        print("  → seeding conversations and messages...")
        convs = [
            {"id": CONV_COLD_ID,  "lead_id": LEAD_COLD_ID,  "thread_id": "li_thread_cold_001"},
            {"id": CONV_HOT_ID,   "lead_id": LEAD_HOT_ID,   "thread_id": "li_thread_hot_003"},
            {"id": CONV_SQL_ID,   "lead_id": LEAD_SQL_ID,   "thread_id": "li_thread_sql_005"},
        ]
        for conv in convs:
            await session.execute(text("""
                INSERT INTO conversations (
                    id, tenant_id, lead_id, platform_id, thread_id,
                    status, context_summary, metadata, created_at, updated_at
                ) VALUES (
                    :id, :tenant_id, :lead_id, :platform_id, :thread_id,
                    'active', 'Initial LinkedIn comment thread', '{}', now(), now()
                )
                ON CONFLICT (id) DO NOTHING
            """), {
                "tenant_id": TENANT_ID,
                "platform_id": PLATFORM_LINKEDIN_ID,
                **conv,
            })

        messages = [
            # Cold lead — one inbound comment
            {"conv_id": CONV_COLD_ID, "direction": "inbound",
             "content": "Great post about AI marketing! Do you have more resources on this?"},
            # Hot lead — multi-turn
            {"conv_id": CONV_HOT_ID,  "direction": "inbound",
             "content": "This is exactly what we've been looking for. We have budget approved."},
            {"conv_id": CONV_HOT_ID,  "direction": "outbound",
             "content": "Thanks Priya! Would love to show you how VibeAgent can help ScaleOps. Can we schedule a quick call?"},
            {"conv_id": CONV_HOT_ID,  "direction": "inbound",
             "content": "Absolutely — we're looking to implement something by end of Q4."},
            # SQL lead — high-intent
            {"conv_id": CONV_SQL_ID,  "direction": "inbound",
             "content": "We're ready to move forward. Can you send over pricing details and a contract?"},
            {"conv_id": CONV_SQL_ID,  "direction": "outbound",
             "content": "Fantastic Elena! I'm sending you our Growth plan proposal now. Our team will reach out within 24 hours."},
        ]
        for msg in messages:
            await session.execute(text("""
                INSERT INTO messages (
                    id, tenant_id, conversation_id, direction, content, is_ai_generated,
                    requires_review, metadata, created_at, updated_at
                ) VALUES (
                    gen_random_uuid(), :tenant_id, :conv_id, :direction, :content, false,
                    false, '{}', now(), now()
                )
            """), {"tenant_id": TENANT_ID, **msg})

        await session.commit()
        print("✅ Seed complete.")


async def main() -> None:
    print(f"🌱 Seeding dev database: {settings.DATABASE_URL[:50]}...")
    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    try:
        await seed(engine)
    finally:
        await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
