"""Configuration for Quiz Engine."""

from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

_ROOT_ENV = Path(__file__).resolve().parents[4] / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(_ROOT_ENV, ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    database_url: str = "postgresql+asyncpg://edu:edu_secret@localhost:5432/edu_platform"
    jwt_secret: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"


settings = Settings()
