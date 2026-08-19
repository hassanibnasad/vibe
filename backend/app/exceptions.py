from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse


class VibeAgentError(Exception):
    """Base exception for all VibeAgent errors."""
    status_code: int = 500
    error_code: str = "INTERNAL_ERROR"

    def __init__(self, message: str):
        super().__init__(message)
        self.message = message


class NotFoundError(VibeAgentError):
    status_code: int = 404
    error_code: str = "NOT_FOUND"


class ValidationError(VibeAgentError):
    status_code: int = 400
    error_code: str = "VALIDATION_ERROR"


class UnauthorizedError(VibeAgentError):
    status_code: int = 401
    error_code: str = "UNAUTHORIZED"


class ForbiddenError(VibeAgentError):
    status_code: int = 403
    error_code: str = "FORBIDDEN"


class LeadNotFoundError(NotFoundError):
    error_code: str = "LEAD_NOT_FOUND"


class PostNotFoundError(NotFoundError):
    error_code: str = "POST_NOT_FOUND"


class CampaignNotFoundError(NotFoundError):
    error_code: str = "CAMPAIGN_NOT_FOUND"


class ConversationNotFoundError(NotFoundError):
    error_code: str = "CONVERSATION_NOT_FOUND"


class LLMError(VibeAgentError):
    status_code: int = 503
    error_code: str = "LLM_SERVICE_UNAVAILABLE"


class PlatformAPIError(VibeAgentError):
    status_code: int = 502
    error_code: str = "PLATFORM_API_ERROR"


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(VibeAgentError)
    async def vibeagent_error_handler(request: Request, exc: VibeAgentError) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": {
                    "code": exc.error_code,
                    "message": exc.message,
                }
            },
        )
