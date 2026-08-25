# 🎫 Ticket #005: BANT Lead Scoring and Funnel Transitions

**Type**: `wayfinder:grilling` (HITL)  
**Part of**: [Wayfinder Map](../MAP.md)  
**Status**: Blocked  
**Blocked by**: [Ticket #001: Cloud LLM and Embedding Strategy](./001-cloud-llm-and-embedding-strategy.md)  

---

## Question

What is the precise scoring matrix (0–100) and automated threshold rules for classifying inbound interactions and transitioning Leads across `cold` → `warm` → `hot` → `mql` → `sql`?

### Context
- Defined in `app/services/scoring_service.py` and `app/agents/lead_qualifier.py`.
- Need to specify:
  1. Weighting between Profile Fit (title, company size), Intent Polarity (pricing inquiry vs casual remark), and Interaction Frequency.
  2. Decay rate for stale leads.
  3. Explicit thresholds triggering automated alerts for sales handoff (`sql`).
