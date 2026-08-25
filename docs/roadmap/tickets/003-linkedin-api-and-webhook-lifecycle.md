# 🎫 Ticket #003: LinkedIn API and Webhook Lifecycle

**Type**: `wayfinder:research` (AFK)  
**Part of**: [Wayfinder Map](../MAP.md)  
**Status**: Open (Frontier)  
**Blocked by**: None  

---

## Question

What are the exact LinkedIn Community Management & Marketing API v2 endpoints, token refresh workflows, sandbox headers, and webhook event payloads required to support automated post publishing and inbound comment ingestion?

### Context
- Implementation in `app/tools/platform/linkedin_tool.py` and `app/api/webhooks/`.
- Need exact specs for:
  1. OAuth 2.0 3-legged authorization flow and token refresh lifespan.
  2. UgcPost / Share on LinkedIn endpoint payloads and status polling.
  3. Webhook subscription verification challenge and signature validation.
  4. Local testing sandbox / mock fixture strategy for LinkedIn webhooks.
