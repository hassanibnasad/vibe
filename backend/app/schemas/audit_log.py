import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict


class AuditLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    tenant_id: uuid.UUID
    operator_id: uuid.UUID
    operator_email: str | None = None
    action: str
    entity_type: str
    entity_id: uuid.UUID
    summary: str
    details: dict[str, Any] | None = None
    created_at: datetime


class AuditLogListResponse(BaseModel):
    data: list[AuditLogResponse]
    pagination: dict[str, int]
