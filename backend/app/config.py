from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    # ── Application ──
    APP_NAME: str = "VibeAgent"
    APP_ENV: str = "development"
    APP_DEBUG: bool = False
    APP_SECRET_KEY: str = "dev-secret-key-change-in-production-vibeagent"

    # ── Database ──
    DATABASE_URL: str = "postgresql+asyncpg://vibeagent:vibeagent@localhost:5432/vibeagent"
    DATABASE_POOL_SIZE: int = 20

    # ── Redis ──
    REDIS_URL: str = "redis://localhost:6379/0"

    # ── LiteLLM & AI Gateway ──
    LITELLM_PROXY_URL: str = ""
    LITELLM_API_KEY: str = ""
    LITELLM_DROP_PARAMS: bool = True

    # Cloud Provider Keys (Optional)
    OPENAI_API_KEY: str = ""
    GROQ_API_KEY: str = ""
    ANTHROPIC_API_KEY: str = ""
    DEEPSEEK_API_KEY: str = ""
    GEMINI_API_KEY: str = ""
    OPENROUTER_API_KEY: str = ""
    TOGETHER_API_KEY: str = ""

    # Legacy / Direct Ollama Settings
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL_PRIMARY: str = "ollama/llama3.1:70b"
    OLLAMA_MODEL_FAST: str = "ollama/llama3.1:8b"
    OLLAMA_EMBED_MODEL: str = "ollama/all-minilm:l6-v2"

    # Unified Model Names
    LLM_MODEL_PRIMARY: str = "ollama/llama3.1:70b"
    LLM_MODEL_FAST: str = "ollama/llama3.1:8b"
    LLM_EMBED_MODEL: str = "ollama/all-minilm:l6-v2"

    # ── Agent Thresholds ──
    REPLY_CONFIDENCE_THRESHOLD: float = 0.75
    MAX_RETRIES: int = 3

    # ── Hatchet Workflow Engine ──
    HATCHET_CLIENT_TOKEN: str = ""
    HATCHET_HOST: str = ""

    # ── Authentik (Auth/IAM) ──
    AUTHENTIK_BASE_URL: str = ""
    AUTHENTIK_CLIENT_ID: str = ""
    AUTHENTIK_CLIENT_SECRET: str = ""

    # ── RustFS Object Storage ──
    RUSTFS_ENDPOINT: str = ""
    RUSTFS_ACCESS_KEY: str = ""
    RUSTFS_SECRET_KEY: str = ""
    RUSTFS_BUCKET: str = ""

    # ── Social Platforms (Optional per platform) ──
    LINKEDIN_CLIENT_ID: str = ""
    LINKEDIN_CLIENT_SECRET: str = ""
    LINKEDIN_ACCESS_TOKEN: str = ""
    LINKEDIN_ORGANIZATION_ID: str = ""

    # ── Webhooks ──
    WEBHOOK_SECRET: str = "dev-webhook-secret-vibeagent"

    # ── Monitoring & Observability ──
    PROMETHEUS_ENABLED: bool = True
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "json"

    # ── Knowledge Ingestion ──────────────────────────────────────────────────
    # Maximum approximate tokens per chunk (1 tok ≈ 4 chars).
    # Kept at 400 to leave headroom under MiniLM's 512-token context limit.
    INGESTION_CHUNK_SIZE: int = 400
    # Overlap tokens between sliding-window sub-chunks.
    INGESTION_CHUNK_OVERLAP: int = 50
    # Max concurrent embed calls to the model server per ingestion batch.
    INGESTION_EMBED_CONCURRENCY: int = 10
    # Maximum upload file size in megabytes for the /knowledge/upload endpoint.
    INGESTION_MAX_FILE_SIZE_MB: int = 50

    # ── RAG Retrieval ────────────────────────────────────────────────────────
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



@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
