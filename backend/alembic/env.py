from logging.config import fileConfig

from alembic import context  # type: ignore

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# add your model's MetaData object here
# for 'autogenerate' support
# from myapp import mymodel
# target_metadata = mymodel.Base.metadata
import os
import sys
from pathlib import Path

# Add the app directory to the Python path
sys.path.insert(0, str(Path(__file__).parent.parent))

# Import all models to ensure they're registered with SQLAlchemy
from app.models import cms, order, product, quote, user  # noqa: F401
from app.models.base import Base

target_metadata = Base.metadata

# other values from the config, defined by the needs of env.py,
# can be acquired:
# my_important_option = config.get_main_option("my_important_option")
# ... etc.


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine
    and associate a connection with the context.

    """
    # For revision generation, skip online mode
    if not context.is_offline_mode():
        # Import here to avoid issues with async engines
        import asyncio

        from sqlalchemy.ext.asyncio import create_async_engine

        # Get the database URL from environment or config
        url = os.getenv("DATABASE_URL") or config.get_main_option("sqlalchemy.url")

        # Create async engine
        connectable = create_async_engine(url, future=True, echo=False)

        async def do_migrations():
            async with connectable.connect() as connection:
                await connection.run_sync(
                    lambda sync_connection: context.configure(
                        connection=sync_connection, target_metadata=target_metadata
                    )
                )

                def run_migrations(connection):
                    with context.begin_transaction():
                        context.run_migrations()

                await connection.run_sync(run_migrations)

        asyncio.run(do_migrations())
    else:
        run_migrations_offline()


if context.is_offline_mode():
    run_migrations_offline()
else:
    # Only run online migrations when actually applying them, not during revision generation
    if os.getenv("ALEMBIC_RUN_MIGRATIONS") == "1":
        run_migrations_online()
    else:
        # For revision generation, just configure without running
        pass
