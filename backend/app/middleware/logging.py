import time
from collections.abc import Callable

import structlog
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

logger = structlog.get_logger()


class StructuredLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        start_time = time.monotonic()
        path = request.url.path
        method = request.method

        response: Response = await call_next(request)

        duration_ms = int((time.monotonic() - start_time) * 1000)
        logger.info(
            "http_request",
            method=method,
            path=path,
            status_code=response.status_code,
            duration_ms=duration_ms,
        )
        return response
