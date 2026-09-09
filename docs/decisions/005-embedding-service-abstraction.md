# ADR-005: Embedding Service Abstraction

**Status:** Accepted  
**Date:** 2026-09-09  
**Deciders:** Project team  

## Context

Embedding was a method on `LLMClient` (`LLMClient.embed()`), tightly coupling
vector generation with the general-purpose LLM client. This made it impossible
to enforce model-dimension consistency with the database schema, add task-aware
prefixing for modern models, batch embed calls, or swap backends without
touching every caller.

## Decision

Extract a dedicated `EmbeddingService` in `app/services/embedding_service.py`
that is the **single source of truth** for all embedding operations.

- **Backend strategy pattern**: `FastEmbedBackend` (in-process ONNX, $0 cost)
  as default with `BAAI/bge-large-en-v1.5` (1024-dimensional vectors);
  `LiteLLMBackend` (Ollama, OpenAI, DeepInfra, etc.) as alternative. Selected
  via `EMBEDDING_BACKEND` env var.
- **Redis embedding cache**: `EmbeddingCache` provides atomic single-vector and
  batch pipeline caching keyed by `embed:{model_name}:{sha256(text)}`, preventing
  redundant model compute for repeated queries and ingestion runs with graceful
  degradation on Redis outages.
- **Task-aware prefixing**: `EmbedTask.SEARCH_DOCUMENT` vs
  `EmbedTask.SEARCH_QUERY` automatically prepends the correct instruction
  prefix for models that require it (BGE, Nomic).
- **Dimension validation**: asserted at service init against
  `EMBEDDING_DIMENSIONS` (1024) config value to prevent model/schema mismatch.
- **Batch embedding**: `embed_many()` for efficient bulk operations.
- **Model tracking in vector DB**: `embedding_model` column in `knowledge_docs`
  records which model produced each chunk vector, enabling targeted re-embedding
  via `WHERE (embedding_model != :current_model OR embedding_model IS NULL)`.

## Consequences

- All callers (`KnowledgeIngestionService`, `RAGTool`) depend on
  `EmbeddingService` instead of `LLMClient` for embedding.
- `LLMClient.embed()` is deprecated but retained for backward compatibility.
- Chunks and queries are cached in Redis, drastically reducing CPU usage.
- Re-embedding outdated chunks can be performed safely via migration and
  selective query filtering on `knowledge_docs.embedding_model`.
