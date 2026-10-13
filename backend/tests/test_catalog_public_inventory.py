"""Public inventory uses the same migrated PostgreSQL contract as checkout."""

import pytest
from app.core.database import get_db
from app.main import app
from app.models.product import Product, ProductVariant
from httpx import ASGITransport, AsyncClient

pytestmark = pytest.mark.anyio


@pytest.fixture
async def catalog_public_client(checkout_db):
    async def database():
        async with checkout_db.sessions() as session:
            yield session

    previous = dict(app.dependency_overrides)
    app.dependency_overrides[get_db] = database
    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            yield client
    finally:
        app.dependency_overrides.clear()
        app.dependency_overrides.update(previous)


async def test_public_listing_stock_ignores_base_balance_for_active_variants(catalog_public_client, checkout_db):
    db = checkout_db
    await db.change(Product, db.variant_product_id, stock=999)
    await db.change(ProductVariant, db.variant_id, stock=3)
    response = await catalog_public_client.get("/api/v1/catalog/products")
    assert response.status_code == 200, response.text
    products = {row["id"]: row for row in response.json()["items"]}
    variant_product = products[str(db.variant_product_id)]
    assert variant_product["has_variants"] is True
    assert variant_product["available_stock"] == 3
    assert variant_product["stock_status"] == "low_stock"
    assert products[str(db.product_id)]["has_variants"] is False
    assert products[str(db.product_id)]["available_stock"] == 10
    assert products[str(db.product_id)]["stock_status"] == "in_stock"
    for row in products.values():
        assert {"recent_movements", "reason", "admin_actor_id", "version"}.isdisjoint(row)


async def test_public_stock_transitions_and_historical_cover(catalog_public_client, checkout_db):
    db = checkout_db
    legacy_cover = "https://example.com/old-helmet.png"
    await db.change(Product, db.variant_product_id, stock=17, cover_image_url=legacy_cover)
    await db.change(ProductVariant, db.variant_id, stock=0)
    path = f"/api/v1/catalog/products/{db.variant_product_id}"
    active = await catalog_public_client.get(path)
    assert active.status_code == 200, active.text
    assert active.json()["has_variants"] is True
    assert active.json()["available_stock"] == 0
    assert active.json()["stock_status"] == "out_of_stock"
    assert active.json()["cover_image_url"] == legacy_cover
    await db.change(ProductVariant, db.variant_id, stock=6, is_active=False)
    inactive = await catalog_public_client.get(path)
    assert inactive.status_code == 200, inactive.text
    listing = await catalog_public_client.get("/api/v1/catalog/products")
    assert listing.status_code == 200, listing.text
    listed = next(row for row in listing.json()["items"] if row["id"] == str(db.variant_product_id))
    for product in [inactive.json(), listed]:
        assert product["has_variants"] is True
        assert product["available_stock"] == 0
        assert product["stock_status"] == "out_of_stock"
    images = await catalog_public_client.get(path + "/images")
    assert images.status_code == 200, images.text
    assert images.json() == []
    await db.change(ProductVariant, db.variant_id, is_active=True)
    reactivated = await catalog_public_client.get(path)
    assert reactivated.status_code == 200, reactivated.text
    listing = await catalog_public_client.get("/api/v1/catalog/products")
    assert listing.status_code == 200, listing.text
    listed = next(row for row in listing.json()["items"] if row["id"] == str(db.variant_product_id))
    for product in [reactivated.json(), listed]:
        assert product["has_variants"] is True
        assert product["available_stock"] == 6
        assert product["stock_status"] == "low_stock"
    async with db.sessions() as session:
        product = await session.get(Product, db.variant_product_id)
        variant = await session.get(ProductVariant, db.variant_id)
        assert product.stock == 17
        assert variant.stock == 6


async def test_public_search_matches_slug_and_only_active_variant_sku(catalog_public_client, checkout_db):
    db = checkout_db
    await db.change(Product, db.product_id, slug="searchable-legacy-code")
    await db.change(ProductVariant, db.variant_id, sku="CATALOG-SEARCH-SKU")
    slug = await catalog_public_client.get("/api/v1/catalog/products", params={"q": "searchable-legacy"})
    assert [row["id"] for row in slug.json()["items"]] == [str(db.product_id)]
    sku = await catalog_public_client.get("/api/v1/catalog/products", params={"q": "CATALOG-SEARCH-SKU"})
    assert [row["id"] for row in sku.json()["items"]] == [str(db.variant_product_id)]
    await db.change(ProductVariant, db.variant_id, is_active=False)
    hidden_sku = await catalog_public_client.get("/api/v1/catalog/products", params={"q": "CATALOG-SEARCH-SKU"})
    assert hidden_sku.json()["total"] == 0
