# 🎫 Ticket #008: End-to-End Integration and DoD Verification

**Type**: `wayfinder:grilling` (HITL)  
**Part of**: [Wayfinder Map](../MAP.md)  
**Status**: Blocked  
**Blocked by**: [Ticket #003](./003-linkedin-api-and-webhook-lifecycle.md), [Ticket #004](./004-hatchet-workflow-orchestration-and-review-pause.md), [Ticket #005](./005-bant-lead-scoring-and-funnel-transitions.md), [Ticket #006](./006-review-queue-and-calendar-ui-components.md), [Ticket #007](./007-database-migrations-and-seed-fixtures.md)  

---

## Question

What automated integration tests and smoke check suites will validate all 18 Definition-of-Done (DoD) criteria from `MVP_SPEC.md` prior to tagging the Phase 1 release?

### Context
- The Definition of Done requires `docker compose up` health checks, end-to-end flow from Brief creation to Lead scoring, and UI responsiveness.
- We need:
  1. Synthetic end-to-end integration test (`tests/test_e2e_pipeline.py`).
  2. Health check verification script (`scripts/verify_services.py`).
  3. Release tagging checklist.
