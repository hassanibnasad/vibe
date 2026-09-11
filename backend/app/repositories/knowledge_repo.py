from typing import Any
from uuid import UUID

from sqlalchemy import delete, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.knowledge_doc import KnowledgeDoc
from app.repositories.base import BaseRepository


class KnowledgeRepository(BaseRepository[KnowledgeDoc]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, KnowledgeDoc)

    async def vector_search(
        self,
        query_embedding: list[float],
        doc_types: list[str] | None = None,
        limit: int = 5,
        similarity_threshold: float = 0.3,
        model_name: str | None = None,
    ) -> list[dict[str, Any]]:
        sql = """
            SELECT id, title, content, doc_type, source_file, chunk_index, char_count,
                   embedding_model,
                   1 - (embedding <=> CAST(:embedding AS vector)) AS similarity
            FROM knowledge_docs
            WHERE embedding IS NOT NULL
              AND ingestion_status = 'embedded'
              AND 1 - (embedding <=> CAST(:embedding AS vector)) > :threshold
        """
        params: dict[str, Any] = {
            "embedding": str(query_embedding),
            "threshold": similarity_threshold,
            "limit": limit,
        }

        if doc_types:
            sql += " AND doc_type = ANY(:doc_types)"
            params["doc_types"] = doc_types

        if model_name:
            sql += " AND (embedding_model = :model_name OR embedding_model IS NULL)"
            params["model_name"] = model_name

        sql += " ORDER BY similarity DESC LIMIT :limit"

        result = await self.session.execute(text(sql), params)
        rows = result.fetchall()

        return [
            {
                "id": str(row.id),
                "title": row.title,
                "content": row.content,
                "doc_type": row.doc_type,
                "source_file": row.source_file,
                "chunk_index": row.chunk_index,
                "char_count": row.char_count,
                "embedding_model": getattr(row, "embedding_model", None),
                "similarity": round(row.similarity, 4),
            }
            for row in rows
        ]

    async def upsert_chunk(self, **kwargs: Any) -> None:
        """
        Insert a KnowledgeDoc chunk or update it if ``(tenant_id, source_file, chunk_index)``
        already exists (relies on the unique partial index from migration 002).

        Uses raw SQL ``INSERT ... ON CONFLICT DO UPDATE`` for atomicity.
        """
        # Build the column list dynamically from kwargs so new optional columns
        # (tags, checksum, etc.) work without changing this method signature.
        embedding = kwargs.pop("embedding", None)
        embedding_model = kwargs.pop("embedding_model", None)

        sql = text(
            """
            INSERT INTO knowledge_docs
                (id, tenant_id, title, content, doc_type, embedding, embedding_model,
                 source_file, metadata, chunk_index, parent_doc_id,
                 checksum, char_count, ingestion_status, tags,
                 created_at, updated_at)
            VALUES
                (gen_random_uuid(), :tenant_id, :title, :content, :doc_type, CAST(:embedding AS vector), :embedding_model,
                 :source_file, CAST(:metadata_ AS jsonb), :chunk_index, :parent_doc_id,
                 :checksum, :char_count, :ingestion_status, CAST(:tags AS jsonb),
                 now(), now())
            ON CONFLICT (tenant_id, source_file, chunk_index)
            WHERE source_file IS NOT NULL
            DO UPDATE SET
                title             = EXCLUDED.title,
                content           = EXCLUDED.content,
                doc_type          = EXCLUDED.doc_type,
                embedding         = EXCLUDED.embedding,
                embedding_model   = EXCLUDED.embedding_model,
                metadata          = EXCLUDED.metadata,
                parent_doc_id     = EXCLUDED.parent_doc_id,
                checksum          = EXCLUDED.checksum,
                char_count        = EXCLUDED.char_count,
                ingestion_status  = EXCLUDED.ingestion_status,
                tags              = EXCLUDED.tags,
                updated_at        = now()
            """
        )

        import json  # noqa: PLC0415

        await self.session.execute(
            sql,
            {
                **kwargs,
                "embedding": str(embedding) if embedding is not None else None,
                "embedding_model": embedding_model,
                "metadata_": json.dumps(kwargs.get("metadata_", {})),
                "tags": json.dumps(kwargs.get("tags", [])),
            },
        )
        await self.session.flush()

    async def get_chunks_needing_reembedding(
        self, target_model: str, limit: int = 100, tenant_id: UUID | None = None
    ) -> list[KnowledgeDoc]:
        """
        Return chunks where the stored embedding_model does not match target_model,
        or where embedding is NULL.
        Enables WHERE clause targeted re-embedding.
        """
        from sqlalchemy import or_, select  # noqa: PLC0415

        stmt = select(KnowledgeDoc).where(
            or_(
                KnowledgeDoc.embedding_model.is_(None),
                KnowledgeDoc.embedding_model != target_model,
                KnowledgeDoc.embedding.is_(None),
            )
        )
        if tenant_id is not None:
            stmt = stmt.where(KnowledgeDoc.tenant_id == tenant_id)
        stmt = stmt.order_by(KnowledgeDoc.created_at.asc()).limit(limit)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def update_chunk_embedding(
        self, doc_id: UUID, embedding: list[float], model_name: str
    ) -> None:
        """Update an existing chunk's embedding vector and model_name."""
        sql = text(
            """
            UPDATE knowledge_docs
            SET embedding = :embedding::vector,
                embedding_model = :model_name,
                ingestion_status = 'embedded',
                updated_at = now()
            WHERE id = :doc_id
            """
        )
        await self.session.execute(
            sql,
            {
                "doc_id": doc_id,
                "embedding": str(embedding),
                "model_name": model_name,
            },
        )
        await self.session.flush()

    async def delete_by_source(self, source_file: str, tenant_id: UUID) -> int:
        """
        Delete all chunks belonging to ``source_file`` for the given tenant.

        Returns the number of rows deleted.
        """
        result = await self.session.execute(
            delete(KnowledgeDoc).where(
                KnowledgeDoc.source_file == source_file,
                KnowledgeDoc.tenant_id == tenant_id,
            )
        )
        await self.session.flush()
        return result.rowcount  # type: ignore[return-value]

    async def find_by_checksum(
        self, source_file: str, chunk_index: int, checksum: str
    ) -> KnowledgeDoc | None:
        """
        Return the existing chunk if ``source_file``, ``chunk_index``, and
        ``checksum`` all match — indicating the content is unchanged.

        Used by ``KnowledgeIngestionService`` as an idempotency gate.
        """
        from sqlalchemy import select  # noqa: PLC0415

        stmt = (
            select(KnowledgeDoc)
            .where(
                KnowledgeDoc.source_file == source_file,
                KnowledgeDoc.chunk_index == chunk_index,
                KnowledgeDoc.checksum == checksum,
            )
            .limit(1)
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

