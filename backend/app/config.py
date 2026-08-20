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
    APP_NAME: str = "vibeagent"
    APP_ENV: str
    APP_DEBUG: bool = False
    APP_SECRET_KEY: str

    # ── Database ──
    DATABASE_URL: str
    DATABASE_POOL_SIZE: int = 20

    # ── Redis ──
    REDIS_URL: str

    # ── Ollama LLM ──
    OLLAMA_BASE_URL: str
    OLLAMA_MODEL_PRIMARY: str
    OLLAMA_MODEL_FAST: str
    OLLAMA_EMBED_MODEL: str

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
    WEBHOOK_SECRET: str

    # ── Monitoring & Observability ──
    PROMETHEUS_ENABLED: bool = True
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "json"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
