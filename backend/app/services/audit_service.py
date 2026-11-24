import csv
import io
import json
from typing import Any
from uuid import UUID

from app.models.audit_log import AuditLog
from app.repositories.audit_log_repo import AuditLogRepository


class AuditService:
    """Governance service for recording and exporting operator compliance audit logs."""

    def __init__(self, audit_repo: AuditLogRepository) -> None:
        self._audit_repo = audit_repo

    async def record_action(
        self,
        *,
        tenant_id: UUID,
        operator_id: UUID,
        action: str,
        entity_type: str,
        entity_id: UUID,
        summary: str,
        operator_email: str | None = None,
        details: dict[str, Any] | None = None,
    ) -> AuditLog:
        return await self._audit_repo.log_action(
            tenant_id=tenant_id,
            operator_id=operator_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            summary=summary,
            operator_email=operator_email,
            details=details,
        )

    async def list_logs(
        self,
        *,
        tenant_id: UUID,
        action: str | None = None,
        entity_type: str | None = None,
        operator_id: UUID | None = None,
        page: int = 1,
        limit: int = 50,
    ) -> tuple[list[AuditLog], int]:
        skip = (page - 1) * limit
        return await self._audit_repo.list_logs(
            tenant_id=tenant_id,
            action=action,
            entity_type=entity_type,
            operator_id=operator_id,
            skip=skip,
            limit=limit,
        )

    async def export_csv(
        self,
        *,
        tenant_id: UUID,
        action: str | None = None,
        entity_type: str | None = None,
    ) -> str:
        logs, _ = await self._audit_repo.list_logs(
            tenant_id=tenant_id,
            action=action,
            entity_type=entity_type,
            skip=0,
            limit=1000,
        )
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["id", "created_at", "operator_id", "operator_email", "action", "entity_type", "entity_id", "summary", "details"])
        for log in logs:
            writer.writerow([
                str(log.id),
                log.created_at.isoformat() if log.created_at else "",
                str(log.operator_id),
                log.operator_email or "",
                log.action,
                log.entity_type,
                str(log.entity_id),
                log.summary,
                json.dumps(log.details or {}),
            ])
        return output.getvalue()

    async def export_json(
        self,
        *,
        tenant_id: UUID,
        action: str | None = None,
        entity_type: str | None = None,
    ) -> list[dict[str, Any]]:
        logs, _ = await self._audit_repo.list_logs(
            tenant_id=tenant_id,
            action=action,
            entity_type=entity_type,
            skip=0,
            limit=1000,
        )
        return [
            {
                "id": str(log.id),
                "created_at": log.created_at.isoformat() if log.created_at else None,
                "operator_id": str(log.operator_id),
                "operator_email": log.operator_email,
                "action": log.action,
                "entity_type": log.entity_type,
                "entity_id": str(log.entity_id),
                "summary": log.summary,
                "details": log.details or {},
            }
            for log in logs
        ]
