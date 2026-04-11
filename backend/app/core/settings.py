# app/core/settings.py
import os
from enum import Enum
from pathlib import Path
from typing import Optional

from pydantic import Field
from pydantic_settings import BaseSettings

DEFAULT_ENV_FILE = ".env"
DEV_ENV_FILE = ".dev.env"


class Environment(str, Enum):
    DEVELOPMENT = "development"
    PRODUCTION = "production"

    @classmethod
    def from_str(cls, value: Optional[str]) -> "Environment":
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


class Settings(BaseSettings):
    database_url: str = Field(..., env="DATABASE_URL")
    db_schema: str = Field("armorify", env="DB_SCHEMA")
    app_name: str = Field("Armorify PPE API", env="APP_NAME")
    debug: bool = Field(False, env="DEBUG")
    environment: Environment = Field(Environment.DEVELOPMENT, env="ENVIRONMENT")
    env_file: Optional[str] = Field(None, env="ENV_FILE")

    model_config = {
        "env_prefix": "",
        "str_strip_whitespace": True,
    }


class DevSettings(Settings):
    debug: bool = True
    environment: Environment = Environment.DEVELOPMENT


class ProductionSettings(Settings):
    debug: bool = False
    environment: Environment = Environment.PRODUCTION


def _resolve_env_file() -> Optional[str]:
    explicit_file = os.getenv("ENV_FILE")
    if explicit_file:
        path = Path(explicit_file).expanduser()
        return str(path) if path.exists() else None

    env = Environment.from_str(os.getenv("ENVIRONMENT"))
    if env == Environment.DEVELOPMENT:
        dev_path = Path(DEV_ENV_FILE)
        if dev_path.exists():
            return str(dev_path)

    default_path = Path(DEFAULT_ENV_FILE)
    return str(default_path) if default_path.exists() else None


def get_settings() -> Settings:
    env = Environment.from_str(os.getenv("ENVIRONMENT"))
    env_file = _resolve_env_file()
    if env == Environment.PRODUCTION:
        return ProductionSettings(_env_file=env_file)
    return DevSettings(_env_file=env_file)


settings = get_settings()
