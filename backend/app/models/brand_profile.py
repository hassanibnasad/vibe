import uuid
from datetime import datetime

from sqlalchemy import DateTime, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import BaseModel
from app.models.enums import ExtractionStatus


class BrandProfile(BaseModel):
    """Synthesised brand identity for a tenant — visual, written, and conversion assets.

    One record per tenant.  Populated by the onboarding workflow
    (ScraperService + BrandSynthesisService) and refined over time
    by the ReflectionAgent.

    Key JSONB column schemas
    ~~~~~~~~~~~~~~~~~~~~~~~~
    ``visual_identity``::

        {
            "palette": {"primary": "#0F172A", "accent": "#38BDF8", "neutral": "#F8FAFC"},
            "aesthetic_summary": "Sleek dark-mode developer tooling aesthetic",
            "imagery_style": "Isometric 3D cloud server architecture",
            "negative_prompts": "cartoonish, hand-drawn, vintage, cluttered",
            "logo_urls": ["https://..."]
        }

    ``written_identity``::

        {
            "archetype": "Technical Expert",
            "tone_attributes": ["Direct", "Informative", "Pragmatic"],
            "banned_words": ["synergy", "game-changer"],
            "formatting_rules": "Short paragraphs, max 2 emojis per post"
        }

    ``conversion_assets``::

        {
            "lead_magnets": ["Free infrastructure audit checklist"],
            "cta_templates": ["Comment 'SCALE' and we'll DM you the report"],
            "offer_hooks": ["Free 14-day trial, no credit card"]
        }

    ``icp_pain_points``::

        [
            {
                "feature": "Durable Workflow Orchestrator",
                "pain_hook": "Tired of silent server crashes dropping webhooks at 3 AM?",
                "target_persona": "Backend engineering leads at Series B+ startups"
            }
        ]
    """

    __tablename__ = "brand_profiles"

    tenant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        unique=True,
        nullable=False,
        index=True,
    )
    brand_name: Mapped[str] = mapped_column(String(255), nullable=False)
    website_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    tagline: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # ── Structured JSONB columns ──────────────────────────────────────────────
    visual_identity: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    written_identity: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    core_value_props: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    conversion_assets: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    icp_pain_points: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)

    # ── Extraction provenance ─────────────────────────────────────────────────
    extraction_status: Mapped[str] = mapped_column(
        String(20), nullable=False, default=ExtractionStatus.PENDING.value, index=True
    )
    screenshot_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    raw_scraped_markdown: Mapped[str | None] = mapped_column(Text, nullable=True)
    last_extracted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
