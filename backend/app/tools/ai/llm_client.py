import asyncio
import json
import time
from typing import Any, TypeVar
import httpx
from pydantic import BaseModel
import structlog

from app.config import settings
from app.exceptions import LLMError

logger = structlog.get_logger()
T = TypeVar("T", bound=BaseModel)


class LLMResponse(BaseModel):
    text: str
    model: str
    tokens_used: int
    latency_ms: int
    fallback_used: bool = False


class LLMClient:
    """Async HTTP client for Ollama LLM and embedding inference with automatic model routing and fallback."""

    def __init__(self, base_url: str | None = None, http_client: httpx.AsyncClient | None = None):
        self.base_url = (base_url or settings.OLLAMA_BASE_URL).rstrip("/")
        self.client = http_client or httpx.AsyncClient(timeout=120.0)

    def _resolve_model_name(self, model: str | None) -> str:
        if not model:
            return settings.OLLAMA_MODEL_FAST
        norm = model.lower()
        if norm in ("primary", "70b", "llama-70b", "llama3.1:70b"):
            return settings.OLLAMA_MODEL_PRIMARY
        if norm in ("fast", "8b", "llama-8b", "llama3.1:8b"):
            return settings.OLLAMA_MODEL_FAST
        if norm in ("embed", "embedding"):
            return settings.OLLAMA_EMBED_MODEL
        return model

    async def generate(
        self,
        prompt: str,
        model: str | None = None,
        temperature: float = 0.7,
        max_tokens: int = 2048,
        system_prompt: str | None = None,
        allow_fallback: bool = True,
        max_retries: int = 2,
    ) -> LLMResponse:
        """Generate text completion from Ollama with retries and fallback."""
        target_model = self._resolve_model_name(model)
        start = time.monotonic()

        payload: dict[str, Any] = {
            "model": target_model,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": temperature,
                "num_predict": max_tokens,
            },
        }
        if system_prompt:
            payload["system"] = system_prompt

        last_error: Exception | None = None
        for attempt in range(max_retries + 1):
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
                    model=target_model,
                    tokens_used=data.get("eval_count", 0),
                    latency_ms=latency_ms,
                    fallback_used=False,
                )
            except Exception as exc:
                last_error = exc
                logger.warning(
                    "ollama_request_failed",
                    model=target_model,
                    attempt=attempt + 1,
                    error=str(exc),
                )
                if attempt < max_retries:
                    await asyncio.sleep(0.5 * (2 ** attempt))

        # Fallback to fast model if primary failed and fallback is enabled
        if allow_fallback and target_model == settings.OLLAMA_MODEL_PRIMARY:
            fallback_model = settings.OLLAMA_MODEL_FAST
            logger.warning("triggering_ollama_fallback", from_model=target_model, to_model=fallback_model)
            payload["model"] = fallback_model
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
                    model=fallback_model,
                    tokens_used=data.get("eval_count", 0),
                    latency_ms=latency_ms,
                    fallback_used=True,
                )
            except Exception as fb_exc:
                logger.error("ollama_fallback_also_failed", error=str(fb_exc))
                raise LLMError(f"Ollama generation and fallback failed: {fb_exc}") from fb_exc

        raise LLMError(f"Ollama generation failed ({target_model}): {last_error}") from last_error

    async def generate_structured(
        self,
        prompt: str,
        schema: type[T],
        model: str | None = None,
        temperature: float = 0.2,
        system_prompt: str | None = None,
    ) -> tuple[T, LLMResponse]:
        """Generate and parse structured Pydantic response from LLM."""
        response = await self.generate(
            prompt=prompt,
            model=model,
            temperature=temperature,
            system_prompt=system_prompt,
        )

        raw_text = response.text.strip()
        if raw_text.startswith("```json"):
            raw_text = raw_text[7:]
        if raw_text.startswith("```"):
            raw_text = raw_text[3:]
        if raw_text.endswith("```"):
            raw_text = raw_text[:-3]

        try:
            data = json.loads(raw_text.strip())
            return schema.model_validate(data), response
        except Exception as exc:
            raise LLMError(f"Failed to parse structured LLM response into {schema.__name__}: {exc}") from exc

    async def embed(self, text: str, model: str | None = None) -> list[float]:
        """Generate 384-dimensional vector embedding for text chunk."""
        model_name = self._resolve_model_name(model or "embed")
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
