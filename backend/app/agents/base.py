import structlog
from pydantic import BaseModel, Field

logger = structlog.get_logger()


class AgentResult(BaseModel):
    success: bool
    confidence_score: float = Field(..., ge=0.0, le=1.0)
    requires_review: bool
    data: dict
    reasoning: str | None = None
    error: str | None = None


class BaseAgent:
    """Base class for autonomous domain agents in VibeAgent."""

    def __init__(self, name: str, confidence_threshold: float = 0.85):
        self.name = name
        self.confidence_threshold = confidence_threshold
        self.logger = logger.bind(agent=name)

    def evaluate_confidence(self, score: float) -> tuple[bool, bool]:
        """Returns (success, requires_review) based on confidence threshold."""
        requires_review = score < self.confidence_threshold
        return True, requires_review
