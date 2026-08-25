# 🎫 Ticket #007: Database Migrations and Seed Fixtures

**Type**: `wayfinder:task` (AFK)  
**Part of**: [Wayfinder Map](../MAP.md)  
**Status**: Blocked  
**Blocked by**: [Ticket #001: Cloud LLM and Embedding Strategy](./001-cloud-llm-and-embedding-strategy.md)  

---

## Question

How can we verify that all Alembic migrations execute cleanly against PostgreSQL 16 + pgvector and provide seed fixtures for rapid local development?

### Context
- Schema defined in `app/models/` and `alembic/versions/`.
- Need automated seed scripts for:
  1. Default Platform records (LinkedIn active, others disabled).
  2. Sample KnowledgeDocs with pre-calculated vector embeddings.
  3. Mock Lead records across various stages (`cold` to `sql`).
  4. Test campaigns and conversation interaction threads.
