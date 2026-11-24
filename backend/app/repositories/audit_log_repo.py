from typing import Any
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit_log import AuditLog
from app.repositories.base import BaseRepository


class AuditLogRepository(BaseRepository[AuditLog]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session, AuditLog)

    async def log_action(
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
        return await self.create(
            tenant_id=tenant_id,
            operator_id=operator_id,
            operator_email=operator_email,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            summary=summary,
            details=details or {},
        )

    async def list_logs(
        self,
        *,
        tenant_id: UUID,
        action: str | None = None,
        entity_type: str | None = None,
        operator_id: UUID | None = None,
        skip: int = 0,
        limit: int = 50,
    ) -> tuple[list[AuditLog], int]:
        stmt = select(AuditLog).where(AuditLog.tenant_id == tenant_id)
        count_stmt = select(func.count()).select_from(AuditLog).where(AuditLog.tenant_id == tenant_id)

        if action:
            stmt = stmt.where(AuditLog.action == action)
            count_stmt = count_stmt.where(AuditLog.action == action)
        if entity_type:
            stmt = stmt.where(AuditLog.entity_type == entity_type)
            count_stmt = count_stmt.where(AuditLog.entity_type == entity_type)
        if operator_id:
            stmt = stmt.where(AuditLog.operator_id == operator_id)
            count_stmt = count_stmt.where(AuditLog.operator_id == operator_id)

        stmt = stmt.order_by(AuditLog.created_at.desc()).offset(skip).limit(limit)

        total_res = await self.session.execute(count_stmt)
        total = total_res.scalar_one()

        results_res = await self.session.execute(stmt)
        results = results_res.scalars().all()
        return list(results), total
