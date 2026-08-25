import asyncio
import json
import time
from typing import Any, TypeVar

import litellm
from pydantic import BaseModel
import structlog

from app.config import settings
from app.exceptions import LLMError

# Configure LiteLLM global settings
litellm.drop_params = getattr(settings, "LITELLM_DROP_PARAMS", True)
litellm.suppress_debug_info = True

logger = structlog.get_logger()
T = TypeVar("T", bound=BaseModel)


class LLMResponse(BaseModel):
    text: str
    model: str
    tokens_used: int
    latency_ms: int
    cost_usd: float = 0.0
    fallback_used: bool = False


class LLMClient:
    """Enterprise async client for LiteLLM Gateway supporting 100+ LLM providers."""

    def __init__(
        self,
        base_url: str | None = None,
        api_key: str | None = None,
        proxy_url: str | None = None,
    ):
        self.ollama_base_url = (base_url or settings.OLLAMA_BASE_URL).rstrip("/")
        self.proxy_url = proxy_url or settings.LITELLM_PROXY_URL
        self.api_key = api_key or settings.LITELLM_API_KEY or None

    def _resolve_model_name(self, model: str | None) -> str:
        if not model:
            return settings.LLM_MODEL_FAST
        norm = model.lower()
        if norm in ("primary", "70b", "llama-70b", "llama3.1:70b"):
            return settings.LLM_MODEL_PRIMARY
        if norm in ("fast", "8b", "llama-8b", "llama3.1:8b"):
            return settings.LLM_MODEL_FAST
        if norm in ("embed", "embedding"):
            return settings.LLM_EMBED_MODEL
        # If user passes bare model name without provider prefix, default to ollama
        if not ("/" in model):
            return f"ollama/{model}"
        return model

    def _get_api_base(self, model: str) -> str | None:
        if self.proxy_url:
            return self.proxy_url
        if model.startswith("ollama/"):
            return self.ollama_base_url
        return None

    async def generate(
        self,
        prompt: str,
        model: str | None = None,
        temperature: float = 0.7,
        max_tokens: int = 2048,
        system_prompt: str | None = None,
        allow_fallback: bool = True,
        fallbacks: list[str] | None = None,
        response_format: dict[str, Any] | None = None,
    ) -> LLMResponse:
        """Generate text completion via LiteLLM Gateway."""
        target_model = self._resolve_model_name(model)
        start = time.monotonic()

        messages: list[dict[str, str]] = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        # Prepare fallback list
        fallback_models: list[str] = []
        if fallbacks:
            fallback_models = [self._resolve_model_name(fb) for fb in fallbacks]
        elif allow_fallback and target_model != settings.LLM_MODEL_FAST:
            fallback_models = [settings.LLM_MODEL_FAST]

        kwargs: dict[str, Any] = {
            "model": target_model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }

        api_base = self._get_api_base(target_model)
        if api_base:
            kwargs["api_base"] = api_base
        if self.api_key:
            kwargs["api_key"] = self.api_key
        if response_format:
            kwargs["response_format"] = response_format
        if fallback_models:
            kwargs["fallbacks"] = fallback_models

        try:
            response = await litellm.acompletion(**kwargs)
            latency_ms = int((time.monotonic() - start) * 1000)

            choice = response.choices[0]
            output_text = choice.message.content or ""
            actual_model = getattr(response, "model", target_model)
            usage = getattr(response, "usage", None)
            tokens_used = usage.total_tokens if usage else 0
            cost = getattr(response, "_response_cost", 0.0) or 0.0

            fallback_used = (actual_model != target_model)

            return LLMResponse(
                text=output_text.strip(),
                model=actual_model,
                tokens_used=tokens_used,
                latency_ms=latency_ms,
                cost_usd=round(cost, 6),
                fallback_used=fallback_used,
            )
        except Exception as exc:
            logger.error("litellm_completion_failed", model=target_model, error=str(exc))
            raise LLMError(f"LiteLLM completion failed for {target_model}: {exc}") from exc

    async def generate_structured(
        self,
        prompt: str,
        schema: type[T],
        model: str | None = None,
        temperature: float = 0.2,
        system_prompt: str | None = None,
    ) -> tuple[T, LLMResponse]:
        """Generate and parse structured Pydantic response from LiteLLM."""
        response = await self.generate(
            prompt=prompt,
            model=model,
            temperature=temperature,
            system_prompt=system_prompt,
            response_format={"type": "json_object"},
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
            raise LLMError(f"Failed to parse structured response into {schema.__name__}: {exc}") from exc

    async def embed(self, text: str, model: str | None = None) -> list[float]:
        """Generate vector embedding using LiteLLM."""
        target_model = self._resolve_model_name(model or "embed")
        kwargs: dict[str, Any] = {
            "model": target_model,
            "input": [text],
        }

        api_base = self._get_api_base(target_model)
        if api_base:
            kwargs["api_base"] = api_base
        if self.api_key:
            kwargs["api_key"] = self.api_key

        try:
            response = await litellm.aembedding(**kwargs)
            return response.data[0]["embedding"]
        except Exception as exc:
            logger.error("litellm_embedding_failed", model=target_model, error=str(exc))
            raise LLMError(f"LiteLLM embedding failed for {target_model}: {exc}") from exc

    async def close(self) -> None:
        """Cleanup resources if necessary."""
        pass
