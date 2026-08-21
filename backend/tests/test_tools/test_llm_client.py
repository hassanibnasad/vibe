from unittest.mock import AsyncMock, MagicMock
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
    assert client._resolve_model_name("primary") == settings.OLLAMA_MODEL_PRIMARY
    assert client._resolve_model_name("fast") == settings.OLLAMA_MODEL_FAST
    assert client._resolve_model_name("embed") == settings.OLLAMA_EMBED_MODEL
    assert client._resolve_model_name("custom-model:latest") == "custom-model:latest"


@pytest.mark.asyncio
async def test_llm_client_successful_generation():
    mock_http = AsyncMock()
    mock_res = MagicMock()
    mock_res.status_code = 200
    mock_res.json.return_value = {
        "response": "Here is an engaging LinkedIn post.",
        "eval_count": 85,
    }
    mock_http.post.return_value = mock_res

    client = LLMClient(http_client=mock_http)
    result = await client.generate(prompt="Write a post about AI", model="fast")

    assert isinstance(result, LLMResponse)
    assert result.text == "Here is an engaging LinkedIn post."
    assert result.tokens_used == 85
    assert result.fallback_used is False


@pytest.mark.asyncio
async def test_llm_client_fallback_to_fast_model():
    mock_http = AsyncMock()

    # First call (primary 70b) fails with 500 error
    error_res = MagicMock()
    error_res.status_code = 500
    error_res.raise_for_status.side_effect = Exception("OOM in 70B model")

    # Second call (fast 8b fallback) succeeds
    success_res = MagicMock()
    success_res.status_code = 200
    success_res.json.return_value = {
        "response": "Fallback generated post from 8B model.",
        "eval_count": 45,
    }

    mock_http.post.side_effect = [error_res.raise_for_status.side_effect, success_res]

    client = LLMClient(http_client=mock_http)
    result = await client.generate(
        prompt="Analyze trends",
        model="primary",
        max_retries=0,
        allow_fallback=True,
    )

    assert result.fallback_used is True
    assert result.model == settings.OLLAMA_MODEL_FAST
    assert "Fallback generated post" in result.text


@pytest.mark.asyncio
async def test_llm_client_generate_structured():
    mock_http = AsyncMock()
    mock_res = MagicMock()
    mock_res.status_code = 200
    mock_res.json.return_value = {
        "response": '```json\n{"headline": "AI Launch", "key_points": ["Fast", "Open-source"]}\n```',
        "eval_count": 50,
    }
    mock_http.post.return_value = mock_res

    client = LLMClient(http_client=mock_http)
    structured_obj, raw_res = await client.generate_structured(
        prompt="Give me structured points",
        schema=SampleStructuredOutput,
    )

    assert isinstance(structured_obj, SampleStructuredOutput)
    assert structured_obj.headline == "AI Launch"
    assert len(structured_obj.key_points) == 2
