# app/core/settings.py
import json
import os
from enum import Enum
from pathlib import Path

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

DEFAULT_ENV_FILE = ".env"
DEV_ENV_FILE = ".dev.env"


class Environment(str, Enum):
    DEVELOPMENT = "development"
    PRODUCTION = "production"

    @classmethod
    def from_str(cls, value: str | None = None) -> "Environment":
        if not value:
            return cls.DEVELOPMENT
        normalized = value.strip().lower()
        alias_map = {
            "development": cls.DEVELOPMENT,
            "dev": cls.DEVELOPMENT,
            "production": cls.PRODUCTION,
            "prod": cls.PRODUCTION,
        }
        return alias_map.get(normalized, cls.DEVELOPMENT)


def _resolve_env_file() -> str | None:
    explicit_file = os.getenv("ENV_FILE")
    if explicit_file:
        path = Path(explicit_file).expanduser()
        return str(path) if path.exists() else None

    env = Environment.from_str(os.getenv("ENVIRONMENT"))
    if env == Environment.DEVELOPMENT:
        dev_path = Path(DEV_ENV_FILE)
        if dev_path.exists():
            return str(dev_path)
        # Also check backend/ dir
        backend_dev_path = Path("backend") / DEV_ENV_FILE
        if backend_dev_path.exists():
            return str(backend_dev_path)

    default_path = Path(DEFAULT_ENV_FILE)
    return str(default_path) if default_path.exists() else None


_ENV_FILE = _resolve_env_file()


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=_ENV_FILE,
        env_file_encoding="utf-8",
        str_strip_whitespace=True,
        extra="ignore",
    )

    database_url: str = ""
    db_schema: str = "armorify"
    app_name: str = "Armorify PPE API"
    debug: bool = False
    environment: Environment = Environment.DEVELOPMENT
    secret_key: str = ""
    jwt_secret_key: str = ""
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7
    admin_username: str = "0971409192"
    admin_phone: str = "0971409192"
    admin_password: str = "admin!!!!"
    allowed_origins: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]

    @staticmethod
    def _normalize_database_url_value(url: str | None) -> str | None:
        if not url:
            return url
        normalized = url.strip()
        if normalized.startswith("postgres://"):
            return "postgresql+asyncpg://" + normalized[len("postgres://") :]
        if normalized.startswith("postgresql://") and "+" not in normalized.split("://", 1)[1]:
            return "postgresql+asyncpg://" + normalized[len("postgresql://") :]
        return normalized

    @field_validator("database_url", mode="before")
    @classmethod
    def _normalize_database_url(cls, v):
        if isinstance(v, str):
            return cls._normalize_database_url_value(v)
        return v

    @field_validator("environment", mode="before")
    @classmethod
    def _normalize_environment(cls, v):
        # Accept None or empty strings and normalize to defaults.
        if v is None:
            return Environment.DEVELOPMENT
        if isinstance(v, str):
            return Environment.from_str(v)
        return v

    @field_validator("allowed_origins", mode="before")
    @classmethod
    def _parse_allowed_origins(cls, v):
        if isinstance(v, list):
            return v
        if isinstance(v, str):
            # Try parsing as JSON array

            try:
                parsed = json.loads(v)
                if isinstance(parsed, list):
                    return parsed
            except json.JSONDecodeError:
                pass
        # Return default if parsing fails
        return ["http://localhost:5173", "http://127.0.0.1:5173"]

    def model_post_init(self, __context: object) -> None:
        # Only enforce presence of critical secrets in production. During
        # development we allow loading from .dev.env or using defaults.
        required = ("database_url", "secret_key", "jwt_secret_key")
        if self.environment == Environment.PRODUCTION:
            missing = [f for f in required if not getattr(self, f)]
            if missing:
                raise ValueError(f"Missing required environment variables for production: {', '.join(missing).upper()}")


def get_settings() -> Settings:
    return Settings()


settings = get_settings()
