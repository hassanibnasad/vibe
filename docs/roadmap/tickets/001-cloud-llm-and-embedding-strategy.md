# 🎫 Ticket #001: Cloud LLM and Embedding Strategy

**Type**: `wayfinder:grilling` (HITL)  
**Part of**: [Wayfinder Map](../MAP.md)  
**Status**: ✅ Done  
**Closed by commit**: `dcb4ace`  

---

## Question

How should VibeAgent configure its LiteLLM layer and embedding pipeline to enable high-speed, zero-GPU cloud execution during development while keeping costs near zero and maintaining compatibility with local Ollama?

### Context
- The developer's machine does not have dedicated GPU hardware (24GB+ VRAM) to run local `llama3.1:70b` or SDXL.
- LiteLLM is already integrated in `app/tools/ai/llm_client.py` and `litellm_config.yaml`.
- Need to establish:
  1. Primary fast model (e.g. `groq/llama-3.3-70b-versatile` or `groq/llama-3.1-8b-instant` or `openrouter/meta-llama/llama-3.3-70b-instruct` or Google Gemini Flash).
  2. Embeddings strategy for RAG pgvector cosine search (e.g., `text-embedding-3-small` or fast local CPU MiniLM).
  3. Cheap cloud image generation option (e.g., Together AI / Replicate Flux / Pollinations).
  4. Configuration variables in `.env` and `app/config.py`.

---

## Resolution

Decisions made (user-confirmed):

| Concern | Decision | Rationale |
|---------|----------|-----------|
| Primary LLM | **Groq** `llama-3.3-70b-versatile` | ~500 tok/s, generous free tier, zero GPU |
| Fast/fallback LLM | **Groq** `llama-3.1-8b-instant` | Same provider, lowest latency |
| Secondary alternatives | Gemini Flash, DeepSeek, OpenRouter | Documented in `.env.example` |
| Embeddings | **fastembed** `BAAI/bge-large-en-v1.5` (1024-dim) | $0, in-process ONNX, Windows-compatible via sentence-transformers fallback |
| Image generation | **Together AI** `FLUX.1-schnell-Free` | Free tier, 1024×1024, high quality |
| Image fallback | **Pollinations.ai** (no key needed) | Zero-cost URL-based fallback |

### What was implemented

| Component | File(s) |
|-----------|---------|
| `LLM_MODEL_PRIMARY/FAST` defaulted to Groq | `config.py` |
| `IMAGE_GEN_*` config block | `config.py` |
| All provider API keys injected into `os.environ` at startup | `config.py` `get_settings()` |
| `_CLOUD_PREFIXES` guard in `LLMClient._get_api_base()` | `tools/ai/llm_client.py` |
| `ImageGenerationService` (Together AI + Pollinations) | `services/image_generation_service.py` |
| Updated `litellm_config.yaml` with Groq primary, Gemini/DeepSeek secondary, Ollama local fallback | `litellm_config.yaml` |
| Rewrote `.env.example` with full provider guidance | `.env.example` |
| 14 new tests (image gen: 5, LLM routing: 9) — 136 total green | `tests/test_services/`, `tests/test_tools/` |
