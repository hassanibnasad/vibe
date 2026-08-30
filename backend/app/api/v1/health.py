from datetime import UTC, datetime

import structlog
from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.dependencies import get_db_session, get_redis_client

logger = structlog.get_logger()

router = APIRouter(prefix="/health", tags=["Health"])


@router.get("")
async def health_check(session: AsyncSession = Depends(get_db_session)) -> dict:
    """Comprehensive system health and service telemetry endpoint."""
    services: dict[str, str] = {
        "api": "up",
        "database": "down",
        "redis": "down",
    }

    # Test Postgres connectivity
    try:
        await session.execute(text("SELECT 1"))
        services["database"] = "up"
    except Exception as e:
        logger.warning("database_health_check_failed", error=str(e))
        services["database"] = "down"

    # Test Redis connectivity
    try:
        redis_client = get_redis_client()
        await redis_client.ping()
        services["redis"] = "up"
    except Exception as e:
        logger.warning("redis_health_check_failed", error=str(e))
        services["redis"] = "down"

    all_healthy = all(status == "up" for status in services.values())

    return {
        "status": "ok" if all_healthy else "degraded",
        "environment": settings.APP_ENV,
        "database": "connected" if services["database"] == "up" else "disconnected",
        "redis": "connected" if services["redis"] == "up" else "disconnected",
        "llm_gateway": "online",
        "active_model": settings.LLM_MODEL_PRIMARY,
        "version": "1.0.0",
        "services": services,
        "timestamp": datetime.now(UTC).isoformat(),
    }
