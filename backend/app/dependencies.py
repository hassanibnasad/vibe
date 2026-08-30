import contextvars
import uuid
from collections.abc import AsyncGenerator

import redis.asyncio as aioredis
from sqlalchemy import text
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.config import settings

# Global ContextVar for tenant isolation
DEFAULT_TENANT_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")
current_tenant_id: contextvars.ContextVar[uuid.UUID] = contextvars.ContextVar(
    "current_tenant_id", default=DEFAULT_TENANT_ID
)

_engine: AsyncEngine | None = None
_sessionmaker: async_sessionmaker[AsyncSession] | None = None
_redis: aioredis.Redis | None = None


def get_engine() -> AsyncEngine:
    global _engine
    if _engine is None:
        _engine = create_async_engine(
            settings.DATABASE_URL,
            pool_size=settings.DATABASE_POOL_SIZE,
            echo=settings.APP_DEBUG,
        )
    return _engine


def get_sessionmaker() -> async_sessionmaker[AsyncSession]:
    global _sessionmaker
    if _sessionmaker is None:
        _sessionmaker = async_sessionmaker(
            bind=get_engine(),
            expire_on_commit=False,
            autoflush=False,
        )
    return _sessionmaker


async def init_db() -> None:
    get_engine()
    get_sessionmaker()


async def close_db() -> None:
    global _engine, _redis
    if _engine is not None:
        await _engine.dispose()
        _engine = None
    if _redis is not None:
        await _redis.close()
        _redis = None


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    sessionmaker = get_sessionmaker()
    async with sessionmaker() as session:
        # Enforce PostgreSQL Row-Level Security tenant context
        tenant = current_tenant_id.get()
        if session.bind and session.bind.dialect.name == "postgresql":
            await session.execute(
                text("SELECT set_config('app.current_tenant', :tenant, true)"),
                {"tenant": str(tenant)},
            )
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


def get_redis_client() -> aioredis.Redis:
    global _redis
    if _redis is None:
        _redis = aioredis.from_url(
            settings.REDIS_URL,
            decode_responses=True,
            socket_connect_timeout=2.0,
            socket_timeout=2.0,
        )
    return _redis
