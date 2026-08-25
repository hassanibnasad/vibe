# 🎫 Ticket #006: Review Queue and Calendar UI Components

**Type**: `wayfinder:prototype` (HITL)  
**Part of**: [Wayfinder Map](../MAP.md)  
**Status**: Blocked  
**Blocked by**: [Ticket #002: Frontend Scaffold and API Client Seam](./002-frontend-scaffold-and-api-client-seam.md)  

---

## Question

How should the Next.js Review Queue and Content Calendar components be designed for low latency, smooth optimism, and fast keyboard shortcuts (Approve/Reject/Edit)?

### Context
- The Review Queue is where human operators inspect AI replies generated below the confidence threshold.
- The Content Calendar displays scheduled and published LinkedIn drafts with drag-and-drop rescheduling.
- Needs fast UI interactions with optimistic mutation updates via React Query / TanStack Query.
