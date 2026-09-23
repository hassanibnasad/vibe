from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    # â”€â”€ Application â”€â”€
    APP_NAME: str = "VibeAgent"
    APP_ENV: str = "development"
    APP_DEBUG: bool = False
    APP_SECRET_KEY: str = "dev-secret-key-change-in-production-vibeagent"

    # â”€â”€ Database â”€â”€
    DATABASE_URL: str = "postgresql+asyncpg://vibeagent:vibeagent@localhost:5432/vibeagent"
    DATABASE_POOL_SIZE: int = 20
    DATABASE_ECHO: bool = False

    # â”€â”€ Redis â”€â”€
    REDIS_URL: str = "redis://localhost:6379/0"

    # â”€â”€ LiteLLM & AI Gateway â”€â”€
    LITELLM_PROXY_URL: str = ""
    LITELLM_API_KEY: str = ""
    LITELLM_DROP_PARAMS: bool = True

    # Cloud Provider Keys (Optional)
    OPENAI_API_KEY: str = ""
    OPENAI_BASE_URL: str = ""
    NVIDIA_API_KEY: str = ""
    NVIDIA_BASE_URL: str = "https://integrate.api.nvidia.com/v1"
    GROQ_API_KEY: str = ""
    ANTHROPIC_API_KEY: str = ""
    DEEPSEEK_API_KEY: str = ""
    GEMINI_API_KEY: str = ""
    OPENROUTER_API_KEY: str = ""
    TOGETHER_API_KEY: str = ""

    # ── Image Generation ───────────────────────────────────────────────────────
    # Provider: "together" (Flux-Schnell, free tier) | "pollinations" (no key) | "" (disabled)
    IMAGE_GEN_PROVIDER: str = "together"
    # Together AI model for image generation (Flux-Schnell is free on Together's free tier)
    IMAGE_GEN_MODEL: str = "black-forest-labs/FLUX.1-schnell-Free"
    # Default output size; Together Flux supports 1024x1024 max
    IMAGE_GEN_WIDTH: int = 1024
    IMAGE_GEN_HEIGHT: int = 1024
    # Max images per request
    IMAGE_GEN_STEPS: int = 4

    # Legacy / Direct Ollama Settings
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL_PRIMARY: str = "ollama/llama3.1:70b"
    OLLAMA_MODEL_FAST: str = "ollama/llama3.1:8b"
    OLLAMA_EMBED_MODEL: str = "ollama/all-minilm:l6-v2"

    # Unified Model Names — override these in .env to switch providers
    # Defaults to Groq cloud (zero-GPU, free tier, ~500 tok/s)
    LLM_MODEL_PRIMARY: str = "groq/llama-3.3-70b-versatile"
    LLM_MODEL_FAST: str = "groq/llama-3.1-8b-instant"
    LLM_EMBED_MODEL: str = "ollama/all-minilm:l6-v2"  # unused: embedding uses fastembed

    # â”€â”€ Agent Thresholds â”€â”€
    REPLY_CONFIDENCE_THRESHOLD: float = 0.75
    MAX_RETRIES: int = 3

    # â”€â”€ Hatchet Workflow Engine â”€â”€
    HATCHET_CLIENT_TOKEN: str = ""
    HATCHET_HOST: str = ""

    # â”€â”€ Authentik (Auth/IAM) â”€â”€
    AUTHENTIK_BASE_URL: str = ""
    AUTHENTIK_CLIENT_ID: str = ""
    AUTHENTIK_CLIENT_SECRET: str = ""

    # â”€â”€ RustFS Object Storage â”€â”€
    RUSTFS_ENDPOINT: str = ""
    RUSTFS_ACCESS_KEY: str = ""
    RUSTFS_SECRET_KEY: str = ""
    RUSTFS_BUCKET: str = ""

    # â”€â”€ Social Platforms (Optional per platform) â”€â”€
    LINKEDIN_CLIENT_ID: str = ""
    LINKEDIN_CLIENT_SECRET: str = ""
    LINKEDIN_REDIRECT_URI: str = ""
    LINKEDIN_API_VERSION: str = ""
    # Legacy application-level settings. New publications use SocialConnection.
    LINKEDIN_ACCESS_TOKEN: str = ""
    LINKEDIN_ORGANIZATION_ID: str = ""

    # Encrypted social credential storage and browser redirect destination.
    TOKEN_ENCRYPTION_KEY: str = ""
    FRONTEND_BASE_URL: str = "http://localhost:3000"

    # â”€â”€ Webhooks â”€â”€
    WEBHOOK_SECRET: str = "dev-webhook-secret-vibeagent"

    # â”€â”€ Monitoring & Observability â”€â”€
    PROMETHEUS_ENABLED: bool = True
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "json"

    # â”€â”€ Knowledge Ingestion â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    # Maximum approximate tokens per chunk (1 tok â‰ˆ 4 chars).
    # Kept at 400 to leave headroom under MiniLM's 512-token context limit.
    INGESTION_CHUNK_SIZE: int = 400
    # Overlap tokens between sliding-window sub-chunks.
    INGESTION_CHUNK_OVERLAP: int = 50
    # Max concurrent embed calls to the model server per ingestion batch.
    INGESTION_EMBED_CONCURRENCY: int = 10
    # Maximum upload file size in megabytes for the /knowledge/upload endpoint.
    INGESTION_MAX_FILE_SIZE_MB: int = 50

    # â”€â”€ RAG Retrieval â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    # Number of candidates to pull from vector search (Phase 1).
    RAG_TOP_K: int = 20
    # Number of results to return after cross-encoder re-ranking (Phase 2).
    RAG_TOP_N: int = 5
    # Minimum cosine similarity for a candidate to qualify from vector search.
    RAG_SIMILARITY_THRESHOLD: float = 0.3
    # Token budget enforced by ContextAssembler when building the grounding block.
    RAG_MAX_CONTEXT_TOKENS: int = 2000
    # Set to False on latency-sensitive paths (e.g. real-time streaming replies).
    RAG_RERANK_ENABLED: bool = True

    # â”€â”€ Embedding Service â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    # Backend strategy: "fastembed" (in-process ONNX, $0) or "litellm" (external).
    EMBEDDING_BACKEND: str = "fastembed"
    # Model identifier for the FastEmbed backend (ignored when EMBEDDING_BACKEND=litellm).
    EMBEDDING_MODEL: str = "BAAI/bge-large-en-v1.5"
    # Vector dimensionality.  MUST match the Vector(N) column in knowledge_docs.
    EMBEDDING_DIMENSIONS: int = 1024
    # Maximum texts per embed_many() batch sent to the backend.
    EMBEDDING_BATCH_SIZE: int = 32
    # Redis embedding cache: deduplicate embeddings across queries and ingestion.
    EMBEDDING_CACHE_ENABLED: bool = True
    # Embedding cache TTL in seconds (default: 7 days).
    EMBEDDING_CACHE_TTL: int = 604800

    # â”€â”€ Brand Extraction â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    # Vision-capable LLM model for screenshot analysis (empty = skip vision step).
    # Examples: "gemini/gemini-2.0-flash", "openai/gpt-4o", "together_ai/meta-llama/Llama-Vision-Free"
    VISION_LLM_MODEL: str = ""
    # Crawl4AI browser timeout in seconds.
    SCRAPER_TIMEOUT_SECONDS: int = 30
    # Playwright wait condition: "networkidle", "domcontentloaded", or "load".
    SCRAPER_WAIT_UNTIL: str = "networkidle"


@lru_cache
def get_settings() -> Settings:
    st = Settings()
    import os
    # Inject provider keys into os.environ so LiteLLM's native provider detection works
    # for all call sites without per-call plumbing.
    _env_map = {
        "OPENAI_API_KEY": st.OPENAI_API_KEY,
        "OPENAI_API_BASE": st.OPENAI_BASE_URL,
        "OPENAI_BASE_URL": st.OPENAI_BASE_URL,
        "GROQ_API_KEY": st.GROQ_API_KEY,
        "GEMINI_API_KEY": st.GEMINI_API_KEY,
        "DEEPSEEK_API_KEY": st.DEEPSEEK_API_KEY,
        "OPENROUTER_API_KEY": st.OPENROUTER_API_KEY,
        "TOGETHERAI_API_KEY": st.TOGETHER_API_KEY,
        "ANTHROPIC_API_KEY": st.ANTHROPIC_API_KEY,
        "NVIDIA_NIM_API_KEY": st.NVIDIA_API_KEY,
    }
    for key, value in _env_map.items():
        if value and not os.environ.get(key):
            os.environ[key] = value
    return st


settings = get_settings()
