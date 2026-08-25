# 🎫 Ticket #004: Hatchet Workflow Orchestration and Review Pause

**Type**: `wayfinder:grilling` (HITL)  
**Part of**: [Wayfinder Map](../MAP.md)  
**Status**: Blocked  
**Blocked by**: [Ticket #001: Cloud LLM and Embedding Strategy](./001-cloud-llm-and-embedding-strategy.md)  

---

## Question

How should Hatchet workflows manage distributed task retries and implement the asynchronous human-in-the-loop pause when an AI reply confidence score falls below the `Confidence Threshold` (0.85)?

### Context
- Hatchet step functions coordinate multi-agent pipelines (`app/workflows/`).
- When `Confidence Threshold` is not met, the workflow must yield/pause, persist draft state in Postgres `ReviewQueue`, notify operator, and resume execution upon human approval or edit.
- Clarify worker startup lifecycle, event triggers, and Redis queue fallbacks.
