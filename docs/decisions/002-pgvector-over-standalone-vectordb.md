# 2. Use PostgreSQL + pgvector for Relational and Semantic Storage

Date: 2026-08-20  
Status: Accepted

## Context
VibeAgent requires relational storage for operational entities (Leads, Posts, Campaigns, Interactions) as well as vector storage for RAG document chunks (`KnowledgeDoc`) and semantic search.

## Decision
We use **PostgreSQL 16 with the `pgvector` extension** as our unified database for both relational models and vector embeddings.

## Rationale
1. **Single Source of Truth**: Eliminates synchronization lag, multi-database transaction overhead, and dual-write inconsistency between SQL and a separate vector database (e.g. Pinecone, Qdrant, Chroma).
2. **ACID Transactions**: Vector operations and operational metadata (e.g. associating knowledge docs with specific campaigns or workspaces) occur in a single ACID transaction.
3. **Simplicity & Production-Grade**: Fewer infrastructure containers in local dev and staging environments.
4. **Performance**: pgvector HNSW / IVFFlat indexing is more than adequate for VibeAgent's knowledge retrieval throughput and scale.

## Consequences
- Requires PostgreSQL with `pgvector` pre-installed (provided in Docker image `pgvector/pgvector:pg16`).
- Embeddings are indexed with cosine distance (`vector_cosine_ops`).
