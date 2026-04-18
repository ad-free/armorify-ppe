# app/core/settings.py
import os
from enum import Enum
from pathlib import Path

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

    def model_post_init(self, __context: object) -> None:
        missing = [f for f in ("database_url", "secret_key", "jwt_secret_key") if not getattr(self, f)]
        if missing:
            raise ValueError(f"Missing required environment variables: {', '.join(missing).upper()}")


def get_settings() -> Settings:
    return Settings()


settings = get_settings()
