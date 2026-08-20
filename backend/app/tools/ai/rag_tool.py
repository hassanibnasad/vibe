from pydantic import BaseModel

from app.repositories.knowledge_repo import KnowledgeRepository
from app.tools.ai.llm_client import LLMClient


class RAGResult(BaseModel):
    documents: list[dict]
    formatted_text: str
    top_score: float

    @property
    def context_text(self) -> str:
        return self.formatted_text


class RAGTool:
    def __init__(self, knowledge_repo: KnowledgeRepository, llm_client: LLMClient):
        self.repo = knowledge_repo
        self.llm = llm_client

    async def search(
        self,
        query: str,
        doc_types: list[str] | None = None,
        limit: int = 5,
        similarity_threshold: float = 0.3,
    ) -> RAGResult:
        query_embedding = await self.llm.embed(query)
        documents = await self.repo.vector_search(
            query_embedding=query_embedding,
            doc_types=doc_types,
            limit=limit,
            similarity_threshold=similarity_threshold,
        )

        formatted_text = "\n\n---\n\n".join(
            f"[{doc.get('doc_type', 'GENERAL').upper()}] {doc.get('title', 'Untitled')}:\n{doc.get('content', '')}"
            for doc in documents
        )
        top_score = documents[0]["similarity"] if documents else 0.0

        return RAGResult(
            documents=documents,
            formatted_text=formatted_text,
            top_score=top_score,
        )

    async def retrieve_context(
        self,
        query: str,
        doc_types: list[str] | None = None,
        limit: int = 3,
        similarity_threshold: float = 0.3,
    ) -> RAGResult:
        return await self.search(
            query=query,
            doc_types=doc_types,
            limit=limit,
            similarity_threshold=similarity_threshold,
        )

