"""Application configuration from environment variables."""

from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

_ROOT_ENV = Path(__file__).resolve().parents[3] / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(_ROOT_ENV, ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    database_url: str = "postgresql+asyncpg://edu:edu_secret@localhost:5432/edu_platform"
    redis_url: str = "redis://localhost:6379/0"

    jwt_secret: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    api_gateway_host: str = "0.0.0.0"
    api_gateway_port: int = 8000
    rate_limit_per_minute: int = 60

    rag_engine_url: str = "http://localhost:8001"
    quiz_engine_url: str = "http://localhost:8002"

    credits_enabled: bool = True
    default_org_credits: int = 1000


settings = Settings()

