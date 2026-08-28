# Ticket 05: Command Center Dashboard Redesign

**Type**: `wayfinder:task`  
**Status**: `blocked`  
**Blocked by**: [Ticket 02: Shadcn UI Primitives Expansion & Radix Components](file:///c:/Users/DELL/OneDrive/Desktop/Code/vibe/docs/wayfinder/tickets/02-shadcn-primitives.md), [Ticket 03: Global Navigation Shell & Command Palette](file:///c:/Users/DELL/OneDrive/Desktop/Code/vibe/docs/wayfinder/tickets/03-layout-shell-and-command.md)  

## Question

How should `/` (Command Center Dashboard) be rewritten to deliver maximum scanability, density, and live system situational awareness without marketing-site fluff?

## Implementation Plan

1. Top Ops Strip:
   - High-density status alert bar showing active orchestrator state, connected engine, and actionable pending review count with direct button.
2. 4 Compact KPI Cards:
   - Total Published Posts, Review Queue Backlog, Active Qualified Leads (SQL/MQL), Average Response Latency.
   - Right-aligned values, clean delta badges (`+18% vs 7d`), no decorative neon borders.
3. Live Activity Stream & Recent Dispatches Table:
   - Sticky header data table with compact rows: Timestamp (`font-mono`), Platform, Lead/Target, Action Type, Sentiment/Score, and Dispatch Status badge.
4. Active Agent Cluster Status Card:
   - Health indicators for `ContentGeneratorAgent`, `EngagementAgent`, `LeadQualifierAgent`.
5. Strict 4-state implementation:
   - Skeleton loader during API metrics fetch.
   - Empty state fallback if zero dispatches exist.
   - Error state with "Retry fetch" button if API gateway is unavailable.
