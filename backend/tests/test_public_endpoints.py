import pytest
from httpx import AsyncClient


@pytest.mark.anyio
async def test_health_endpoint(client: AsyncClient) -> None:
    response = await client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


@pytest.mark.anyio
async def test_catalog_products_endpoint(client: AsyncClient) -> None:
    response = await client.get("/api/v1/catalog/products")
    assert response.status_code == 200
    assert response.json() == []
