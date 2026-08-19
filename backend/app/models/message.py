import uuid
from datetime import datetime
from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel


class Message(BaseModel):
    __tablename__ = "messages"

    conversation_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("conversations.id", ondelete="CASCADE"), index=True, nullable=False
    )

    direction: Mapped[str] = mapped_column(String(10), nullable=False, index=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    content_type: Mapped[str] = mapped_column(String(20), default="text")
    media_urls: Mapped[list] = mapped_column(JSONB, default=list)

    platform: Mapped[str] = mapped_column(String(50), nullable=False)
    platform_message_id: Mapped[str | None] = mapped_column(String(255))

    sentiment: Mapped[str | None] = mapped_column(String(20))
    sentiment_score: Mapped[float | None] = mapped_column(Float)
    intent_signals: Mapped[list] = mapped_column(JSONB, default=list)
    confidence_score: Mapped[float | None] = mapped_column(Float)

    requires_review: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    review_status: Mapped[str | None] = mapped_column(String(20))
    reviewed_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    original_content: Mapped[str | None] = mapped_column(Text)

    llm_model: Mapped[str | None] = mapped_column(String(100))
    generation_time_ms: Mapped[int | None] = mapped_column(Integer)

    conversation = relationship("Conversation", back_populates="messages", lazy="select")
