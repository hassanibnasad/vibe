import uuid
from datetime import datetime
from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel


class Post(BaseModel):
    __tablename__ = "posts"

    campaign_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("campaigns.id", ondelete="SET NULL"), index=True
    )
    platform_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("platforms.id", ondelete="CASCADE"), index=True
    )

    content: Mapped[str] = mapped_column(Text, nullable=False)
    media_urls: Mapped[list] = mapped_column(JSONB, default=list)
    hashtags: Mapped[list] = mapped_column(JSONB, default=list)
    cta: Mapped[str | None] = mapped_column(Text)

    platform_post_id: Mapped[str | None] = mapped_column(String(255))
    platform_post_url: Mapped[str | None] = mapped_column(String(500))

    status: Mapped[str] = mapped_column(String(20), default="draft", nullable=False, index=True)
    error_message: Mapped[str | None] = mapped_column(Text)
    retry_count: Mapped[int] = mapped_column(Integer, default=0)
    scheduled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), index=True)
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), index=True)

    engagement_metrics: Mapped[dict] = mapped_column(JSONB, default=dict)

    generation_prompt: Mapped[str | None] = mapped_column(Text)
    variant_group: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    variant_label: Mapped[str | None] = mapped_column(String(10))

    created_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    approved_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))

    campaign = relationship("Campaign", back_populates="posts", lazy="select")
    platform = relationship("Platform", back_populates="posts", lazy="select")
