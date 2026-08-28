# Ticket 06: Review Queue Split-Pane Triage Console

**Type**: `wayfinder:task`  
**Status**: `blocked`  
**Blocked by**: [Ticket 02: Shadcn UI Primitives Expansion & Radix Components](file:///c:/Users/DELL/OneDrive/Desktop/Code/vibe/docs/wayfinder/tickets/02-shadcn-primitives.md), [Ticket 03: Global Navigation Shell & Command Palette](file:///c:/Users/DELL/OneDrive/Desktop/Code/vibe/docs/wayfinder/tickets/03-layout-shell-and-command.md)  

## Question

How should `/review-queue` be structured into a split-pane triage console with keyboard shortcuts and inline diff inspection?

## Implementation Plan

1. Split-Pane Layout:
   - Left Pane (380px): Compact queue list with confidence score pills (`< 0.85`), platform badge, author name, and relative timestamp.
   - Right Pane (Flexible): Full inspection workspace:
     - Inbound interaction card with raw post text and lead profile metadata.
     - Proposed AI response editor with persistent `<Label>` and character counter.
     - Grounding rationale & RAG context reference accordion.
2. Rapid Triage Controls:
   - Hotkey listeners: `A` (Approve & Dispatch), `R` (Reject & Archive), `E` (Edit reply text), `J`/`K` (Navigate up/down queue).
   - Clear button states with active verbs: "Approve & dispatch", "Reject reply", "Save edit".
3. Empty State:
   - Clean empty state illustration/banner: "Review queue is clear. All automated replies met confidence threshold (>= 0.85)."
