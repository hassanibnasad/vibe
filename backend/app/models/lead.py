import uuid
from datetime import UTC, datetime

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel


class Lead(BaseModel):
    __tablename__ = "leads"
    __table_args__ = (
        UniqueConstraint("tenant_id", "platform", "platform_user_id", name="uq_lead_tenant_platform_user"),
        CheckConstraint("lead_score >= 0 AND lead_score <= 100", name="ck_lead_score_range"),
    )

    tenant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        default=uuid.UUID("00000000-0000-0000-0000-000000000001"),
        nullable=False,
        index=True,
    )
    thread_id: Mapped[str | None] = mapped_column(String(255), index=True)

    name: Mapped[str | None] = mapped_column(String(255))
    email: Mapped[str | None] = mapped_column(String(255))
    phone: Mapped[str | None] = mapped_column(String(50))
    avatar_url: Mapped[str | None] = mapped_column(String(500))

    platform: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    platform_user_id: Mapped[str] = mapped_column(String(255), nullable=False)
    platform_username: Mapped[str | None] = mapped_column(String(255))
    platform_profile_url: Mapped[str | None] = mapped_column(String(500))

    company: Mapped[str | None] = mapped_column(String(255))
    job_title: Mapped[str | None] = mapped_column(String(255))
    industry: Mapped[str | None] = mapped_column(String(255))
    company_size: Mapped[str | None] = mapped_column(String(50))

    # Structured BANT Working Memory State
    budget: Mapped[dict | None] = mapped_column(JSONB, default=dict)
    authority: Mapped[dict | None] = mapped_column(JSONB, default=dict)
    need: Mapped[dict | None] = mapped_column(JSONB, default=dict)
    timeline: Mapped[dict | None] = mapped_column(JSONB, default=dict)
    is_qualified: Mapped[bool] = mapped_column(Boolean, default=False, index=True)

    lead_score: Mapped[int] = mapped_column(Integer, default=0, index=True)
    lead_stage: Mapped[str] = mapped_column(String(20), default="cold", nullable=False, index=True)

    tags: Mapped[list] = mapped_column(JSONB, default=list)
    pain_points: Mapped[list] = mapped_column(JSONB, default=list)
    interests: Mapped[list] = mapped_column(JSONB, default=list)
    metadata_: Mapped[dict] = mapped_column("metadata", JSONB, default=dict)

    source_post_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("posts.id", ondelete="SET NULL"), nullable=True
    )
    source_type: Mapped[str | None] = mapped_column(String(50))

    first_interaction_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False
    )
    last_interaction_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False, index=True
    )
    qualified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    conversations = relationship("Conversation", back_populates="lead", lazy="select")
    score_events = relationship("LeadScoreEvent", back_populates="lead", lazy="select")
    field_history = relationship("LeadFieldHistory", back_populates="lead", lazy="select", cascade="all, delete-orphan")
