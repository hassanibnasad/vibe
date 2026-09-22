"""Persisted, tenant-scoped social account connections."""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import BaseModel


class SocialConnection(BaseModel):
    """An Operator-authorized social identity, safe to select for publishing."""

    __tablename__ = "social_connections"
    __table_args__ = (
        UniqueConstraint("tenant_id", "operator_id", "provider", "external_subject", name="uq_social_connection_owner"),
    )

    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    operator_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    provider: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    external_subject: Mapped[str] = mapped_column(String(255), nullable=False)
    author_urn: Mapped[str] = mapped_column(String(255), nullable=False)
    display_name: Mapped[str | None] = mapped_column(String(255))
    access_token_encrypted: Mapped[str] = mapped_column(String, nullable=False)
    refresh_token_encrypted: Mapped[str | None] = mapped_column(String)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), index=True)
    granted_scopes: Mapped[list] = mapped_column(JSONB, default=list)
    status: Mapped[str] = mapped_column(String(30), default="active", nullable=False, index=True)
    last_error: Mapped[str | None] = mapped_column(String)
    connected_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    disconnected_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    last_used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    metadata_: Mapped[dict] = mapped_column("metadata", JSONB, default=dict)

    @property
    def is_publishable(self) -> bool:
        return self.status == "active" and bool(self.author_urn) and bool(self.access_token_encrypted)
