from types import SimpleNamespace
from unittest.mock import AsyncMock, patch
import pytest
from pydantic import BaseModel

from app.config import settings
from app.exceptions import LLMError
from app.tools.ai.llm_client import LLMClient, LLMResponse


class SampleStructuredOutput(BaseModel):
    headline: str
    key_points: list[str]


@pytest.mark.asyncio
async def test_llm_client_model_resolution():
    client = LLMClient()
    assert client._resolve_model_name("primary") == settings.LLM_MODEL_PRIMARY
    assert client._resolve_model_name("fast") == settings.LLM_MODEL_FAST
    assert client._resolve_model_name("embed") == settings.LLM_EMBED_MODEL
    assert client._resolve_model_name("gpt-4o-mini") == "ollama/gpt-4o-mini"
    assert client._resolve_model_name("openai/gpt-4o") == "openai/gpt-4o"


@pytest.mark.asyncio
async def test_llm_client_successful_generation():
    mock_choice = SimpleNamespace(message=SimpleNamespace(content="Here is an engaging LinkedIn post."))
    mock_usage = SimpleNamespace(total_tokens=85)
    mock_resp = SimpleNamespace(
        choices=[mock_choice],
        model="ollama/llama3.1:8b",
        usage=mock_usage,
        _response_cost=0.00012,
    )

    with patch("litellm.acompletion", new=AsyncMock(return_value=mock_resp)):
        client = LLMClient()
        result = await client.generate(prompt="Write a post about AI", model="fast")

        assert isinstance(result, LLMResponse)
        assert result.text == "Here is an engaging LinkedIn post."
        assert result.tokens_used == 85
        assert result.cost_usd == 0.00012
        assert result.fallback_used is False


@pytest.mark.asyncio
async def test_llm_client_fallback_to_fast_model():
    mock_choice = SimpleNamespace(message=SimpleNamespace(content="Fallback generated post from 8B model."))
    mock_usage = SimpleNamespace(total_tokens=45)
    mock_resp = SimpleNamespace(
        choices=[mock_choice],
        model="ollama/llama3.1:8b",  # actual model returned was the fallback
        usage=mock_usage,
        _response_cost=0.0,
    )

    with patch("litellm.acompletion", new=AsyncMock(return_value=mock_resp)):
        client = LLMClient()
        result = await client.generate(
            prompt="Analyze trends",
            model="primary",  # requested 70B, but resolved to 8B fallback
            allow_fallback=True,
        )

        assert result.fallback_used is True
        assert result.model == settings.LLM_MODEL_FAST
        assert "Fallback generated post" in result.text


@pytest.mark.asyncio
async def test_llm_client_generate_structured():
    mock_choice = SimpleNamespace(
        message=SimpleNamespace(content='```json\n{"headline": "AI Launch", "key_points": ["Fast", "Open-source"]}\n```')
    )
    mock_resp = SimpleNamespace(
        choices=[mock_choice],
        model="ollama/llama3.1:8b",
        usage=SimpleNamespace(total_tokens=50),
        _response_cost=0.0,
    )

    with patch("litellm.acompletion", new=AsyncMock(return_value=mock_resp)):
        client = LLMClient()
        structured_obj, raw_res = await client.generate_structured(
            prompt="Give me structured points",
            schema=SampleStructuredOutput,
        )

        assert isinstance(structured_obj, SampleStructuredOutput)
        assert structured_obj.headline == "AI Launch"
        assert len(structured_obj.key_points) == 2


@pytest.mark.asyncio
async def test_llm_client_embedding():
    mock_emb_resp = SimpleNamespace(
        data=[{"embedding": [0.1, 0.2, 0.3, 0.4]}]
    )

    with patch("litellm.aembedding", new=AsyncMock(return_value=mock_emb_resp)):
        client = LLMClient()
        emb = await client.embed("test text chunk")
        assert emb == [0.1, 0.2, 0.3, 0.4]
