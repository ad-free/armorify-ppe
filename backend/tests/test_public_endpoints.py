"""Public consumers use the migrated local PostgreSQL checkout fixture, not stale mocks."""

import pytest
from httpx import ASGITransport, AsyncClient
from test_checkout import checkout_db as checkout_db, checkout_schema as checkout_schema

from app.core.database import get_db
from app.main import app
from app.models.product import Product


@pytest.fixture
async def public_client(checkout_db):
    async def database():
        async with checkout_db.sessions() as session:
            yield session

    previous = dict(app.dependency_overrides)
    app.dependency_overrides[get_db] = database
    try:
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            yield client
    finally:
        app.dependency_overrides.clear()
        app.dependency_overrides.update(previous)


@pytest.mark.anyio
async def test_catalog_pagination_filters_inactive_products(public_client, checkout_db):
    await checkout_db.change(Product, checkout_db.other_id, is_active=False)
    response = await public_client.get(
        "/api/v1/catalog/products",
        params={"skip": 1, "limit": 1, "sort_by": "price_asc"},
    )
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["total"] == 2
    assert data["skip"] == 1 and data["limit"] == 1
    assert {row["id"] for row in data["items"]} <= {
        str(checkout_db.product_id),
        str(checkout_db.variant_product_id),
    }
    assert len(data["items"]) == 1


@pytest.mark.anyio
async def test_health_reports_database_failure_without_internal_details(public_client):
    class UnavailableDatabase:
        async def execute(self, *_args, **_kwargs):
            raise RuntimeError("private connection details")

    async def unavailable():
        yield UnavailableDatabase()

    app.dependency_overrides[get_db] = unavailable
    response = await public_client.get("/health")
    assert response.status_code == 200
    assert response.json()["db"] == "error"
    assert "private" not in response.text


@pytest.mark.anyio
async def test_admin_status_update_cannot_overwrite_authoritative_total(
    public_client, checkout_db
):
    from app.models.user import User, UserRole

    db = checkout_db
    await db.change(User, db.user_id, role=UserRole.ADMIN)
    created = await public_client.post(
        "/api/v1/orders/guest", json=await db.payload(), headers=db.auth()
    )
    assert created.status_code == 201, created.text
    order = created.json()
    attempted = await public_client.put(
        f"/api/v1/admin/orders/{order['id']}",
        json={"total_amount": 1},
        headers=db.auth(),
    )
    assert attempted.status_code == 422, attempted.text
    fetched = await public_client.get(
        f"/api/v1/orders/{order['id']}", headers=db.auth()
    )
    assert fetched.json()["total_amount"] == order["total_amount"]
    assert fetched.json()["items"] == order["items"]
