# 🎫 Ticket #002: Frontend Scaffold and API Client Seam

**Type**: `wayfinder:prototype` (HITL)  
**Part of**: [Wayfinder Map](../MAP.md)  
**Status**: Open (Frontier)  
**Blocked by**: None  

---

## Question

How should the Next.js 14 frontend application be initialized and connected to the FastAPI backend seams to provide a type-safe contract without manual API glue code?

### Context
- The `frontend/` directory does not yet exist.
- We need Next.js 14 (App Router) + Tailwind CSS + shadcn/ui components.
- We need an automated OpenAPI-to-TypeScript client generation workflow (e.g. `openapi-typescript` or `orval` targeting `http://localhost:8000/openapi.json`).
- Core layout shell (Sidebar navigation, dark/light theme, operator profile header).
