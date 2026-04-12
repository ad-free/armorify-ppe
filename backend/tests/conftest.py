import sys
from collections.abc import AsyncIterator
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.database import get_db  # noqa: E402
from app.main import app  # noqa: E402
from httpx import ASGITransport, AsyncClient  # noqa: E402


class _ScalarResult:
    def all(self) -> list[object]:
        return []


class _ExecuteResult:
    def scalars(self) -> _ScalarResult:
        return _ScalarResult()

    def scalar_one_or_none(self) -> None:
        return None


class FakeSession:
    async def execute(self, *_args, **_kwargs) -> _ExecuteResult:
        return _ExecuteResult()

    async def get(self, *_args, **_kwargs) -> None:
        return None

    def add(self, *_args, **_kwargs) -> None:
        return None

    async def flush(self) -> None:
        return None

    async def commit(self) -> None:
        return None

    async def refresh(self, *_args, **_kwargs) -> None:
        return None


@pytest.fixture
def anyio_backend() -> str:
    return "asyncio"


@pytest.fixture
async def client() -> AsyncIterator[AsyncClient]:
    async def _override_get_db() -> AsyncIterator[FakeSession]:
        yield FakeSession()

    app.dependency_overrides[get_db] = _override_get_db
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as test_client:
        yield test_client
    app.dependency_overrides.clear()
