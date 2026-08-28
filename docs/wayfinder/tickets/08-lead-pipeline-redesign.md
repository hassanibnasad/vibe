# Ticket 08: Lead Pipeline Data Table & Detail Drawer

**Type**: `wayfinder:task`  
**Status**: `blocked`  
**Blocked by**: [Ticket 02: Shadcn UI Primitives Expansion & Radix Components](file:///c:/Users/DELL/OneDrive/Desktop/Code/vibe/docs/wayfinder/tickets/02-shadcn-primitives.md), [Ticket 03: Global Navigation Shell & Command Palette](file:///c:/Users/DELL/OneDrive/Desktop/Code/vibe/docs/wayfinder/tickets/03-layout-shell-and-command.md)  

## Question

How should `/leads` be transformed from loose kanban cards into an enterprise-grade data table with sticky headers, multi-criteria filters, and a slide-over detail drawer?

## Implementation Plan

1. Header & Filter Bar:
   - Search input (filter by name, company, title).
   - Stage filter dropdown (`All`, `Cold`, `Warm`, `Hot`, `MQL`, `SQL`).
   - Sentiment filter dropdown.
   - Lead count summary (e.g. "Showing 5 of 5 qualified leads • 2 SQL").
2. Compact Data Table:
   - Sticky header with sorting on Score and Last Interaction.
   - Columns: Lead Name & Title, Company, Stage Badge (`Cold`, `Warm`, `Hot`, `MQL`, `SQL`), Lead Score (right-aligned `font-mono`), Intent Signals chips, Last Active, Row Action button.
3. Slide-over Lead Detail Drawer (`<Sheet>`):
   - Opens when clicking any row.
   - Shows full profile metadata, BANT qualification breakdown, interaction timeline with sentiment history, and direct SDR action triggers ("Export to CRM", "Draft DM reply").
4. Empty & Skeleton states.
