from enum import StrEnum


class LeadStage(StrEnum):
    COLD = "cold"
    WARM = "warm"
    HOT = "hot"
    MQL = "mql"
    SQL = "sql"
    DISQUALIFIED = "disqualified"


class PostStatus(StrEnum):
    DRAFT = "draft"
    SCHEDULED = "scheduled"
    PUBLISHING = "publishing"
    PUBLISHED = "published"
    FAILED = "failed"
    APPROVED = "approved"


class PlatformType(StrEnum):
    LINKEDIN = "linkedin"
    TWITTER = "twitter"
    THREADS = "threads"
    INSTAGRAM = "instagram"


class ReviewStatus(StrEnum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    EDITED = "edited"


class MessageDirection(StrEnum):
    INBOUND = "inbound"
    OUTBOUND = "outbound"


def calculate_lead_stage(score: int) -> str:
    """Standard CRM BANT Lead Funnel Stage mapping (Single Source of Truth)."""
    if score >= 90:
        return LeadStage.SQL.value
    if score >= 75:
        return LeadStage.MQL.value
    if score >= 50:
        return LeadStage.HOT.value
    if score >= 20:
        return LeadStage.WARM.value
    return LeadStage.COLD.value
