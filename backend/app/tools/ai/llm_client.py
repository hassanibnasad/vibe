import time
from typing import Any

import httpx
from pydantic import BaseModel

from app.config import settings
from app.exceptions import LLMError


class LLMResponse(BaseModel):
    text: str
    model: str
    tokens_used: int
    latency_ms: int


class LLMClient:
    """Async HTTP client for Ollama LLM and embedding inference."""

    def __init__(self, base_url: str | None = None):
        self.base_url = (base_url or settings.OLLAMA_BASE_URL).rstrip("/")
        self.client = httpx.AsyncClient(timeout=120.0)

    async def generate(
        self,
        prompt: str,
        model: str | None = None,
        temperature: float = 0.7,
        max_tokens: int = 2048,
        system_prompt: str | None = None,
    ) -> LLMResponse:
        model_name = model or settings.OLLAMA_MODEL_FAST
        start = time.monotonic()

        payload: dict[str, Any] = {
            "model": model_name,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": temperature,
                "num_predict": max_tokens,
            },
        }
        if system_prompt:
            payload["system"] = system_prompt

        try:
            response = await self.client.post(
                f"{self.base_url}/api/generate",
                json=payload,
            )
            response.raise_for_status()
            data = response.json()

            latency_ms = int((time.monotonic() - start) * 1000)
            return LLMResponse(
                text=data.get("response", "").strip(),
                model=model_name,
                tokens_used=data.get("eval_count", 0),
                latency_ms=latency_ms,
            )
        except Exception as exc:
            raise LLMError(f"Ollama generation failed ({model_name}): {exc}") from exc

    async def embed(self, text: str, model: str | None = None) -> list[float]:
        model_name = model or settings.OLLAMA_EMBED_MODEL
        try:
            response = await self.client.post(
                f"{self.base_url}/api/embeddings",
                json={"model": model_name, "prompt": text},
            )
            response.raise_for_status()
            return response.json().get("embedding", [])
        except Exception as exc:
            raise LLMError(f"Ollama embedding failed ({model_name}): {exc}") from exc

    async def close(self) -> None:
        await self.client.aclose()
