import asyncio
import os
import re
import sys
from logging.config import fileConfig
from pathlib import Path

from alembic import context
from sqlalchemy import pool, text
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import AsyncConnection, async_engine_from_config

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.settings import settings
from app.models import (
    blog,
    brand,
    cart,
    cms,
    flash_sale,
    order,
    product,
    product_image,
    quote,
    review,
    user,
)  # noqa: F401
from app.models.base import Base

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def _safe_schema(name: str) -> str:
    if not re.fullmatch(r"[a-zA-Z_][a-zA-Z0-9_]*", name):
        raise ValueError(f"Invalid DB_SCHEMA value: {name!r}")
    return name


DEFAULT_SCHEMA = _safe_schema(os.getenv("DB_SCHEMA") or settings.db_schema)

_CONFIGURE_KWARGS: dict = {
    "target_metadata": target_metadata,
    "compare_type": True,
    "compare_server_default": True,
    "include_schemas": True,
    "version_table_schema": DEFAULT_SCHEMA,
    "default_schema_name": DEFAULT_SCHEMA,  # autogenerate emits schema= on every op
}


def _normalize_database_url(url: str | None) -> str | None:
    if not url:
        return url
    normalized = url.strip()
    if normalized.startswith("postgres://"):
        return "postgresql+asyncpg://" + normalized[len("postgres://"):]
    if normalized.startswith("postgresql://") and "+" not in normalized.split("://", 1)[1]:
        return "postgresql+asyncpg://" + normalized[len("postgresql://"):]
    return normalized


def run_migrations_offline() -> None:
    url = _normalize_database_url(os.getenv("DATABASE_URL") or config.get_main_option("sqlalchemy.url"))
    context.configure(
        url=url,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        **_CONFIGURE_KWARGS,
    )
    with context.begin_transaction():
        context.run_migrations()


# Pre-built from the validated identifier — no runtime interpolation
_QUOTED = '"' + DEFAULT_SCHEMA + '"'
_SQL_CREATE_SCHEMA = "CREATE SCHEMA IF NOT EXISTS " + _QUOTED


def do_run_migrations(connection: Connection) -> None:
    context.configure(connection=connection, transaction_per_migration=True, **_CONFIGURE_KWARGS)
    with context.begin_transaction():
        context.run_migrations()


async def _ensure_schema(connection: AsyncConnection) -> None:
    """Create the schema in its own autocommit block before alembic takes over."""
    await connection.execute(text("COMMIT"))
    await connection.execute(text(_SQL_CREATE_SCHEMA))
    await connection.execute(text("COMMIT"))


def run_migrations_online() -> None:
    configuration = config.get_section(config.config_ini_section, {})
    configuration["sqlalchemy.url"] = _normalize_database_url(os.getenv("DATABASE_URL") or settings.database_url)

    connectable = async_engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    async def _run_async_migrations() -> None:
        async with connectable.connect() as connection:
            await _ensure_schema(connection)
            await connection.run_sync(do_run_migrations)
        await connectable.dispose()

    asyncio.run(_run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
