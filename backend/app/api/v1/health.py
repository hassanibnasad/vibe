from datetime import UTC, datetime

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.dependencies import get_db_session, get_redis_client

router = APIRouter(prefix="/health", tags=["Health"])


@router.get("")
async def health_check(session: AsyncSession = Depends(get_db_session)) -> dict:
    services: dict[str, str] = {
        "api": "up",
        "database": "down",
        "redis": "down",
    }

    # Test Postgres
    try:
        await session.execute(text("SELECT 1"))
        services["database"] = "up"
    except Exception:
        services["database"] = "down"

    # Test Redis
    try:
        redis_client = get_redis_client()
        await redis_client.ping()
        services["redis"] = "up"
    except Exception:
        services["redis"] = "down"

    all_healthy = all(status == "up" for status in services.values())

    return {
        "status": "healthy" if all_healthy else "degraded",
        "version": "1.0.0",
        "environment": settings.APP_ENV,
        "services": services,
        "timestamp": datetime.now(UTC).isoformat(),
    }
