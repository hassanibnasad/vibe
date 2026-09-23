# 🎫 Ticket #003: LinkedIn API and Webhook Lifecycle

**Type**: `wayfinder:research` (AFK)  
**Part of**: [Wayfinder Map](../MAP.md)  
**Status**: ✅ Done  
**Closed by commits**: `3251cf3`, `1062ea7`, `8d9c906`, `4377d3e`, `5064c0e`, `ab77d68`  

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

---

## Resolution

Research findings captured in [003-linkedin-api-and-webhook-lifecycle-findings.md](./003-linkedin-api-and-webhook-lifecycle-findings.md).  
All implementation decisions from the findings have been applied:

| Component | File(s) | Status |
|-----------|---------|--------|
| Token encryption (Fernet AES-128-CBC) | `services/token_cipher.py` | ✅ Done |
| OAuth config (client ID/secret/redirect/author URN) | `config.py`, `.env.example` | ✅ Done |
| `SocialConnection`, `OAuthState`, `PostRevision`, `PublicationAttempt` models | `models/` | ✅ Done |
| Repos for all four models | `repositories/` | ✅ Done |
| LinkedIn OAuth service (begin→callback→userinfo→upsert) | `services/linkedin_connection_service.py` | ✅ Done |
| Draft review service (approve / request-revision / reject) | `services/draft_review_service.py` | ✅ Done |
| Publication service (idempotent dispatch via `linkedin_tool.py`) | `services/publication_service.py` | ✅ Done |
| Connectors REST router (authorize / callback / list / delete) | `api/v1/connectors.py` | ✅ Done |
| Content workflow gated behind explicit review step | `workflows/content_workflow.py` | ✅ Done |
| Test suite for all above (122 passing) | `tests/test_api/`, `tests/test_services/` | ✅ Done |

### Deferred (out of scope for personal-profile MVP)
- Webhook subscription verification & inbound comment ingestion — requires Community Management API (Standard tier).
- LinkedIn Page / organization publishing — requires `w_organization_social`.
- Programmatic token refresh — requires Marketing Developer Platform partnership.
