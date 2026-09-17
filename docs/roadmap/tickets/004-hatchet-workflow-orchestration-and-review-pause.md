# 🎫 Ticket #004: Hatchet Workflow Orchestration and Review Pause

**Type**: `wayfinder:grilling` (HITL)  
**Part of**: [Wayfinder Map](../MAP.md)  
**Status**: ✅ Completed  

---

## Question

How should Hatchet workflows manage distributed task retries and implement the asynchronous human-in-the-loop pause when an AI reply confidence score falls below the `Confidence Threshold` (0.85)?

## Architecture & Resolution

### 1. Dual-Mode Worker Topology & Direct Fallback
- **Distributed Engine**: `backend/worker.py` runs as an isolated worker process registering all 11 tasks and workflows with `slots=20`.
- **Zero-Dependency Fallback**: In `backend/app/hatchet_client.py`, `_LazyHatchet` and `_TaskWrapper` automatically detect whether `HATCHET_CLIENT_TOKEN` is configured. If unconfigured, tasks seamlessly execute via local `asyncio` direct execution (`aio_run`, `aio_run_no_wait`) without throwing errors.
- **Docker Compose Profile**: `docker-compose.dev.yml` contains a self-hosted `hatchet-engine` service enabled with `--profile hatchet`.

### 2. Human-in-the-Loop (HITL) Pause & Resume Mechanics
1. **Automated Yield on Low Confidence**:
   - During `engagement_pipeline_task`, `ReplyAgent` scores reply confidence against `REPLY_CONFIDENCE_THRESHOLD`.
   - If confidence falls below the threshold, `requires_review=True` and `review_status="pending"` are saved to PostgreSQL in the `messages` table (Review Queue). The automated pipeline yields and exits without sending to the platform.
2. **Operator Review & Durable Resume**:
   - The operator inspects pending items via `GET /api/v1/conversations/review-queue`.
   - When the operator calls `POST /api/v1/conversations/review-queue/{message_id}/approve` (or edits copy):
     - The database immediately records `review_status="approved"` and `requires_review=False`.
     - When Hatchet is active, the API fires `dispatch_approved_reply_task.aio_run_no_wait(...)`.
     - The Hatchet background worker picks up `dispatch_approved_reply_task` and calls `dispatch_to_platform` with `retries=3` and exponential backoff to tolerate transient platform 429/5xx errors.
     - In fallback mode, direct inline dispatch occurs transparently.

### 3. Verification & Test Suite
- Full test coverage in `backend/tests/test_workflows/` verifying direct execution fallback, health telemetry, pipeline execution, HITL approved dispatch, and scheduled publishing.
