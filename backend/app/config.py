import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

# Base directory for the backend
BASE_DIR = Path(__file__).resolve().parent.parent
ROOT_DIR = BASE_DIR.parent

class Settings(BaseSettings):
    TINYFISH_API_KEY: str = ""
    LLM_PROVIDER: str = "gemini"
    LLM_API_KEY: str = ""
    CACHE_DB_PATH: str = str(BASE_DIR / "cache.db")
    CACHE_TTL_MINUTES: int = 1440
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173"
    USE_CACHE_ONLY: bool = False

    model_config = SettingsConfigDict(
        env_file=(str(ROOT_DIR / ".env"), str(BASE_DIR / ".env")),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]

settings = Settings()
