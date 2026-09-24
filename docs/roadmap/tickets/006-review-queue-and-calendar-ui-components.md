# 🎫 Ticket #006: Review Queue and Calendar UI Components

**Type**: `wayfinder:prototype` (HITL)  
**Part of**: [Wayfinder Map](../MAP.md)  
**Status**: ✅ Done  
**Closed by**: Frontend review queue & calendar implementation  

---

## Question

How should the Next.js Review Queue and Content Calendar components be designed for low latency, smooth optimism, and fast keyboard shortcuts (Approve/Reject/Edit)?

---

## Resolution

### Architecture & Components

1. **`calendar-api.ts`** (`frontend/src/lib/calendar-api.ts`):
   - Typed client for post draft review queue: `fetchPostDraftQueue`, `approvePostDraft`, `rejectPostDraft`, `requestRevision`.
   - Visual calendar helpers: `fetchCalendarPosts`, `reschedulePost`.
   - Includes custom API request handler with standard error handling.

2. **`ContentCalendar`** (`frontend/src/components/calendar/ContentCalendar.tsx`):
   - Interactive month grid displaying scheduled, draft, published, and failed dispatches with platform badges.
   - HTML5 drag-and-drop rescheduling with optimistic local update and asynchronous server sync.
   - Per-day inspector side panel showing detailed post content, status, and scheduled time.
   - Month navigation and date calculation utilities.

3. **`PostDraftQueue`** (`frontend/src/components/calendar/PostDraftQueue.tsx`):
   - Human-in-the-loop review panel specifically for LinkedIn post drafts (distinct from inbound conversation reply triage).
   - Fast operator keyboard shortcuts:
     - `A`: Approve draft for dispatch
     - `X`: Reject draft
     - `E`: Edit inline
     - `R`: Request AI revision with custom feedback prompt
     - `↑` / `k` and `↓` / `j`: Navigate drafts
   - Inline confidence score meter with color thresholds (>=85% emerald, >=70% amber, <70% rose).
   - Optimistic removal of processed items via Framer Motion `AnimatePresence`.

4. **`/calendar` Route** (`frontend/src/app/calendar/page.tsx`):
   - Unified dashboard route accessible from the `OPERATE` group in the sidebar nav.
   - Segmented tab switcher between visual month grid and post draft review queue.

