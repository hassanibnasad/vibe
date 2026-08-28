# 🎫 Ticket #002: Frontend Scaffold and API Client Seam

**Type**: `wayfinder:prototype` (HITL)  
**Part of**: [Wayfinder Map](../MAP.md)  
**Status**: Done  
**Blocked by**: None  

---

## Question

How should the Next.js 14 frontend application be initialized and connected to the FastAPI backend seams to provide a type-safe contract without manual API glue code?

### Decisions Made & Implemented

1. **Next.js 14 App Router + Enterprise Design System**:
   - Initialized `frontend/` using Next.js 14 App Router, TypeScript, and Tailwind CSS.
   - Built full Enterprise UI design token hierarchy (`bg-canvas`, `bg-surface`, `bg-surface-raised`, `border-default`, `border-strong`, `text-primary`, `text-secondary`, `text-disabled`, semantic status tokens, and deliberate single accent).
   - Designed complete application shell with `Sidebar`, `Header` (with live LLM model switcher and breadcrumbs), and slide-over `CopilotDrawer`.

2. **Automated OpenAPI Type-Safe Seam**:
   - Configured `openapi-typescript` and automated script `scripts/generate-api-types.mjs` (`npm run generate:api`) that fetches the live OpenAPI 3.1 specification from `http://localhost:8000/openapi.json` (or cached schema) and produces typed definitions in `src/lib/api-schema.d.ts`.
   - Created Python backend utility `backend/scripts/export_openapi.py` for headless schema export.

3. **Deep Module API Client (`src/lib/api-client.ts`)**:
   - Implemented a unified, resilient client supporting `fetchDashboardMetrics`, `generatePost`, `fetchPosts`, `schedulePost`, `fetchLeads`, `updateLeadStage`, `fetchReviewQueue`, `approveReviewItem`, `rejectReviewItem`, and `fetchHealthStatus`.
   - Included timeout boundaries and realistic development fallback fixtures for offline/isolated frontend testing.

4. **Full Feature Screens**:
   - `/` — Command Center with KPI metrics, live dispatch stream table, agent status telemetry, and error/empty state boundaries.
   - `/review-queue` — Human-in-the-loop review queue with split-pane triage, keyboard shortcuts (`A`, `R`, `E`, `J`/`K`), RAG citation cards, and active-voice dispatch actions.
   - `/leads` — BANT lead scoring pipeline table with stage filters, search, right-aligned metrics, and slide-over lead detail sheet.
   - `/studio` — Marketing post draft generator with tone selection, variant comparison, character counter, and scheduling calendar.
   - `/knowledge` — Vector knowledge doc manager with chunk statistics and document upload dialog.
   - `/assistant` — Floating & dedicated AI copilot powered by `@assistant-ui/react`.

### Verification

- `npm run generate:api` connects to backend and generates `src/lib/api-schema.d.ts`.
- `npm run build` passes with zero type errors and static page prerendering across all routes.
