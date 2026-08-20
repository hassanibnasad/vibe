# 1. Choose Hatchet as Workflow & Distributed Orchestration Engine

Date: 2026-08-20  
Status: Accepted

## Context
VibeAgent requires multi-step autonomous workflows with retry semantics, rate limiting, human-in-the-loop approvals, and failure recovery (e.g. content publishing pipelines, lead nurturing sequences). We evaluated Temporal, Celery, and Hatchet.

## Decision
We adopted **Hatchet** as our core workflow engine.

## Rationale
1. **Developer Experience**: Native async Python SDK with decorator-based step functions (`@hatchet.workflow`, `@hatchet.step`).
2. **Postgres-backed Queuing & State**: Uses PostgreSQL for persistent state queues, avoiding the need for dedicated Cassandra/Elasticsearch clusters required by Temporal.
3. **Resilience & Concurrency**: First-class support for per-tenant rate limits, cron scheduling, and step-level timeouts and retries.
4. **Low Operational Overhead**: Simple deployment model compared to enterprise workflow engines.

## Consequences
- Workflows must be structured as deterministic Hatchet steps.
- Workflows emit events and can be triggered via REST API or event listeners.
