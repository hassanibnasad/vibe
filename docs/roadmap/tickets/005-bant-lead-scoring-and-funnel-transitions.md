# 🎫 Ticket #005: BANT Lead Scoring and Funnel Transitions

**Type**: `wayfinder:grilling` (HITL)  
**Part of**: [Wayfinder Map](../MAP.md)  
**Status**: ✅ Done  
**Closed by commits**: `03c49c5`  

---

## Question

What is the precise scoring matrix (0–100) and automated threshold rules for classifying inbound interactions and transitioning Leads across `cold` → `warm` → `hot` → `mql` → `sql`?

---

## Resolution

### Scoring Matrix

All constants live in [`app/models/enums.py`](../../backend/app/models/enums.py) as the single source of truth.

| BANT Component | Weight | How earned |
|----------------|--------|------------|
| Budget | **25 pts** | Any non-null `budget` JSON object on the Lead |
| Authority | **25 pts** | Any non-null `authority` JSON object |
| Need | **25 pts** | Any non-null `need` JSON object |
| Timeline | **25 pts** | Any non-null `timeline` JSON object |
| LLM delta bonus | ± 0–15 | Heuristic from `qualify_lead()` based on conversation signals |

Maximum deterministic score = **100**. LLM deltas are clamped: `score = max(0, min(100, score + delta))`.

### Funnel Transition Thresholds

| Stage | Score range | Meaning |
|-------|-------------|---------|
| `cold` | 0–19 | No meaningful signals |
| `warm` | 20–49 | ≥ 1 BANT dimension confirmed |
| `hot` | 50–74 | 2–3 dimensions confirmed, active dialogue |
| `mql` | 75–89 | 3–4 dimensions, clear buying intent → marketing hand-off |
| `sql` | 90–100 | All 4 BANT dimensions confirmed → sales hand-off |

### Score Decay (Stale Lead Handling)

| Parameter | Value |
|-----------|-------|
| Grace period before decay starts | 30 days |
| Points lost per idle day after grace | 1 pt/day |
| Maximum total reduction | 30 pts |
| Score floor | 0 |

```python
# Example: MQL lead (78) idle for 34 days → drops 4 pts → hot (74)
apply_score_decay(78, days_since_interaction=34)  # → 74
```

### Test coverage

21 new tests in [`test_bant_scoring.py`](../../backend/tests/test_services/test_bant_scoring.py):
- Weight sum constraint (must equal 100)
- All 11 stage boundary values (0, 19, 20, 49, 50, 74, 75, 89, 90, 100)
- Full BANT → SQL, zero BANT → cold
- Decay within grace period (no change), after grace, cap, floor, and stage-crossing
