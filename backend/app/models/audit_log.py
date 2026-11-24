import uuid
from typing import Any

from sqlalchemy import String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import BaseModel


class AuditLog(BaseModel):
    """Immutable audit trail for operator governance and compliance."""

    __tablename__ = "audit_logs"

    tenant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        nullable=False,
        index=True,
    )
    operator_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        nullable=False,
        index=True,
    )
    operator_email: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )
    action: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        index=True,
    )  # e.g. approve, reject, edit, refine, publish, export
    entity_type: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        index=True,
    )  # e.g. post, message, draft, lead
    entity_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        nullable=False,
        index=True,
    )
    summary: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )
    details: Mapped[dict[str, Any] | None] = mapped_column(
        JSONB,
        nullable=True,
        default=dict,
    )
