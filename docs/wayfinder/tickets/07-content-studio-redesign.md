# Ticket 07: Content Studio & Split-Pane Editor

**Type**: `wayfinder:task`  
**Status**: `blocked`  
**Blocked by**: [Ticket 02: Shadcn UI Primitives Expansion & Radix Components](file:///c:/Users/DELL/OneDrive/Desktop/Code/vibe/docs/wayfinder/tickets/02-shadcn-primitives.md), [Ticket 03: Global Navigation Shell & Command Palette](file:///c:/Users/DELL/OneDrive/Desktop/Code/vibe/docs/wayfinder/tickets/03-layout-shell-and-command.md)  

## Question

How should `/studio` be redesigned into a professional drafting environment with persistent form validation and side-by-side preview?

## Implementation Plan

1. Split-Pane Studio Layout:
   - Left Column (440px Form Pane):
     - Persistent `<Label>` for "Campaign Brief & Angle" with character count.
     - Tone selector with descriptive tooltips / pills.
     - Variant count selector (1–4).
     - RAG Grounding toggle switch (`<Switch>`) with selected knowledge base indicators.
     - Generate button with explicit loading state ("Generating 3 variants with LiteLLM...").
   - Right Column (Flexible Output Pane):
     - Variant tabs (`Variant 1`, `Variant 2`, `Variant 3`).
     - Rendered post preview formatted specifically for LinkedIn (character counter, hashtag pill list, read time).
     - Action toolbar: "Copy to clipboard", "Schedule post" (opens Schedule `<Dialog>`), "Save draft".
2. Multi-Tab Workflow:
   - `Post Creator` vs `Editorial Calendar` (compact calendar grid showing scheduled and published slots).
3. Active-Voice Copy and Zero Emoji.
