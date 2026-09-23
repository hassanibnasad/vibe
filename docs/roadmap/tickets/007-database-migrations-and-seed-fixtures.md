# 🎫 Ticket #007: Database Migrations and Seed Fixtures

**Type**: `wayfinder:task` (AFK)  
**Part of**: [Wayfinder Map](../MAP.md)  
**Status**: ✅ Done  
**Closed by commits**: `d971a2b`  

---

## Question

How can we verify that all Alembic migrations execute cleanly against PostgreSQL 16 + pgvector and provide seed fixtures for rapid local development?

---

## Resolution

### Migration 005 — LinkedIn Connector Tables

[`005_linkedin_connector_tables.py`](../../backend/alembic/versions/005_linkedin_connector_tables.py) adds:

| Table | Notes |
|-------|-------|
| `social_connections` | Encrypted token storage, per-operator, RLS-protected |
| `oauth_states` | Single-use SHA-256 state hashes (no RLS — state_hash is a shared secret) |
| `post_revisions` | Numbered revisions per post, RLS-protected |
| `publication_attempts` | Idempotency ledger keyed by `(post_id, connection_id)`, RLS-protected |
| `posts.social_connection_id` | FK column + index added to existing `posts` table |

All new tables follow the existing RLS pattern: `tenant_id::text = current_setting('app.current_tenant', true)`.

### Seed Script

[`backend/scripts/seed_dev_data.py`](../../backend/scripts/seed_dev_data.py) — idempotent (`ON CONFLICT DO NOTHING`), covers:

1. **Platforms**: LinkedIn (`active`), Twitter, Threads (`inactive`).
2. **Campaign**: "VibeAgent Demo Campaign" targeting B2B SaaS.
3. **KnowledgeDocs** (3): Product overview, ICP, Pricing — text-only (`embedding_status=pending`).
4. **Leads** (5): One per funnel stage — `cold/warm/hot/mql/sql` with realistic BANT state.
5. **Conversations + Messages** (3 threads, 6 messages) tied to cold/hot/sql leads.

```bash
# Run seed after `alembic upgrade head`:
python backend/scripts/seed_dev_data.py
```
