from datetime import datetime
from sqlalchemy import DateTime, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel


class Platform(BaseModel):
    __tablename__ = "platforms"

    name: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    display_name: Mapped[str] = mapped_column(String(100), nullable=False)
    api_type: Mapped[str] = mapped_column(String(50), nullable=False)
    credentials: Mapped[dict] = mapped_column(JSONB, default=dict)
    rate_limits: Mapped[dict] = mapped_column(JSONB, default=dict)
    webhook_url: Mapped[str | None] = mapped_column(String(500))
    webhook_secret: Mapped[str | None] = mapped_column(String(255))
    status: Mapped[str] = mapped_column(String(20), default="inactive", nullable=False, index=True)
    last_synced_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    posts = relationship("Post", back_populates="platform", lazy="select")
    conversations = relationship("Conversation", back_populates="platform", lazy="select")
