# Enterprise UI Redesign: Wayfinder Map

## Destination

Transform VibeAgent's frontend into a dense, high-precision, enterprise-grade operations console powered by **shadcn/ui** and **assistant-ui**, eliminating all decorative glow/gradient noise and enforcing strict enterprise UX invariants (compact density, sticky tables, right-aligned metrics, persistent form labels, 4-state error/empty coverage, and active-voice copy).

## Notes

- **Domain**: Social agent orchestration, B2B lead triage, RAG content generation, review queue operations.
- **Skills to consult**: `codebase-design`, `writing-for-agents`.
- **Standing preferences**:
  - Zero decorative gradients, neon glow filters, or arbitrary shadows.
  - Standardized Zinc/Slate semantic tokens (`--background`, `--card`, `--border`, `--muted`, `--accent`).
  - Strict 4-state coverage on all data-fetching views (Loading Skeleton, Empty with action, Error with retry, Connected).
  - Dense typography scale and compact table rows with sticky headers.
  - Active-voice, unambiguous copy with zero emoji and zero exclamation marks.

---

## Frontier (Unblocked & Ready to Claim)

- [Ticket 01: Design System Tokens & Global CSS Cleansing](file:///c:/Users/DELL/OneDrive/Desktop/Code/vibe/docs/wayfinder/tickets/01-design-tokens-and-css.md)

---

## Blocked Tickets

- [Ticket 02: Shadcn UI Primitives Expansion & Radix Components](file:///c:/Users/DELL/OneDrive/Desktop/Code/vibe/docs/wayfinder/tickets/02-shadcn-primitives.md) — *Blocked by: Ticket 01*
- [Ticket 03: Global Navigation Shell & Command Palette](file:///c:/Users/DELL/OneDrive/Desktop/Code/vibe/docs/wayfinder/tickets/03-layout-shell-and-command.md) — *Blocked by: Ticket 02*
- [Ticket 04: Assistant UI Integration & Custom Tool Renderers](file:///c:/Users/DELL/OneDrive/Desktop/Code/vibe/docs/wayfinder/tickets/04-assistant-ui-copilot.md) — *Blocked by: Ticket 02, Ticket 03*
- [Ticket 05: Command Center Dashboard Redesign](file:///c:/Users/DELL/OneDrive/Desktop/Code/vibe/docs/wayfinder/tickets/05-dashboard-redesign.md) — *Blocked by: Ticket 02, Ticket 03*
- [Ticket 06: Review Queue Split-Pane Triage Console](file:///c:/Users/DELL/OneDrive/Desktop/Code/vibe/docs/wayfinder/tickets/06-review-queue-redesign.md) — *Blocked by: Ticket 02, Ticket 03*
- [Ticket 07: Content Studio & Split-Pane Editor](file:///c:/Users/DELL/OneDrive/Desktop/Code/vibe/docs/wayfinder/tickets/07-content-studio-redesign.md) — *Blocked by: Ticket 02, Ticket 03*
- [Ticket 08: Lead Pipeline Data Table & Detail Drawer](file:///c:/Users/DELL/OneDrive/Desktop/Code/vibe/docs/wayfinder/tickets/08-lead-pipeline-redesign.md) — *Blocked by: Ticket 02, Ticket 03*
- [Ticket 09: Knowledge & RAG Index Console](file:///c:/Users/DELL/OneDrive/Desktop/Code/vibe/docs/wayfinder/tickets/09-knowledge-base-redesign.md) — *Blocked by: Ticket 02, Ticket 03*
- [Ticket 10: Final UI Verification, Narrow-Width Check & Flourish Audit](file:///c:/Users/DELL/OneDrive/Desktop/Code/vibe/docs/wayfinder/tickets/10-ui-verification-and-audit.md) — *Blocked by: Tickets 04, 05, 06, 07, 08, 09*

---

## Decisions so far

*(None yet — map chartered)*

---

## Not yet specified

- **Live WebSocket streaming for Agent execution logs**: Streaming agent thoughts directly into the copilot drawer during long-running tasks.
- **Custom Theme Accent Selector in Operator Settings**: Allowing the operator to switch primary accent color between enterprise Slate, Blue, and Zinc.

---

## Out of scope

- Direct backend rewrite (FastAPI/Hatchet backend logic remains unchanged; frontend connects via standard seams).
- Replacing Next.js framework (Next.js 14 App Router is preserved).
