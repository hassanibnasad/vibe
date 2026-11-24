from uuid import UUID

from fastapi import APIRouter, Depends, Query, Response, status

from app.api.deps import get_audit_service
from app.dependencies import DEFAULT_TENANT_ID
from app.middleware.auth import get_current_user
from app.schemas.audit_log import AuditLogListResponse, AuditLogResponse
from app.services.audit_service import AuditService

router = APIRouter(prefix="/audit-logs", tags=["Audit Logs"])


@router.get("", response_model=AuditLogListResponse)
async def list_audit_logs(
    action: str | None = Query(None),
    entity_type: str | None = Query(None),
    operator_id: UUID | None = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    audit_service: AuditService = Depends(get_audit_service),
    current_user: dict = Depends(get_current_user),
) -> AuditLogListResponse:
    tenant_id = DEFAULT_TENANT_ID
    logs, total = await audit_service.list_logs(
        tenant_id=tenant_id,
        action=action,
        entity_type=entity_type,
        operator_id=operator_id,
        page=page,
        limit=limit,
    )
    return AuditLogListResponse(
        data=[AuditLogResponse.model_validate(log) for log in logs],
        pagination={"page": page, "limit": limit, "total": total},
    )


@router.get("/export")
async def export_audit_logs(
    format: str = Query("csv", pattern="^(csv|json)$"),
    action: str | None = Query(None),
    entity_type: str | None = Query(None),
    audit_service: AuditService = Depends(get_audit_service),
    current_user: dict = Depends(get_current_user),
) -> Response:
    tenant_id = DEFAULT_TENANT_ID
    if format == "csv":
        csv_content = await audit_service.export_csv(
            tenant_id=tenant_id,
            action=action,
            entity_type=entity_type,
        )
        return Response(
            content=csv_content,
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=vibeagent-audit-compliance.csv"},
        )
    else:
        json_data = await audit_service.export_json(
            tenant_id=tenant_id,
            action=action,
            entity_type=entity_type,
        )
        import json
        return Response(
            content=json.dumps(json_data, indent=2),
            media_type="application/json",
            headers={"Content-Disposition": "attachment; filename=vibeagent-audit-compliance.json"},
        )
