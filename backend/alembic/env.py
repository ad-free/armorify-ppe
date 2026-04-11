import asyncio
import os
import sys
from logging.config import fileConfig
from pathlib import Path

from alembic import context
from sqlalchemy import pool, text
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.settings import settings
from app.models import cms, order, product, quote, user  # noqa: F401
from app.models.base import Base

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata
DEFAULT_SCHEMA = os.getenv("DB_SCHEMA") or settings.db_schema


def run_migrations_offline() -> None:
    url = os.getenv("DATABASE_URL") or config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
        compare_server_default=True,
        include_schemas=True,
        version_table_schema=DEFAULT_SCHEMA,
        default_schema_name=DEFAULT_SCHEMA,
    )
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    # Ensure schema exists before any migration runs
    connection.execute(text(f"CREATE SCHEMA IF NOT EXISTS {DEFAULT_SCHEMA}"))
    connection.execute(text(f"SET search_path TO {DEFAULT_SCHEMA}, public"))

    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        compare_type=True,
        compare_server_default=True,
        include_schemas=True,
        version_table_schema=DEFAULT_SCHEMA,
        default_schema_name=DEFAULT_SCHEMA,
        transaction_per_migration=False,
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    configuration = config.get_section(config.config_ini_section, {})
    # Keep +asyncpg in the URL — async_engine_from_config requires an async driver
    configuration["sqlalchemy.url"] = (
        os.getenv("DATABASE_URL") or settings.database_url
    )

    connectable = async_engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    async def _run_async_migrations() -> None:
        async with connectable.connect() as connection:
            # Commit implicit transaction opened by asyncpg on connect
            # Without this, DDL is rolled back when the connection closes
            await connection.execute(text("COMMIT"))
            await connection.run_sync(do_run_migrations)
        await connectable.dispose()

    asyncio.run(_run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
