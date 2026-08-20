from typing import Any

from sqlalchemy import text
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
            SELECT id, title, content, doc_type,
                   1 - (embedding <=> :embedding::vector) AS similarity
            FROM knowledge_docs
            WHERE embedding IS NOT NULL
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
                "similarity": round(row.similarity, 4),
            }
            for row in rows
        ]
