from unittest.mock import AsyncMock
import pytest

from app.tools.ai.rag_tool import RAGTool, RAGResult


@pytest.mark.asyncio
async def test_rag_tool_search_and_retrieve():
    mock_llm = AsyncMock()
    mock_llm.embed.return_value = [0.1] * 384

    mock_repo = AsyncMock()
    mock_repo.vector_search.return_value = [
        {
            "id": "11111111-1111-1111-1111-111111111111",
            "title": "Brand Guidelines",
            "content": "Our brand voice is innovative and enterprise-ready.",
            "doc_type": "brand",
            "similarity": 0.88,
        },
        {
            "id": "22222222-2222-2222-2222-222222222222",
            "title": "Product Pricing FAQ",
            "content": "Enterprise tiers include dedicated GPU instances.",
            "doc_type": "faq",
            "similarity": 0.79,
        },
    ]

    rag_tool = RAGTool(knowledge_repo=mock_repo, llm_client=mock_llm)

    result = await rag_tool.retrieve_context(query="pricing and brand", limit=2)

    assert isinstance(result, RAGResult)
    assert len(result.documents) == 2
    assert result.top_score == 0.88
    assert "[BRAND] Brand Guidelines:" in result.formatted_text
    assert "[FAQ] Product Pricing FAQ:" in result.context_text
    mock_llm.embed.assert_awaited_once_with("pricing and brand")
    mock_repo.vector_search.assert_awaited_once()


@pytest.mark.asyncio
async def test_rag_tool_empty_results():
    mock_llm = AsyncMock()
    mock_llm.embed.return_value = [0.0] * 384

    mock_repo = AsyncMock()
    mock_repo.vector_search.return_value = []

    rag_tool = RAGTool(knowledge_repo=mock_repo, llm_client=mock_llm)
    result = await rag_tool.search(query="nonexistent topic")

    assert result.documents == []
    assert result.formatted_text == ""
    assert result.top_score == 0.0
