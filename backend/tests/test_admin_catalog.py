"""Admin catalog regressions use the guarded migrated checkout_db, never production."""

import asyncio
from decimal import Decimal
from uuid import uuid4

import pytest
from app.models.brand import Brand
from app.models.cart import Cart, CartItem
from app.models.product import Category, Product, ProductVariant
from app.models.product_image import ProductImage
from app.models.user import User, UserRole
from app.routers.admin.brands import router as brands_router
from app.routers.admin.catalog import router as catalog_router
from app.routers.public.catalog import router as public_router
from sqlalchemy import select

pytestmark = pytest.mark.anyio
BASE = "/api/v1/admin/catalog"


@pytest.fixture
async def catalog_db(checkout_db):
    checkout_db.app.include_router(catalog_router, prefix="/api/v1")
    checkout_db.app.include_router(brands_router, prefix="/api/v1")
    checkout_db.app.include_router(public_router, prefix="/api/v1")
    await checkout_db.change(User, checkout_db.user_id, role=UserRole.STAFF)
    return checkout_db


async def product_body(db, **values):
    async with db.sessions() as session:
        category = await session.scalar(select(Product.category_id).where(Product.id == db.product_id))
    return {
        "name": "Catalog test",
        "slug": "catalog-" + uuid4().hex,
        "category_id": str(category),
        "price": "100.00",
        **values,
    }


async def detail(db, identity=None):
    response = await db.client.get(f"{BASE}/products/{identity or db.product_id}", headers=db.auth())
    assert response.status_code == 200, response.text
    return response.json()


async def put(db, values, identity=None):
    current = await detail(db, identity)
    return await db.client.put(
        f"{BASE}/products/{identity or db.product_id}",
        json={"expected_version": current["version"], **values},
        headers=db.auth(),
    )


async def test_staff_boundary_and_public_separation(catalog_db):
    db = catalog_db
    assert (await db.client.get(f"{BASE}/products")).status_code == 401
    assert (await db.client.get(f"{BASE}/products", headers=db.auth(other=True))).status_code == 403
    admin = await detail(db)
    assert {"version", "variants", "images", "recent_movements"} <= admin.keys()
    public = await db.client.get(f"/api/v1/catalog/products/{db.product_id}")
    assert public.status_code == 200, public.text
    assert not {"version", "recent_movements", "admin_actor_id"} & public.json().keys()
    variants = await db.client.get(f"/api/v1/catalog/products/{db.variant_product_id}/variants")
    assert variants.status_code == 200, variants.text
    assert all("cart_count" not in row for row in variants.json())
    assert (await db.client.delete(f"{BASE}/products/{db.product_id}", headers=db.auth())).status_code == 405


@pytest.mark.parametrize(
    "values",
    [
        {"stock": 5},
        {"version": 9},
        {"price": "NaN"},
        {"price": "Infinity"},
        {"price": "0"},
        {"price": "10000000000"},
        {"price": "1.001"},
        {"dealer_price": "-1"},
        {"compare_at_price": "50"},
        {"slug": "Not valid"},
        {"name": "   "},
        {"category_id": None},
        {"video_url": "javascript:alert(1)"},
        {"video_url": "https://user:pass@example.com/x"},
        {"video_url": "https://example.com:99999"},
        {"cover_image_url": "/static/product-images/../x.png"},
        {"specifications": {"  ": "x"}},
        {"specifications": {"key": []}},
        {"specifications": {"key": " "}},
        {"specifications": {"A": "1", " a ": "2"}},
        {"specifications": {str(i): "x" for i in range(33)}},
        {"specifications": {"x": 10**200}},
        {"seo_title": "x" * 161},
    ],
)
async def test_creation_rejects_unsafe_metadata(catalog_db, values):
    response = await catalog_db.client.post(
        f"{BASE}/products", json=await product_body(catalog_db, **values), headers=catalog_db.auth()
    )
    assert response.status_code == 422, response.text


async def test_metadata_roundtrip_stock_protection_and_versions(catalog_db):
    db = catalog_db
    body = await product_body(
        db,
        dealer_price="75.50",
        compare_at_price="125.00",
        description="Description",
        is_featured=True,
        is_new=True,
        specifications={" Finish ": " Matte "},
        video_url="https://example.com/video",
        seo_title="Catalog title",
        seo_description="Catalog description",
    )
    response = await db.client.post(f"{BASE}/products", json=body, headers=db.auth())
    assert response.status_code == 201, response.text
    created = response.json()
    assert created["stock"] == created["available_stock"] == 0
    assert created["version"] == 1 and created["stock_status"] == "out_of_stock"
    assert created["specifications"] == {"Finish": "Matte"}
    duplicate = await db.client.post(f"{BASE}/products", json=body, headers=db.auth())
    assert duplicate.status_code == 409 and duplicate.json()["detail"][0]["loc"] == ["body", "slug"]
    for field in ("stock", "available_stock", "version"):
        assert (await put(db, {field: 1})).status_code == 422
    for field in ("price", "category_id", "name", "is_active", "is_featured"):
        assert (await put(db, {field: None})).status_code == 422
    updated = await put(
        db, {"dealer_price": None, "video_url": None, "specifications": {}, "is_featured": False}, created["id"]
    )
    assert updated.status_code == 200, updated.text
    assert updated.json()["version"] == 2 and updated.json()["dealer_price"] is None
    stale = await db.client.put(
        f"{BASE}/products/{created['id']}", json={"expected_version": 1, "name": "Stale"}, headers=db.auth()
    )
    assert stale.status_code == 409 and stale.json()["detail"][0]["type"] == "stale_version"
    unchanged = await detail(db, created["id"])
    assert unchanged["name"] == body["name"]


async def test_product_update_concurrency(catalog_db):
    db = catalog_db
    current = await detail(db)
    responses = await asyncio.gather(
        *(
            db.client.put(
                f"{BASE}/products/{db.product_id}",
                json={"expected_version": current["version"], "name": name},
                headers=db.auth(),
            )
            for name in ("First", "Second")
        )
    )
    assert sorted(response.status_code for response in responses) == [200, 409]
    assert (await detail(db))["version"] == current["version"] + 1


async def test_product_filters_pagination_sort(catalog_db):
    db = catalog_db
    await db.change(Product, db.other_id, is_active=False, is_new=True, is_featured=True, stock=3)
    async with db.sessions.begin() as session:
        brand = Brand(name="Filter brand", slug="filter-brand")
        session.add(brand)
        await session.flush()
        product = await session.get(Product, db.other_id)
        product.brand_id = brand.id
        brand_id = str(brand.id)
        category_id = str(product.category_id)
    cases = [
        ({"is_active": "false"}, [db.other_id]),
        ({"is_new": "true"}, [db.other_id]),
        ({"is_featured": "true"}, [db.other_id]),
        ({"variant_mode": "with"}, [db.variant_product_id]),
        ({"variant_mode": "without", "low_stock": "true"}, [db.other_id]),
        ({"brand_id": brand_id}, [db.other_id]),
        ({"q": "  goggles  "}, [db.other_id]),
        ({"q": "%"}, []),
    ]
    for params, expected in cases:
        response = await db.client.get(f"{BASE}/products", params=params, headers=db.auth())
        assert response.status_code == 200, response.text
        assert response.json()["total"] == len(expected)
        assert {row["id"] for row in response.json()["items"]} == {str(identity) for identity in expected}
    response = await db.client.get(
        f"{BASE}/products",
        params={"category_id": category_id, "sort_by": "price_asc", "skip": 1, "limit": 1},
        headers=db.auth(),
    )
    assert response.json()["total"] == 3 and len(response.json()["items"]) == 1
    assert response.json()["skip"] == response.json()["limit"] == 1
    for sort in ("newest", "name_asc", "name_desc", "price_asc", "price_desc", "stock_asc"):
        response = await db.client.get(f"{BASE}/products", params={"sort_by": sort}, headers=db.auth())
        assert response.status_code == 200, response.text
        rows = response.json()["items"]
        if sort == "stock_asc":
            assert [row["available_stock"] for row in rows] == [3, 10, 10]
    for params in ({"sort_by": "price;drop"}, {"variant_mode": "maybe"}, {"limit": 0}, {"skip": -1}):
        assert (await db.client.get(f"{BASE}/products", params=params, headers=db.auth())).status_code == 422


async def test_active_reference_integrity_and_deactivation(catalog_db):
    db = catalog_db
    async with db.sessions.begin() as session:
        category = Category(name="Inactive category", slug="inactive-category", is_active=False)
        brand = Brand(name="Inactive brand", slug="inactive-brand", is_active=False)
        session.add_all([category, brand])
        await session.flush()
        category_id, brand_id = str(category.id), str(brand.id)
    for values in (
        {"category_id": str(uuid4())},
        {"category_id": category_id},
        {"brand_id": str(uuid4())},
        {"brand_id": brand_id},
    ):
        assert (
            await db.client.post(f"{BASE}/products", json=await product_body(db, **values), headers=db.auth())
        ).status_code == 422
        assert (await put(db, values)).status_code == 422
    draft = await db.client.post(
        f"{BASE}/products",
        json=await product_body(db, category_id=category_id, brand_id=brand_id, is_active=False),
        headers=db.auth(),
    )
    assert draft.status_code == 201, draft.text
    assert (await put(db, {"is_active": True}, draft.json()["id"])).status_code == 422
    async with db.sessions() as session:
        original_category = await session.scalar(select(Product.category_id).where(Product.id == db.product_id))
    assert (await db.client.delete(f"{BASE}/categories/{original_category}", headers=db.auth())).status_code == 409
    assert (
        await db.client.put(f"{BASE}/categories/{original_category}", json={"is_active": False}, headers=db.auth())
    ).status_code == 409
    assert (
        await db.client.put(f"{BASE}/brands/{brand_id}", json={"is_active": True}, headers=db.auth())
    ).status_code == 200
    assert (await put(db, {"brand_id": brand_id})).status_code == 200
    assert (await db.client.delete(f"{BASE}/brands/{brand_id}", headers=db.auth())).status_code == 409
    assert (
        await db.client.put(f"{BASE}/brands/{brand_id}", json={"is_active": False}, headers=db.auth())
    ).status_code == 409


@pytest.mark.parametrize("reference", ["category", "brand"])
async def test_reference_deactivation_races_product_activation(catalog_db, reference):
    db = catalog_db
    async with db.sessions.begin() as session:
        model = Category if reference == "category" else Brand
        row = model(name="Race reference", slug="race-" + uuid4().hex)
        session.add(row)
        await session.flush()
        identity = str(row.id)
    body = await product_body(db, **{f"{reference}_id": identity})
    paths = "categories" if reference == "category" else "brands"
    responses = await asyncio.gather(
        db.client.post(f"{BASE}/products", json=body, headers=db.auth()),
        db.client.put(f"{BASE}/{paths}/{identity}", json={"is_active": False}, headers=db.auth()),
    )
    assert not all(response.status_code < 300 for response in responses), [response.text for response in responses]
    async with db.sessions() as session:
        row = await session.scalar(select(model).where(model.id == identity))
        active = await session.scalar(
            select(Product.id).where(getattr(Product, f"{reference}_id") == row.id, Product.is_active.is_(True))
        )
        assert row.is_active or active is None


async def test_variants_options_sku_inheritance_and_parent_protection(catalog_db):
    db = catalog_db
    base = {"product_id": str(db.product_id), "sku": "TEST-M", "size": "M"}
    missing = await db.client.post(
        f"{BASE}/variants", json={"product_id": str(db.product_id), "sku": "NO-OPTIONS"}, headers=db.auth()
    )
    assert missing.status_code == 422
    for extra in ({"stock": 2}, {"price_override": "1.001"}, {"size": " "}):
        assert (await db.client.post(f"{BASE}/variants", json={**base, **extra}, headers=db.auth())).status_code == 422
    response = await db.client.post(f"{BASE}/variants", json=base, headers=db.auth())
    assert response.status_code == 201, response.text
    variant = response.json()
    assert variant["stock"] == 0 and variant["price_override"] is None
    for body, kind in (
        ({**base, "sku": "test-m", "size": "S", "product_id": str(db.other_id)}, "duplicate_sku"),
        ({**base, "sku": "OTHER", "size": " m "}, "duplicate_options"),
    ):
        result = await db.client.post(f"{BASE}/variants", json=body, headers=db.auth())
        assert result.status_code == 409 and result.json()["detail"][0]["type"] == kind
    for values in (
        {"product_id": str(db.other_id)},
        {"stock": 4},
        {"sku": None},
        {"is_active": None},
        {"size": None, "color": None, "attributes": {}},
    ):
        result = await db.client.put(f"{BASE}/variants/{variant['id']}", json=values, headers=db.auth())
        assert result.status_code == 422, result.text
    result = await db.client.put(
        f"{BASE}/variants/{variant['id']}", json={"price_override": "110.50"}, headers=db.auth()
    )
    assert result.status_code == 200 and Decimal(result.json()["price_override"]) == Decimal("110.50")
    result = await db.client.put(f"{BASE}/variants/{variant['id']}", json={"price_override": None}, headers=db.auth())
    assert result.status_code == 200 and result.json()["price_override"] is None
    normalized = {"product_id": str(db.other_id), "sku": "ATTR-1", "attributes": {" Finish ": " Deep   Blue "}}
    assert (await db.client.post(f"{BASE}/variants", json=normalized, headers=db.auth())).status_code == 201
    normalized.update(sku="ATTR-2", attributes={"finish": "deep blue"})
    assert (await db.client.post(f"{BASE}/variants", json=normalized, headers=db.auth())).status_code == 409


async def test_variant_concurrent_duplicate_creation(catalog_db):
    db = catalog_db
    results = await db.race(
        [
            {"product_id": str(db.product_id), "sku": "FIRST", "size": "S"},
            {"product_id": str(db.product_id), "sku": "SECOND", "size": "s"},
        ],
        path=f"{BASE}/variants",
        headers=db.auth(),
    )
    assert sorted(result.status_code for result in results) == [201, 409]
    results = await db.race(
        [
            {"product_id": str(db.product_id), "sku": "GLOBAL", "size": "L"},
            {"product_id": str(db.other_id), "sku": "global", "size": "L"},
        ],
        path=f"{BASE}/variants",
        headers=db.auth(),
    )
    assert sorted(result.status_code for result in results) == [201, 409]


async def test_cart_impact_confirmation_is_persisted_and_no_snapshot_mutation(catalog_db):
    db = catalog_db
    async with db.sessions.begin() as session:
        cart = Cart(user_id=db.other_user_id)
        session.add(cart)
        await session.flush()
        item = CartItem(
            cart_id=cart.id,
            product_id=db.variant_product_id,
            variant_id=db.variant_id,
            quantity=2,
            unit_price=Decimal("120000"),
        )
        session.add(item)
        await session.flush()
        item_id = item.id
    assert (await detail(db, db.variant_product_id))["variants"][0]["cart_count"] == 1
    for values in ({"size": "XL"}, {"price_override": None}, {"is_active": False}):
        result = await db.client.put(f"{BASE}/variants/{db.variant_id}", json=values, headers=db.auth())
        assert result.status_code == 409 and result.json()["detail"][0]["type"] == "cart_impact"
    result = await db.client.put(
        f"{BASE}/variants/{db.variant_id}", json={"is_active": False, "confirm_cart_impact": True}, headers=db.auth()
    )
    assert result.status_code == 200 and result.json()["is_active"] is False
    async with db.sessions() as session:
        item = await session.get(CartItem, item_id)
        assert item.quantity == 2 and item.unit_price == Decimal("120000") and item.is_active


async def test_managed_image_history_blocks_cover_override(catalog_db):
    db = catalog_db
    assert (await put(db, {"cover_image_url": "https://example.com/legacy.png"})).status_code == 200
    async with db.sessions.begin() as session:
        session.add(
            ProductImage(
                product_id=db.product_id,
                url="/static/product-images/test.png",
                alt_text="Test image",
                position=0,
                is_active=False,
            )
        )
    for cover in (None, "https://example.com/replacement.png"):
        result = await put(db, {"cover_image_url": cover})
        assert result.status_code == 409 and result.json()["detail"][0]["loc"] == ["body", "cover_image_url"]
    result = await put(db, {"seo_title": "No cover override"})
    assert result.status_code == 200
    assert len((await detail(db))["images"]) == 1


async def test_inventory_endpoint_actor_draft_and_detail_history(catalog_db):
    db = catalog_db
    await db.change(Product, db.product_id, is_active=False)
    result = await db.client.post(
        f"{BASE}/products/{db.product_id}/inventory-adjustments",
        json={"quantity_delta": 5, "reason": "Stock preparation"},
        headers=db.auth(),
    )
    assert result.status_code == 201, result.text
    movement = result.json()
    assert movement["admin_actor_id"] == str(db.user_id) and movement["resulting_balance"] == 15
    assert movement["source_type"] == "admin_adjustment" and movement["order_id"] is None
    assert (await detail(db))["recent_movements"][0]["id"] == movement["id"]
    for extra in (
        {"admin_actor_id": str(db.other_user_id)},
        {"quantity_delta": True},
        {"quantity_delta": 1.5},
        {"quantity_delta": 0},
        {"reason": " "},
    ):
        result = await db.client.post(
            f"{BASE}/products/{db.product_id}/inventory-adjustments",
            json={"quantity_delta": 1, "reason": "Test", **extra},
            headers=db.auth(),
        )
        assert result.status_code == 422, result.text
    result = await db.client.post(
        f"{BASE}/products/{db.variant_product_id}/inventory-adjustments",
        json={"quantity_delta": 1, "reason": "Wrong owner"},
        headers=db.auth(),
    )
    assert result.status_code == 409


async def test_category_and_brand_inputs_are_bounded(catalog_db):
    db = catalog_db
    for values in (
        {"slug": "Invalid slug"},
        {"name": " "},
        {"industry_tags": ["x" * 8193]},
        {"industry_tags": {str(i): "x" for i in range(33)}},
    ):
        response = await db.client.post(
            f"{BASE}/categories",
            json={"name": "Category", "slug": "category-" + uuid4().hex, **values},
            headers=db.auth(),
        )
        assert response.status_code == 422, response.text
    for values in (
        {"slug": "Invalid"},
        {"name": " "},
        {"logo_url": "javascript:alert(1)"},
        {"logo_url": "https://user:secret@example.com/logo.png"},
        {"country_of_origin": "x" * 129},
    ):
        response = await db.client.post(
            f"{BASE}/brands/", json={"name": "Brand", "slug": "brand-" + uuid4().hex, **values}, headers=db.auth()
        )
        assert response.status_code == 422, response.text


async def test_inventory_invalidates_metadata_version_and_update_price_relationship(catalog_db):
    db = catalog_db
    current = await detail(db)
    result = await db.client.post(
        f"{BASE}/products/{db.product_id}/inventory-adjustments",
        json={"quantity_delta": 1, "reason": "Received stock"},
        headers=db.auth(),
    )
    assert result.status_code == 201, result.text
    stale = await db.client.put(
        f"{BASE}/products/{db.product_id}",
        json={"expected_version": current["version"], "name": "Stale metadata"},
        headers=db.auth(),
    )
    assert stale.status_code == 409
    assert (await put(db, {"compare_at_price": "125000.00"})).status_code == 200
    invalid = await put(db, {"price": "130000.00"})
    assert invalid.status_code == 422
    assert invalid.json()["detail"][0]["loc"] == ["body", "compare_at_price"]
    assert Decimal((await detail(db))["price"]) == Decimal("100000")


async def test_search_matches_slug_and_only_active_variant_skus(catalog_db):
    db = catalog_db
    await db.change(ProductVariant, db.variant_id, sku="SEARCH-QA-ONLY-SKU")
    await db.change(Product, db.other_id, slug="unique-search-slug")
    for term, identity in [("SEARCH-QA-ONLY", db.variant_product_id), ("unique-search-slug", db.other_id)]:
        response = await db.client.get(f"{BASE}/products", params={"q": term}, headers=db.auth())
        assert response.status_code == 200, response.text
        assert response.json()["total"] == 1
        assert [row["id"] for row in response.json()["items"]] == [str(identity)]
    await db.change(ProductVariant, db.variant_id, is_active=False)
    inactive = await db.client.get(f"{BASE}/products", params={"q": "SEARCH-QA-ONLY"}, headers=db.auth())
    assert inactive.json()["total"] == 0


async def test_inactive_variant_options_cannot_be_duplicated(catalog_db):
    db = catalog_db
    await db.change(ProductVariant, db.variant_id, is_active=False)
    response = await db.client.post(
        f"{BASE}/variants",
        json={
            "product_id": str(db.variant_product_id),
            "sku": "NEW-INACTIVE-OPTION",
            "size": " l ",
            "color": " RED ",
            "attributes": {"material": " NITRILE "},
        },
        headers=db.auth(),
    )
    assert response.status_code == 409, response.text
    assert response.json()["detail"][0]["type"] == "duplicate_options"
