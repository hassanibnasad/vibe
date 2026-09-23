"""Tests for BANT scoring matrix constants and decay function in enums.py."""

from __future__ import annotations

import pytest

from app.agents.lead_qualifier import compute_bant_score
from app.models.enums import (
    BANT_AUTHORITY_WEIGHT,
    BANT_BUDGET_WEIGHT,
    BANT_NEED_WEIGHT,
    BANT_TIMELINE_WEIGHT,
    DECAY_DAYS_THRESHOLD,
    DECAY_MAX_REDUCTION,
    DECAY_POINTS_PER_DAY,
    STAGE_HOT_MIN,
    STAGE_MQL_MIN,
    STAGE_SQL_MIN,
    STAGE_WARM_MIN,
    LeadStage,
    apply_score_decay,
    calculate_lead_stage,
)


# ── Scoring weights ────────────────────────────────────────────────────────────


def test_bant_weights_sum_to_100() -> None:
    total = BANT_BUDGET_WEIGHT + BANT_AUTHORITY_WEIGHT + BANT_NEED_WEIGHT + BANT_TIMELINE_WEIGHT
    assert total == 100, f"BANT weights must sum to 100, got {total}"


def test_bant_weights_are_equal() -> None:
    """All four dimensions have equal weight by design."""
    assert BANT_BUDGET_WEIGHT == BANT_AUTHORITY_WEIGHT == BANT_NEED_WEIGHT == BANT_TIMELINE_WEIGHT == 25


# ── Stage thresholds ───────────────────────────────────────────────────────────


def test_stage_thresholds_are_ordered() -> None:
    assert 0 < STAGE_WARM_MIN < STAGE_HOT_MIN < STAGE_MQL_MIN < STAGE_SQL_MIN <= 100


@pytest.mark.parametrize("score,expected_stage", [
    (0,   LeadStage.COLD.value),
    (1,   LeadStage.COLD.value),
    (19,  LeadStage.COLD.value),
    (20,  LeadStage.WARM.value),
    (49,  LeadStage.WARM.value),
    (50,  LeadStage.HOT.value),
    (74,  LeadStage.HOT.value),
    (75,  LeadStage.MQL.value),
    (89,  LeadStage.MQL.value),
    (90,  LeadStage.SQL.value),
    (100, LeadStage.SQL.value),
])
def test_calculate_lead_stage_boundaries(score: int, expected_stage: str) -> None:
    assert calculate_lead_stage(score) == expected_stage


def test_full_bant_score_is_sql() -> None:
    """A lead with all four BANT dimensions confirmed scores 100 → SQL."""
    full_bant = {
        "budget": {"amount": 5000, "currency": "USD"},
        "authority": {"role": "CEO", "is_decision_maker": True},
        "need": {"core_problem": "scale marketing"},
        "timeline": {"timeframe": "Q4", "urgency": "high"},
    }
    score = compute_bant_score(full_bant)
    assert score == 100
    assert calculate_lead_stage(score) == LeadStage.SQL.value


def test_zero_bant_score_is_cold() -> None:
    score = compute_bant_score({"budget": None, "authority": None, "need": None, "timeline": None})
    assert score == 0
    assert calculate_lead_stage(score) == LeadStage.COLD.value


# ── Decay function ─────────────────────────────────────────────────────────────


def test_decay_not_applied_within_threshold() -> None:
    """No decay before DECAY_DAYS_THRESHOLD days."""
    assert apply_score_decay(80, 0)  == 80
    assert apply_score_decay(80, 30) == 80
    assert apply_score_decay(80, DECAY_DAYS_THRESHOLD) == 80


def test_decay_applied_after_threshold() -> None:
    """Each day beyond threshold reduces score by DECAY_POINTS_PER_DAY."""
    score = apply_score_decay(80, DECAY_DAYS_THRESHOLD + 10)
    expected = 80 - 10 * DECAY_POINTS_PER_DAY
    assert score == expected


def test_decay_capped_at_max_reduction() -> None:
    """Total reduction never exceeds DECAY_MAX_REDUCTION."""
    very_stale = DECAY_DAYS_THRESHOLD + 1000
    score = apply_score_decay(80, very_stale)
    assert score == 80 - DECAY_MAX_REDUCTION


def test_decay_never_goes_below_zero() -> None:
    """Score floor is 0 regardless of decay."""
    assert apply_score_decay(5, DECAY_DAYS_THRESHOLD + 1000) == 0


def test_decay_preserves_stage_transitions() -> None:
    """A MQL lead that goes stale for 31 days should drop to HOT."""
    score_before = 78   # mql (75–89)
    score_after = apply_score_decay(score_before, DECAY_DAYS_THRESHOLD + 4)
    # 78 - 4 = 74 → hot
    assert score_after == 74
    assert calculate_lead_stage(score_after) == LeadStage.HOT.value
