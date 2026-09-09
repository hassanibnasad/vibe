"""
KnowledgeIngestionService — orchestrates parse → chunk → embed → upsert.

Key design properties:
- **Async-native**: all I/O uses asyncio (embed via EmbeddingService, DB via SQLAlchemy async).
- **Idempotent**: chunks are skipped when their SHA-256 checksum matches an existing row
  (``find_by_checksum``), so re-running on unchanged files is a no-op.
- **Batch embedding**: new chunks are embedded via ``EmbeddingService.embed_many()`` in
  batches of ``EMBEDDING_BATCH_SIZE``, replacing the old per-chunk concurrent calls.
- **Partial failure tolerance**: a failed embed/upsert for one chunk logs an error and
  marks that chunk ``ingestion_status=failed`` but does not abort the whole document.
"""

from __future__ import annotations

import asyncio
import uuid
from dataclasses import dataclass, field
from pathlib import Path
from typing import TYPE_CHECKING, Any

import structlog

from app.config import settings
from app.repositories.knowledge_repo import KnowledgeRepository
from app.services.knowledge.chunker import Chunk, MarkdownAwareChunker
from app.services.knowledge.parsers import DocumentParser

if TYPE_CHECKING:
    from app.services.embedding_service import EmbeddingService
    from app.tools.ai.llm_client import LLMClient

logger = structlog.get_logger()

# Mapping from knowledge-base/ subdirectory name to canonical doc_type value.
_DIR_TO_DOC_TYPE: dict[str, str] = {
    "brand-guidelines": "brand",
    "brand_guidelines": "brand",
    "faq": "faq",
    "product-docs": "product",
    "product_docs": "product",
    "templates": "template",
    "case-studies": "case_study",
    "case_studies": "case_study",
}


@dataclass
class IngestionResult:
    """Summary returned after ingesting a single document."""

    source_file: str
    parent_doc_id: uuid.UUID
    chunks_total: int
    chunks_written: int
    chunks_skipped: int
    chunks_failed: int
    failed_chunk_indices: list[int] = field(default_factory=list)


class KnowledgeIngestionService:
    """
    Orchestrates the full ingestion pipeline for a single document or a
    directory tree of documents.

    Parameters
    ----------
    knowledge_repo:
        Repository for all ``knowledge_docs`` DB operations.
    embedding_service:
        Centralised embedding service.  All vector generation goes through
        this service (replaces the old ``LLMClient.embed()`` calls).
    llm_client:
        **Deprecated**.  Accepted for backward compatibility but ignored when
        ``embedding_service`` is provided.  Will be removed in a future release.
    """

    def __init__(
        self,
        knowledge_repo: KnowledgeRepository,
        embedding_service: EmbeddingService | None = None,
        llm_client: LLMClient | None = None,
    ) -> None:
        self._repo = knowledge_repo

        if embedding_service is not None:
            self._embedding = embedding_service
        elif llm_client is not None:
            # Backward compat: wrap old LLMClient in a thin adapter.
            import warnings  # noqa: PLC0415

            warnings.warn(
                "Passing llm_client to KnowledgeIngestionService is deprecated. "
                "Pass embedding_service instead.",
                DeprecationWarning,
                stacklevel=2,
            )
            self._embedding = _LLMClientAdapter(llm_client)
        else:
            # Auto-construct from global singleton.
            from app.dependencies import get_embedding_service  # noqa: PLC0415

            self._embedding = get_embedding_service()

        self._parser = DocumentParser()
        self._chunker = MarkdownAwareChunker(
            max_tokens=settings.INGESTION_CHUNK_SIZE,
            overlap_tokens=settings.INGESTION_CHUNK_OVERLAP,
        )

    # ── Public API ────────────────────────────────────────────────────────────

    async def ingest_file(
        self,
        path: Path,
        doc_type: str,
        tenant_id: uuid.UUID,
        metadata: dict[str, Any] | None = None,
        tags: list[str] | None = None,
    ) -> IngestionResult:
        """
        Parse a file from disk and ingest its chunks.

        Parameters
        ----------
        path:
            Absolute or workspace-relative path to the file.
        doc_type:
            Canonical doc_type value (e.g. ``"brand"``, ``"faq"``).
        tenant_id:
            Owning tenant.  Stored on every chunk row.
        metadata:
            Arbitrary JSONB metadata merged with parser-derived metadata.
        tags:
            Optional string tags (e.g. ``["pricing", "tier-1"]``).
        """
        parsed = self._parser.parse_path(path)
        merged_meta = {**parsed.metadata, **(metadata or {})}
        return await self._ingest_parsed(
            raw_text=parsed.raw_text,
            document_title=parsed.title,
            source_file=str(path),
            doc_type=doc_type,
            tenant_id=tenant_id,
            metadata=merged_meta,
            tags=tags or [],
        )

    async def ingest_bytes(
        self,
        content: bytes,
        filename: str,
        doc_type: str,
        tenant_id: uuid.UUID,
        mime_type: str | None = None,
        metadata: dict[str, Any] | None = None,
        tags: list[str] | None = None,
    ) -> IngestionResult:
        """
        Parse raw bytes (e.g. from an HTTP upload) and ingest chunks.

        ``source_file`` is set to ``filename`` so the uniqueness constraint
        still fires for repeat uploads of the same filename.
        """
        parsed = self._parser.parse_bytes(content, filename=filename, mime_type=mime_type)
        merged_meta = {**parsed.metadata, **(metadata or {})}
        return await self._ingest_parsed(
            raw_text=parsed.raw_text,
            document_title=parsed.title,
            source_file=filename,
            doc_type=doc_type,
            tenant_id=tenant_id,
            metadata=merged_meta,
            tags=tags or [],
        )

    async def ingest_directory(
        self,
        root: Path,
        tenant_id: uuid.UUID,
        metadata: dict[str, Any] | None = None,
    ) -> dict[str, IngestionResult]:
        """
        Walk ``root`` recursively and ingest every supported file.

        Infers ``doc_type`` from the immediate subdirectory name.
        Falls back to ``"general"`` for files directly under ``root``
        or from unknown subdirectories.

        Returns a mapping of ``source_file → IngestionResult``.
        """
        from app.services.knowledge.parsers import SUPPORTED_EXTENSIONS  # local import for clarity

        results: dict[str, IngestionResult] = {}

        files = sorted(
            p for p in root.rglob("*") if p.is_file() and p.suffix.lower() in SUPPORTED_EXTENSIONS
        )

        logger.info(
            "ingestion_directory.start",
            root=str(root),
            file_count=len(files),
        )

        for path in files:
            # Infer doc_type from the immediate sub-directory under root.
            try:
                relative = path.relative_to(root)
                subdir = relative.parts[0] if len(relative.parts) > 1 else ""
                doc_type = _DIR_TO_DOC_TYPE.get(subdir, "general")
            except ValueError:
                doc_type = "general"

            try:
                result = await self.ingest_file(
                    path=path,
                    doc_type=doc_type,
                    tenant_id=tenant_id,
                    metadata=metadata,
                )
                results[str(path)] = result
                logger.info(
                    "ingestion_directory.file_done",
                    source_file=str(path),
                    doc_type=doc_type,
                    chunks_written=result.chunks_written,
                    chunks_skipped=result.chunks_skipped,
                )
            except Exception as exc:
                logger.error(
                    "ingestion_directory.file_failed",
                    source_file=str(path),
                    error=str(exc),
                )

        return results

    async def delete_by_source(self, source_file: str, tenant_id: uuid.UUID) -> int:
        """
        Delete all chunks whose ``source_file`` matches.

        Returns the number of rows deleted.  Call this before re-ingesting
        a file that has been substantially restructured (heading changes that
        would shift chunk_index assignments).
        """
        count = await self._repo.delete_by_source(source_file=source_file, tenant_id=tenant_id)
        logger.info(
            "ingestion.delete_by_source",
            source_file=source_file,
            rows_deleted=count,
        )
        return count

    # ── Internal ──────────────────────────────────────────────────────────────

    async def _ingest_parsed(
        self,
        raw_text: str,
        document_title: str,
        source_file: str,
        doc_type: str,
        tenant_id: uuid.UUID,
        metadata: dict[str, Any],
        tags: list[str],
    ) -> IngestionResult:
        chunks: list[Chunk] = self._chunker.chunk(raw_text, document_title=document_title)

        logger.info(
            "ingestion.start",
            source_file=source_file,
            doc_type=doc_type,
            chunks=len(chunks),
        )

        if not chunks:
            logger.warning("ingestion.no_chunks", source_file=source_file)
            return IngestionResult(
                source_file=source_file,
                parent_doc_id=uuid.uuid4(),
                chunks_total=0,
                chunks_written=0,
                chunks_skipped=0,
                chunks_failed=0,
            )

        # All chunks of one document share a parent_doc_id.
        parent_doc_id = uuid.uuid4()

        written = 0
        skipped = 0
        failed_indices: list[int] = []

        # Process in batches: checksum-filter → batch-embed → upsert.
        batch_size = settings.EMBEDDING_BATCH_SIZE
        for batch_start in range(0, len(chunks), batch_size):
            batch = chunks[batch_start : batch_start + batch_size]

            # Phase 1: Checksum gate — filter out unchanged chunks.
            new_chunks: list[Chunk] = []
            for chunk in batch:
                existing = await self._repo.find_by_checksum(
                    source_file=source_file,
                    chunk_index=chunk.chunk_index,
                    checksum=chunk.checksum,
                )
                if existing is not None:
                    logger.debug(
                        "ingestion.chunk_skipped_unchanged",
                        chunk_index=chunk.chunk_index,
                        source_file=source_file,
                    )
                    skipped += 1
                else:
                    new_chunks.append(chunk)

            if not new_chunks:
                continue

            # Phase 2: Batch embed all new chunks in one call.
            from app.services.embedding_service import EmbedTask  # noqa: PLC0415

            try:
                embeddings = await self._embedding.embed_many(
                    [c.content for c in new_chunks],
                    task=EmbedTask.SEARCH_DOCUMENT,
                )
            except Exception as exc:
                logger.error(
                    "ingestion.batch_embed_failed",
                    source_file=source_file,
                    batch_start=batch_start,
                    batch_size=len(new_chunks),
                    error=str(exc),
                )
                failed_indices.extend(c.chunk_index for c in new_chunks)
                continue

            # Phase 3: Upsert each embedded chunk.
            for chunk, embedding in zip(new_chunks, embeddings):
                try:
                    await self._repo.upsert_chunk(
                        tenant_id=tenant_id,
                        title=chunk.title,
                        content=chunk.content,
                        doc_type=doc_type,
                        embedding=embedding,
                        embedding_model=self._embedding.model_name,
                        source_file=source_file,
                        metadata_=metadata,
                        chunk_index=chunk.chunk_index,
                        parent_doc_id=parent_doc_id,
                        checksum=chunk.checksum,
                        char_count=chunk.char_count,
                        ingestion_status="embedded",
                        tags=tags,
                    )
                    written += 1
                    logger.debug(
                        "ingestion.chunk_written",
                        chunk_index=chunk.chunk_index,
                        source_file=source_file,
                    )
                except Exception as exc:
                    logger.error(
                        "ingestion.chunk_upsert_failed",
                        chunk_index=chunk.chunk_index,
                        source_file=source_file,
                        error=str(exc),
                    )
                    failed_indices.append(chunk.chunk_index)

        return IngestionResult(
            source_file=source_file,
            parent_doc_id=parent_doc_id,
            chunks_total=len(chunks),
            chunks_written=written,
            chunks_skipped=skipped,
            chunks_failed=len(failed_indices),
            failed_chunk_indices=failed_indices,
        )

    async def reembed_outdated_chunks(
        self,
        target_model: str | None = None,
        batch_size: int = 50,
        tenant_id: UUID | None = None,
    ) -> dict[str, Any]:
        """
        Re-embed chunks where embedding_model does not match target_model
        (defaults to current EmbeddingService model), or where embedding is NULL.

        Enables selective re-embedding using a WHERE clause on embedding_model.
        """
        model_name = target_model or self._embedding.model_name
        from app.services.embedding_service import EmbedTask  # noqa: PLC0415

        total_reembedded = 0
        while True:
            chunks = await self._repo.get_chunks_needing_reembedding(
                target_model=model_name, limit=batch_size, tenant_id=tenant_id
            )
            if not chunks:
                break

            texts = [c.content for c in chunks]
            embeddings = await self._embedding.embed_many(
                texts, task=EmbedTask.SEARCH_DOCUMENT
            )

            for doc, emb in zip(chunks, embeddings):
                await self._repo.update_chunk_embedding(
                    doc_id=doc.id, embedding=emb, model_name=model_name
                )
                total_reembedded += 1

            await self._repo.session.commit()

        logger.info(
            "ingestion.reembed_outdated_completed",
            target_model=model_name,
            total_reembedded=total_reembedded,
        )
        return {
            "model_name": model_name,
            "total_reembedded": total_reembedded,
        }


# ── Backward-compat adapter ──────────────────────────────────────────────────


class _LLMClientAdapter:
    """Thin adapter wrapping old LLMClient.embed() to satisfy EmbeddingService API.

    Used only during the deprecation transition when callers still pass
    ``llm_client=`` to ``KnowledgeIngestionService``.
    """

    def __init__(self, llm_client: LLMClient) -> None:
        self._llm = llm_client

    async def embed(self, text: str, *, task: Any = None) -> list[float]:
        return await self._llm.embed(text)

    async def embed_many(
        self, texts: list[str], *, task: Any = None, batch_size: int | None = None
    ) -> list[list[float]]:
        concurrency = settings.INGESTION_EMBED_CONCURRENCY
        all_embeddings: list[list[float]] = []
        for i in range(0, len(texts), concurrency):
            batch = texts[i : i + concurrency]
            results = await asyncio.gather(*(self._llm.embed(t) for t in batch))
            all_embeddings.extend(results)
        return all_embeddings

    @property
    def dimensions(self) -> int:
        return settings.EMBEDDING_DIMENSIONS

    @property
    def model_name(self) -> str:
        return settings.LLM_EMBED_MODEL
