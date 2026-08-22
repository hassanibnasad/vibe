from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_v1_router
from app.config import settings
from app.dependencies import close_db, init_db
from app.exceptions import register_exception_handlers
from app.middleware.logging import StructuredLoggingMiddleware
from app.middleware.tenant import TenantMiddleware

logger = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("starting_vibeagent", env=settings.APP_ENV, name=settings.APP_NAME)
    await init_db()
    yield
    await close_db()
    logger.info("stopped_vibeagent")


app = FastAPI(
    title="VibeAgent API",
    description="AI Marketing & Lead Qualification Platform API",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    docs_url_oauth2_redirect_url="/docs/oauth2-redirect",
    redoc_url="/redoc",
)

# Multi-tenant and logging middlewares
app.add_middleware(TenantMiddleware)
app.add_middleware(StructuredLoggingMiddleware)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API routes
app.include_router(api_v1_router, prefix="/api/v1")

# Exception handlers
register_exception_handlers(app)
