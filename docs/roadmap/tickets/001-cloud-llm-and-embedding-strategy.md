# 🎫 Ticket #001: Cloud LLM and Embedding Strategy

**Type**: `wayfinder:grilling` (HITL)  
**Part of**: [Wayfinder Map](../MAP.md)  
**Status**: Open (Frontier)  
**Blocked by**: None  

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
