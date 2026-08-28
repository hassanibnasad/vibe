# Ticket 03: Global Navigation Shell & Command Palette

**Type**: `wayfinder:task`  
**Status**: `blocked`  
**Blocked by**: [Ticket 02: Shadcn UI Primitives Expansion & Radix Components](file:///c:/Users/DELL/OneDrive/Desktop/Code/vibe/docs/wayfinder/tickets/02-shadcn-primitives.md)  

## Question

How should the global app layout shell (`Sidebar.tsx`, `Header.tsx`, `layout.tsx`) be redesigned into a compact, responsive enterprise frame with breadcrumbs and keyboard navigation?

## Implementation Plan

1. Overhaul `Sidebar.tsx`:
   - Set fixed compact width (220px / 14rem).
   - Domain grouping: `OPERATE` (Command Center, Review Queue, Content Studio) and `INTELLIGENCE` (Lead Pipeline, Knowledge & RAG, AI Copilot).
   - Remove gradient icon boxes; use crisp monochrome Lucide icons with subtle active indicator.
   - Show live count badges (e.g. pending reviews, hot leads) using semantic muted badge styles.
   - Footer: Compact system health status pill (`Gateway Online • LiteLLM + Hatchet`).
2. Overhaul `Header.tsx`:
   - Slim 48px sticky bar.
   - Breadcrumbs indicating active section and sub-view.
   - LiteLLM model selector using `DropdownMenu` component.
   - Global Copilot sheet trigger button (`Assistant Copilot`).
   - Quick action button (`New Brief` or `Triage Queue`).
3. Add `Cmd+K` Command Menu dialog for instant keyboard navigation across all views.
