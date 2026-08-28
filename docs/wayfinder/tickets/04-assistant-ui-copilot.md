# Ticket 04: Assistant UI Integration & Custom Tool Renderers

**Type**: `wayfinder:task`  
**Status**: `blocked`  
**Blocked by**: [Ticket 02: Shadcn UI Primitives Expansion & Radix Components](file:///c:/Users/DELL/OneDrive/Desktop/Code/vibe/docs/wayfinder/tickets/02-shadcn-primitives.md), [Ticket 03: Global Navigation Shell & Command Palette](file:///c:/Users/DELL/OneDrive/Desktop/Code/vibe/docs/wayfinder/tickets/03-layout-shell-and-command.md)  

## Question

How should `@assistant-ui/react` be implemented to provide a streaming, tool-rich marketing copilot on `/assistant` and via a global slide-over drawer?

## Implementation Plan

1. Create `@assistant-ui/react` runtime adapter:
   - Configure thread state, message history, streaming generator responses, and error recovery.
2. Build custom message and tool call components:
   - User message bubble with clear contrast.
   - Assistant message container with streaming markdown.
   - Custom Tool Visualizers:
     - `PostDraftRenderer`: Structured card displaying generated title, content body, character count, and hashtag chips with "Copy" and "Open in Studio" actions.
     - `LeadInsightRenderer`: Structured table of identified high-intent leads with BANT scores and action triggers.
     - `RAGCitationRenderer`: Grounded context citations with similarity scores and source doc references.
3. Quick prompt chips for fast command execution.
4. Export a global `CopilotDrawer` component accessible from any screen via `Header` or `Cmd+K`.
