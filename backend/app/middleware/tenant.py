import uuid
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
import structlog

from app.dependencies import DEFAULT_TENANT_ID, current_tenant_id

logger = structlog.get_logger()


class TenantMiddleware(BaseHTTPMiddleware):
    """Extracts and binds active tenant_id context for request lifespan."""

    async def dispatch(self, request: Request, call_next) -> Response:
        tenant_header = request.headers.get("X-Tenant-ID")

        if tenant_header:
            try:
                tenant_uuid = uuid.UUID(tenant_header)
            except ValueError:
                logger.warning("invalid_tenant_id_header", header=tenant_header)
                tenant_uuid = DEFAULT_TENANT_ID
        else:
            tenant_uuid = DEFAULT_TENANT_ID

        # Bind to async task ContextVar
        token = current_tenant_id.set(tenant_uuid)
        try:
            response = await call_next(request)
            response.headers["X-Tenant-ID"] = str(tenant_uuid)
            return response
        finally:
            current_tenant_id.reset(token)
