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
    ) -> list[dict[str, Any]]:
        sql = """
            SELECT id, title, content, doc_type, source_file, chunk_index, char_count,
                   1 - (embedding <=> :embedding::vector) AS similarity
            FROM knowledge_docs
            WHERE embedding IS NOT NULL
              AND ingestion_status = 'embedded'
              AND 1 - (embedding <=> :embedding::vector) > :threshold
        """
        params: dict[str, Any] = {
            "embedding": str(query_embedding),
            "threshold": similarity_threshold,
            "limit": limit,
        }

        if doc_types:
            sql += " AND doc_type = ANY(:doc_types)"
            params["doc_types"] = doc_types

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

        sql = text(
            """
            INSERT INTO knowledge_docs
                (id, tenant_id, title, content, doc_type, embedding,
                 source_file, metadata, chunk_index, parent_doc_id,
                 checksum, char_count, ingestion_status, tags,
                 created_at, updated_at)
            VALUES
                (gen_random_uuid(), :tenant_id, :title, :content, :doc_type, :embedding::vector,
                 :source_file, :metadata_::jsonb, :chunk_index, :parent_doc_id,
                 :checksum, :char_count, :ingestion_status, :tags::jsonb,
                 now(), now())
            ON CONFLICT (tenant_id, source_file, chunk_index)
            WHERE source_file IS NOT NULL
            DO UPDATE SET
                title             = EXCLUDED.title,
                content           = EXCLUDED.content,
                doc_type          = EXCLUDED.doc_type,
                embedding         = EXCLUDED.embedding,
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
                "metadata_": json.dumps(kwargs.get("metadata_", {})),
                "tags": json.dumps(kwargs.get("tags", [])),
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

