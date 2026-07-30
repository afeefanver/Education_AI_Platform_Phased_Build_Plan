"""Application configuration from environment variables."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    database_url: str = "postgresql+asyncpg://edu:edu_secret@localhost:5432/edu_platform"
    redis_url: str = "redis://localhost:6379/0"

    jwt_secret: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    api_gateway_host: str = "0.0.0.0"
    api_gateway_port: int = 8000
    rate_limit_per_minute: int = 60

    credits_enabled: bool = True
    default_org_credits: int = 1000


settings = Settings()
