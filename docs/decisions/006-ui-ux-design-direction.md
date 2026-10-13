# ADR 006: UI/UX Design Direction & Design System

## Status
Accepted

## Context
VibeAgent's early interface suffered from the "AI-generated look": oversized marketing-hero titles inside internal tool pages, purple-indigo gradient buttons, loose spacing, decorative sparkle icons everywhere, disconnected nomenclature ("Brief", "Dispatch", "Review Gate", "Command Center"), and timezone/nested scrollbar bugs in the calendar.

To transform VibeAgent into an enterprise-grade, quiet pro tool that operators trust for daily workflow, we need clear design decisions settled prior to code changes.

## Decision

### 1. Top 3 User Jobs
1. **Publish a Post**: Quickly author, refine, preview against authentic LinkedIn specifications, and schedule or publish content.
2. **Review Drafts**: Swiftly triage AI-generated drafts and replies awaiting human review with keyboard shortcuts, diffs, and confidence scoring.
3. **Keep the Voice On-Brand**: Ground all autonomous generation in extracted brand identity, tone attributes, value propositions, and hard guardrails.

### 2. Visual Direction
- **Quiet Pro Tool with Editorial Touches**: Utilitarian, dense, fast, and structured like Linear, Raycast, or GitHub, with crisp borders and typographic restraint.
- No gratuitous gradients, no soft floaty shadow soup, no decorative icons on labels.
- Motion strictly functional (120–200ms) for orientation and confirmation, respecting `prefers-reduced-motion`.

### 3. Accent Color & UI Typeface
- **Accent Color**: Pro Cobalt (`#2563EB` / `hsl(221.2 83.2% 53.3%)`) used deliberately for primary actions, active navigation states, and focus rings.
- **UI Typeface**: `Plus Jakarta Sans` for clean, modern readability at dense sizes; `JetBrains Mono` restricted strictly to technical data, scores, and tabular numerals.

### 4. Vocabulary Glossary
| Old / AI-Generated Term | Standard Domain Term | Context |
| :--- | :--- | :--- |
| Brief | Post / Topic | Content Studio & generation inputs |
| Dispatch / Verified Dispatches | Publish / Published posts | Lifecycle action & live posts |
| Review Gate | Waiting for review | Items requiring operator intervention |
| Command Center | Today | Main overview dashboard |
| Launch Studio | New post | Global primary creation action |
| Autonomous OS | VibeAgent | System banner & title |
| Vercel AI SDK Engine | (Removed) | Internal plumbing removed from UI |
| Draft Review Queue | Review Queue | Merged unified review interface |

### 5. Success Metrics
1. **Time to First Published Post**: Under 90 seconds for a new operator from prompt to scheduled/published post.
2. **Setup Completion**: > 80% of new workspaces completing Brand extraction and LinkedIn connection via the first-run checklist.
3. **Review Approval Time**: Under 15 seconds per draft or inbound reply approval using keyboard shortcuts and diff preview.
