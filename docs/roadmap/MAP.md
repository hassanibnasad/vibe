# 🗺️ Wayfinder Map: VibeAgent Phase 1 MVP Development Roadmap

## Destination

Deliver a functional, production-grade **VibeAgent Phase 1 MVP End-to-End Pipeline**: an AI-driven marketing and lead qualification engine operating on LinkedIn (Content Generation via RAG → Operator Review / Publishing → Webhook Monitoring → Contextual AI Reply → BANT Lead Scoring → Operator Dashboard in Next.js 14).

## Notes

- **Domain Language**: Adhere strictly to the ubiquitous language in [CONTEXT.md](../../CONTEXT.md) (`Brief`, `Draft`, `Lead`, `Lead Stage`, `Interaction`, `Review Queue`, `Operator`, `KnowledgeDoc`, `Confidence Threshold`, `Seam`).
- **LLM Invariant**: Zero GPU requirement. Support cloud-hosted LLM APIs (Groq, OpenRouter, Gemini, DeepSeek) via LiteLLM abstraction as well as optional self-hosted Ollama.
- **Architectural Rules**: Async-native (FastAPI + asyncpg + httpx), strict Pydantic v2 schemas at public seams, zero hardcoded secrets.
- **Skills to Consult**: `codebase-design`, `domain-modeling`, `grilling`, `tdd`, `prototype`, `research`.

## Decisions so far

- [001-cloud-llm-and-embedding-strategy.md](./tickets/001-cloud-llm-and-embedding-strategy.md): Groq (`llama-3.3-70b-versatile` primary, `llama-3.1-8b-instant` fast) as the zero-GPU cloud LLM; fastembed `BAAI/bge-large-en-v1.5` (1024-dim, $0) for embeddings; Together AI Flux-Schnell-Free for image generation with Pollinations.ai as no-key fallback. All provider keys injected into `os.environ` at startup via `get_settings()`.
- [002-frontend-scaffold-and-api-client-seam.md](./tickets/002-frontend-scaffold-and-api-client-seam.md): Scaffolded Next.js 14 frontend with Tailwind CSS, shadcn/ui components, assistant-ui AI copilot, executive analytics dashboard, HITL review queue, BANT lead Kanban, and visual content calendar.
- [003-linkedin-api-and-webhook-lifecycle.md](./tickets/003-linkedin-api-and-webhook-lifecycle.md): Implemented personal-profile LinkedIn OAuth (3-legged, `openid profile w_member_social`), encrypted token storage (Fernet), draft-review lifecycle (approve / request-revision / reject), idempotent publication service, `SocialConnection` / `OAuthState` / `PostRevision` / `PublicationAttempt` models + repos, connectors REST router, and 122-test green suite. Webhooks, Page publishing, and programmatic token refresh are explicitly deferred to a later gated tier.

## Frontier & Open Tickets

1. ✅ [001-cloud-llm-and-embedding-strategy.md](./tickets/001-cloud-llm-and-embedding-strategy.md) (`wayfinder:grilling`) — Groq primary LLM, fastembed embeddings, Together AI Flux image gen, 136 tests green.
2. ✅ [002-frontend-scaffold-and-api-client-seam.md](./tickets/002-frontend-scaffold-and-api-client-seam.md) (`wayfinder:prototype`) — Scaffold Next.js 14 frontend with Tailwind/shadcn, Enterprise UI design system, and establish OpenAPI client generation.
3. ✅ [003-linkedin-api-and-webhook-lifecycle.md](./tickets/003-linkedin-api-and-webhook-lifecycle.md) (`wayfinder:research`) — Personal-profile OAuth flow, token cipher, draft review, publication service, connectors router, 122 tests green.
4. ✅ [004-hatchet-workflow-orchestration-and-review-pause.md](./tickets/004-hatchet-workflow-orchestration-and-review-pause.md) (`wayfinder:grilling`) — Define async worker topology, retry policies, and human-in-the-loop review queue pause/resume logic.
5. ⚡ [005-bant-lead-scoring-and-funnel-transitions.md](./tickets/005-bant-lead-scoring-and-funnel-transitions.md) (`wayfinder:grilling`) — Solidify lead scoring mathematical weighting and automated stage transitions (`cold` → `warm` → `hot` → `mql` → `sql`).
6. 🔒 [006-review-queue-and-calendar-ui-components.md](./tickets/006-review-queue-and-calendar-ui-components.md) (`wayfinder:prototype`) — Build interactive review queue and content calendar views in Next.js. *(Blocked by #002)*
7. ⚡ [007-database-migrations-and-seed-fixtures.md](./tickets/007-database-migrations-and-seed-fixtures.md) (`wayfinder:task`) — Validate Alembic migrations against PostgreSQL 16 + pgvector and build seed scripts for mock campaigns and leads.
8. 🔒 [008-end-to-end-integration-and-dod-verification.md](./tickets/008-end-to-end-integration-and-dod-verification.md) (`wayfinder:grilling`) — End-to-end integration test harness and full Docker Compose verification. *(Blocked by #005, #006, #007)*

## Not yet specified

<!-- Fog of War: in-scope upcoming areas not yet sharp enough to ticket -->
- Dynamic RAG chunking optimizations for large PDF knowledge docs.
- Rate limit backoff strategies across high-volume LinkedIn comment spikes.
- Authentik RBAC session synchronization with Next.js middleware.
- Operator audit logs for rejected or edited AI responses.

## Out of scope

<!-- Explicitly excluded from Phase 1 MVP destination -->
- Multi-platform integrations: Meta (Facebook/Instagram), WhatsApp Business API, X/Twitter API *(deferred to Phase 2)*.
- Local Stable Diffusion XL text-to-image pipeline *(deferred to Phase 2)*.
- Bi-directional CRM sync (HubSpot, Salesforce) *(deferred to Phase 2)*.
- Multi-language translation and localization engines *(deferred to Phase 3)*.
- Automated outbound lead nurture sequences *(deferred to Phase 3)*.
