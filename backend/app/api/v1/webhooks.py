import structlog
from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.dependencies import get_db_session
from app.models.webhook_event import WebhookEvent
from app.repositories.base import BaseRepository

logger = structlog.get_logger()
router = APIRouter(prefix="/webhooks", tags=["Webhooks"])


@router.post("/{platform}", status_code=status.HTTP_200_OK)
async def handle_platform_webhook(
    platform: str,
    request: Request,
    session: AsyncSession = Depends(get_db_session),
    x_webhook_secret: str | None = Header(None, alias="X-Webhook-Secret"),
) -> dict:
    if settings.WEBHOOK_SECRET and x_webhook_secret != settings.WEBHOOK_SECRET:
        if settings.APP_ENV != "development":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid webhook signature / secret",
            )

    body = await request.json()
    logger.info("webhook_received", platform=platform, payload_keys=list(body.keys()))

    webhook_repo = BaseRepository(session, WebhookEvent)
    event_id = str(body.get("id") or body.get("event_id") or "")

    await webhook_repo.create(
        platform=platform,
        event_type=body.get("type", "generic"),
        event_id=event_id if event_id else None,
        raw_payload=body,
        processing_status="pending",
    )

    # Fire-and-forget: hand off to the Hatchet worker for durable, retried processing.
    # The webhook endpoint must return 200 quickly; all heavy work happens in the background.
    from app.workflows.engagement_workflow import (  # noqa: PLC0415
        EngagementInput,
        engagement_pipeline_task,
    )

    await engagement_pipeline_task.aio_run_no_wait(
        EngagementInput(platform=platform, raw_payload=body)
    )

    return {"status": "received", "platform": platform}
