import uuid
from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import BaseModel


class ContentPerformance(BaseModel):
    """Materialized performance scorecard per published post.

    Populated by ``TelemetryService`` (daily metric sync from platform APIs)
    and enriched by ``ReflectionAgent`` (weekly pattern classification).

    The ``conversion_score`` is a composite metric:
        (impressions × 0.1) + (comments × 0.5) + (shares × 1.0)
        + (dms_initiated × 2.0) + (leads_qualified × 10.0)

    This table is the single source of truth for the feedback loop.
    The denormalized ``posts.conversion_score`` column mirrors
    ``content_performance.conversion_score`` for fast ORDER BY queries.
    """

    __tablename__ = "content_performance"

    tenant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        nullable=False,
        index=True,
    )
    post_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("posts.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )

    # ── Raw engagement metrics ────────────────────────────────────────────────
    impressions: Mapped[int] = mapped_column(Integer, default=0)
    likes: Mapped[int] = mapped_column(Integer, default=0)
    comments: Mapped[int] = mapped_column(Integer, default=0)
    shares: Mapped[int] = mapped_column(Integer, default=0)
    dms_initiated: Mapped[int] = mapped_column(Integer, default=0)
    leads_generated: Mapped[int] = mapped_column(Integer, default=0)
    leads_qualified: Mapped[int] = mapped_column(Integer, default=0)

    # ── Computed composite score ──────────────────────────────────────────────
    conversion_score: Mapped[float] = mapped_column(Float, default=0.0, index=True)

    # ── Content classification (populated by ReflectionAgent) ─────────────────
    hook_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    cta_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    topic_cluster: Mapped[str | None] = mapped_column(String(100), nullable=True)

    scored_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
