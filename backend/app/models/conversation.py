import uuid
from datetime import datetime
from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel


class Conversation(BaseModel):
    __tablename__ = "conversations"

    lead_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("leads.id", ondelete="CASCADE"), index=True, nullable=False
    )
    platform_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("platforms.id", ondelete="SET NULL"), nullable=True
    )

    platform_thread_id: Mapped[str | None] = mapped_column(String(255))
    status: Mapped[str] = mapped_column(String(20), default="active", nullable=False, index=True)

    context: Mapped[dict] = mapped_column(JSONB, default=dict)
    topic: Mapped[str | None] = mapped_column(String(255))

    total_messages: Mapped[int] = mapped_column(Integer, default=0)
    last_message_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), index=True)
    assigned_to: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))

    lead = relationship("Lead", back_populates="conversations", lazy="select")
    platform = relationship("Platform", back_populates="conversations", lazy="select")
    messages = relationship("Message", back_populates="conversation", lazy="select", cascade="all, delete-orphan")
