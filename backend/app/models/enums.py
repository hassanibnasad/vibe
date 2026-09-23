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


class ExtractionStatus(StrEnum):
    PENDING = "pending"
    EXTRACTING = "extracting"
    COMPLETE = "complete"
    FAILED = "failed"


def calculate_lead_stage(score: int) -> str:
    """Standard CRM BANT Lead Funnel Stage mapping (Single Source of Truth).

    Scoring matrix (0–100):
    ┌─────────────────────────────────────────────────────────────────┐
    │  Component          │  Max pts │  How earned                   │
    ├─────────────────────────────────────────────────────────────────┤
    │  Budget confirmed   │    25    │  Any non-null budget object    │
    │  Authority verified │    25    │  Any non-null authority object │
    │  Need articulated   │    25    │  Any non-null need object      │
    │  Timeline given     │    25    │  Any non-null timeline object  │
    │  (LLM delta bonus)  │  ±0–15   │  qualify_lead() heuristic      │
    └─────────────────────────────────────────────────────────────────┘

    Funnel transition thresholds:
        cold  :  0–19   (no meaningful signals)
        warm  : 20–49   (at least one BANT dimension confirmed)
        hot   : 50–74   (2–3 dimensions confirmed, active dialogue)
        mql   : 75–89   (3–4 dimensions, clear buying intent)
        sql   : 90–100  (all four BANT dimensions confirmed, ready to close)

    Decay:  use `apply_score_decay()` when > DECAY_DAYS_THRESHOLD since
            last_interaction_at to gradually push stale leads back toward cold.
    """
    if score >= STAGE_SQL_MIN:
        return LeadStage.SQL.value
    if score >= STAGE_MQL_MIN:
        return LeadStage.MQL.value
    if score >= STAGE_HOT_MIN:
        return LeadStage.HOT.value
    if score >= STAGE_WARM_MIN:
        return LeadStage.WARM.value
    return LeadStage.COLD.value


# ── Scoring constants (single source of truth) ─────────────────────────────

# BANT component weights — must sum to 100.
BANT_BUDGET_WEIGHT:    int = 25
BANT_AUTHORITY_WEIGHT: int = 25
BANT_NEED_WEIGHT:      int = 25
BANT_TIMELINE_WEIGHT:  int = 25

# Stage transition thresholds (lower-bound inclusive).
STAGE_WARM_MIN: int = 20
STAGE_HOT_MIN:  int = 50
STAGE_MQL_MIN:  int = 75
STAGE_SQL_MIN:  int = 90

# Decay configuration.
# After DECAY_DAYS_THRESHOLD days without interaction, each additional day
# subtracts DECAY_POINTS_PER_DAY from the lead score (floor = 0).
DECAY_DAYS_THRESHOLD:  int = 30   # grace period before decay starts
DECAY_POINTS_PER_DAY: int = 1    # score points lost per idle day after threshold
DECAY_MAX_REDUCTION:   int = 30  # maximum total points a stale lead can lose


def apply_score_decay(current_score: int, days_since_interaction: int) -> int:
    """Return the decayed score for a lead that has been idle.

    Decay only starts after DECAY_DAYS_THRESHOLD idle days.
    Maximum reduction is DECAY_MAX_REDUCTION points.
    Score never goes below 0.
    """
    if days_since_interaction <= DECAY_DAYS_THRESHOLD:
        return current_score
    idle_days = days_since_interaction - DECAY_DAYS_THRESHOLD
    reduction = min(idle_days * DECAY_POINTS_PER_DAY, DECAY_MAX_REDUCTION)
    return max(0, current_score - reduction)
