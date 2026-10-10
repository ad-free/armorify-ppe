"""Checkout regressions against migrated PostgreSQL, never the shared FakeSession.

Run with DATABASE_URL pointing to a disposable local database named
armorify_checkout_test_<32 lowercase hex characters>, with pgcrypto enabled.
The original armorify_dev database is explicitly refused. Only generated
checkout_test_* schemas in that disposable database are migrated, seeded, and dropped.
"""

import asyncio
import copy
import os
import re
import subprocess
import sys
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from pathlib import Path
from uuid import UUID, uuid4

import pytest
from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.middleware import SecurityMiddleware
from app.core.security import create_access_token
from app.core.settings import settings
from app.models.flash_sale import FlashSale, FlashSaleItem
from app.models.order import Order, OrderItem
from app.models.product import Category, Product, ProductVariant
from app.models.user import User
from app.routers.protected.orders import router as protected_router
from app.routers.public.orders import router as public_router
from fastapi import Depends, FastAPI
from httpx import ASGITransport, AsyncClient
from sqlalchemy import func, select, text, update
from sqlalchemy.engine import make_url
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

pytestmark = pytest.mark.anyio
SHIPPING = Decimal("25000.00")  # Explicit test value, not a business default.


@pytest.fixture(scope="module")
def checkout_schema():
    url = make_url(settings.database_url)
    if url.host not in {"localhost", "127.0.0.1", "::1"} or not re.fullmatch(
        r"armorify_checkout_test_[a-f0-9]{32}", url.database or ""
    ):
        pytest.fail("Checkout tests require a disposable local armorify_checkout_test_<32hex> database")
    url = url.set(drivername="postgresql+asyncpg")
    schema = "checkout_test_" + uuid4().hex
    assert re.fullmatch(r"checkout_test_[a-f0-9]{32}", schema)
    print(f"PostgreSQL test target: {url.database}/{schema}")

    async def administer(action):
        engine = create_async_engine(url, poolclass=NullPool)
        try:
            async with engine.begin() as connection:
                if action == "create":
                    installed = await connection.scalar(
                        text("SELECT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pgcrypto')")
                    )
                    if not installed:
                        pytest.fail("pgcrypto must already exist; tests will not install extensions")
                    await connection.execute(text(f'CREATE SCHEMA "{schema}"'))
                else:
                    await connection.execute(text(f'DROP SCHEMA IF EXISTS "{schema}" CASCADE'))
        finally:
            await engine.dispose()

    asyncio.run(administer("create"))
    try:
        environment = dict(
            os.environ,
            DB_SCHEMA=schema,
            DATABASE_URL=url.render_as_string(hide_password=False),
            ENVIRONMENT="development",
        )
        subprocess.run(
            [sys.executable, "-m", "alembic", "upgrade", "head"],
            cwd=Path(__file__).resolve().parents[1],
            env=environment,
            check=True,
            capture_output=True,
            text=True,
            timeout=120,
        )
        yield url, schema
    finally:
        asyncio.run(administer("drop"))


@dataclass
class CheckoutDB:
    sessions: object
    product_id: UUID
    other_id: UUID
    variant_product_id: UUID
    variant_id: UUID
    user_id: UUID
    other_user_id: UUID
    client: AsyncClient
    app: FastAPI
    barrier: object = None

    def line(self, quantity=1, *, variant=False):
        return {
            "product_id": str(self.variant_product_id if variant else self.product_id),
            "variant_id": str(self.variant_id) if variant else None,
            "quantity": quantity,
        }

    def auth(self, other=False):
        return {
            "Authorization": "Bearer "
            + create_access_token({"sub": str(self.other_user_id if other else self.user_id)})
        }

    async def quote(self, items=None):
        response = await self.client.post("/api/v1/orders/quote", json={"items": items or [self.line()]})
        assert response.status_code == 200, response.text
        return response.json()

    async def payload(self, items=None):
        items = items or [self.line()]
        quote = await self.quote(items)
        assert quote["can_checkout"], quote
        return {
            "customer_name": "  Nguyễn An  ",
            "contact_phone": " 0901234567 ",
            "email": " buyer@example.com ",
            "province": " Hà Nội ",
            "district": " Ba Đình ",
            "ward": " Kim Mã ",
            "address": " 12 Phố Test ",
            "delivery_note": " Gọi trước khi giao ",
            "shipping_method": "standard",
            "payment_method": "cod",
            "items": items,
            "idempotency_key": str(uuid4()),
            "pricing_token": quote["pricing_token"],
        }

    async def stock(self, variant=False):
        async with self.sessions() as session:
            model = ProductVariant if variant else Product
            identity = self.variant_id if variant else self.product_id
            return await session.scalar(select(model.stock).where(model.id == identity))

    async def order_count(self):
        async with self.sessions() as session:
            return await session.scalar(select(func.count()).select_from(Order))

    async def change(self, model, identity, **values):
        async with self.sessions.begin() as session:
            await session.execute(update(model).where(model.id == identity).values(**values))

    async def race(self, payloads, *, path="/api/v1/orders/guest", headers=None):
        # Both requests must acquire separate real sessions before either can submit.
        arrived = 0
        release = asyncio.Event()

        async def rendezvous():
            nonlocal arrived
            arrived += 1
            if arrived == len(payloads):
                release.set()
            await asyncio.wait_for(release.wait(), timeout=10)

        self.barrier = rendezvous
        try:
            return await asyncio.wait_for(
                asyncio.gather(*(self.client.post(path, json=payload, headers=headers) for payload in payloads)),
                timeout=30,
            )
        finally:
            self.barrier = None


@pytest.fixture
async def checkout_db(checkout_schema, monkeypatch):
    url, schema = checkout_schema
    monkeypatch.setattr(settings, "checkout_shipping_fee", SHIPPING)
    monkeypatch.setattr(settings, "checkout_free_shipping_threshold", None)
    engine = create_async_engine(
        url,
        poolclass=NullPool,
        connect_args={
            "server_settings": {"search_path": f'"{schema}",public'},
            "statement_cache_size": 0,
            "prepared_statement_cache_size": 0,
        },
    )
    sessions = async_sessionmaker(engine, expire_on_commit=False)
    try:
        # Reset only tables found in this fixture's own generated schema.
        async with engine.begin() as connection:
            tables = (
                (
                    await connection.execute(
                        text(
                            "SELECT tablename FROM pg_tables WHERE schemaname = :schema "
                            "AND tablename != 'alembic_version'"
                        ),
                        {"schema": schema},
                    )
                )
                .scalars()
                .all()
            )
            assert tables and all(re.fullmatch(r"[a-z_]+", table) for table in tables)
            await connection.execute(
                text("TRUNCATE " + ", ".join(f'"{schema}"."{table}"' for table in tables) + " CASCADE")
            )
        ids = [uuid4() for _ in range(7)]
        category, product, other, variant_product, variant, user, other_user = ids
        async with sessions.begin() as session:
            session.add(Category(id=category, name="Test PPE", slug="test-ppe"))
            session.add_all(
                [
                    User(id=user, firstname="An", lastname="Test", phone="0901234567"),
                    User(
                        id=other_user,
                        firstname="Bình",
                        lastname="Test",
                        phone="0901234568",
                    ),
                ]
            )
            await session.flush()
            session.add_all(
                [
                    Product(
                        id=product,
                        category_id=category,
                        name="Safety helmet",
                        slug="safety-helmet",
                        price=Decimal("100000"),
                        dealer_price=Decimal("70000"),
                        stock=10,
                    ),
                    Product(
                        id=other,
                        category_id=category,
                        name="Safety goggles",
                        slug="safety-goggles",
                        price=Decimal("50000"),
                        stock=10,
                    ),
                    Product(
                        id=variant_product,
                        category_id=category,
                        name="Safety gloves",
                        slug="safety-gloves",
                        price=Decimal("100000"),
                        stock=99,
                    ),
                ]
            )
            await session.flush()
            session.add(
                ProductVariant(
                    id=variant,
                    product_id=variant_product,
                    sku="GLOVE-L-RED",
                    stock=10,
                    price_override=Decimal("120000"),
                    size="L",
                    color="Red",
                    attributes={"material": "nitrile"},
                )
            )
        app = FastAPI()
        app.add_middleware(SecurityMiddleware)
        app.include_router(public_router, prefix="/api/v1")
        app.include_router(protected_router, prefix="/api/v1", dependencies=[Depends(get_current_user)])
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            db = CheckoutDB(
                sessions,
                product,
                other,
                variant_product,
                variant,
                user,
                other_user,
                client,
                app,
            )

            async def real_db():
                async with sessions() as session:
                    if db.barrier:
                        await db.barrier()
                    yield session

            app.dependency_overrides[get_db] = real_db
            yield db
    finally:
        await engine.dispose()


def money(value):
    return Decimal(str(value))


def field_error(response, status, field):
    assert response.status_code == status, response.text
    errors = response.json()["detail"]
    assert isinstance(errors, list), errors
    assert any(field in error["loc"] for error in errors), errors
    assert all(error.get("msg") and error.get("type") for error in errors)


@pytest.mark.parametrize(
    "field",
    [
        "price",
        "unit_price",
        "total",
        "total_amount",
        "subtotal",
        "discount",
        "shipping",
    ],
)
async def test_client_money_cannot_be_injected(checkout_db, field):
    db = checkout_db
    payload = await db.payload()
    payload[field] = 1
    field_error(await db.client.post("/api/v1/orders/guest", json=payload), 422, field)
    assert await db.stock() == 10
    assert await db.order_count() == 0


async def test_line_price_injection_is_rejected(checkout_db):
    db = checkout_db
    payload = await db.payload()
    payload["items"][0]["unit_price"] = 1
    field_error(await db.client.post("/api/v1/orders/guest", json=payload), 422, "unit_price")
    field_error(
        await db.client.post("/api/v1/orders/quote", json={"items": payload["items"]}),
        422,
        "unit_price",
    )
    assert await db.order_count() == 0


@pytest.mark.parametrize("quantity", [True, "2", 1.5, 0, -1, 2_147_483_648])
async def test_quantities_are_strict_positive_integers(checkout_db, quantity):
    db = checkout_db
    payload = await db.payload()
    payload["items"][0]["quantity"] = quantity
    for path, body in [
        ("/api/v1/orders/quote", {"items": payload["items"]}),
        ("/api/v1/orders/guest", payload),
    ]:
        field_error(await db.client.post(path, json=body), 422, "quantity")
    assert await db.stock() == 10
    assert await db.order_count() == 0


@pytest.mark.parametrize(
    "selection",
    ["foreign_variant", "inactive_product", "inactive_variant", "missing_variant"],
)
async def test_invalid_catalog_selection_never_creates_an_order(checkout_db, selection):
    db = checkout_db
    line = db.line(variant=selection in {"inactive_variant", "missing_variant"})
    payload = await db.payload([line])
    if selection == "foreign_variant":
        line["variant_id"] = str(db.variant_id)
    elif selection == "inactive_product":
        await db.change(Product, db.product_id, is_active=False)
    elif selection == "inactive_variant":
        await db.change(ProductVariant, db.variant_id, is_active=False)
    else:
        line["variant_id"] = None
    payload["items"] = [line]
    quote = await db.quote([line])
    assert quote["can_checkout"] is False
    assert quote["pricing_token"] is None
    assert quote["items"][0]["issue"]
    assert quote["items"][0]["product_name"] is None
    assert quote["items"][0]["unit_price"] is None
    response = await db.client.post("/api/v1/orders/guest", json=payload)
    assert response.status_code in {409, 422}, response.text
    assert await db.order_count() == 0
    assert await db.stock() == 10
    assert await db.stock(variant=True) == 10


async def test_idempotent_retry_precedes_stock_and_repricing(checkout_db):
    db = checkout_db
    payload = await db.payload([db.line(10)])
    first = await db.client.post("/api/v1/orders/guest", json=payload)
    assert first.status_code == 201, first.text
    assert await db.stock() == 0
    await db.change(Product, db.product_id, price=Decimal("200000"), is_active=False)
    second = await db.client.post("/api/v1/orders/guest", json=payload)
    assert second.status_code in {200, 201}, second.text
    assert second.json() == first.json()
    assert await db.stock() == 0
    assert await db.order_count() == 1


async def test_idempotency_key_rejects_changed_payload_and_owner(checkout_db):
    db = checkout_db
    payload = await db.payload()
    first = await db.client.post("/api/v1/orders/guest", json=payload)
    assert first.status_code == 201, first.text
    changed = dict(payload, address="Another address")
    field_error(
        await db.client.post("/api/v1/orders/guest", json=changed),
        409,
        "idempotency_key",
    )
    field_error(
        await db.client.post("/api/v1/orders/", json=payload, headers=db.auth()),
        409,
        "idempotency_key",
    )
    assert await db.stock() == 9
    assert await db.order_count() == 1


@pytest.mark.parametrize("variant", [False, True])
async def test_concurrent_buyers_cannot_oversell(checkout_db, variant):
    db = checkout_db
    model, identity = (ProductVariant, db.variant_id) if variant else (Product, db.product_id)
    await db.change(model, identity, stock=1)
    payload = await db.payload([db.line(variant=variant)])
    other = dict(payload, idempotency_key=str(uuid4()))
    responses = await db.race([payload, other])
    assert sorted(response.status_code for response in responses) == [201, 409], [r.text for r in responses]
    field_error(next(r for r in responses if r.status_code == 409), 409, "quantity")
    assert await db.stock(variant=variant) == 0
    assert await db.order_count() == 1


async def test_concurrent_duplicate_submission_consumes_stock_once(checkout_db):
    db = checkout_db
    payload = await db.payload([db.line(10)])
    responses = await db.race([payload, copy.deepcopy(payload)])
    assert all(r.status_code in {200, 201} for r in responses), [r.text for r in responses]
    assert responses[0].json()["id"] == responses[1].json()["id"]
    assert await db.stock() == 0
    assert await db.order_count() == 1
    async with db.sessions() as session:
        assert await session.scalar(select(func.count()).select_from(OrderItem)) == 1


async def test_duplicate_lines_use_aggregate_stock_and_price(checkout_db):
    db = checkout_db
    quote = await db.quote([db.line(6), db.line(6)])
    assert not quote["can_checkout"]
    assert any(item["issue"] for item in quote["items"])
    payload = await db.payload([db.line(3), db.line(4)])
    assert money((await db.quote(payload["items"]))["total"]) == Decimal("725000")
    response = await db.client.post("/api/v1/orders/guest", json=payload)
    assert response.status_code == 201, response.text
    assert sum(item["quantity"] for item in response.json()["items"]) == 7
    assert money(response.json()["total_amount"]) == Decimal("725000")
    assert await db.stock() == 3


async def add_promotion(
    db,
    *,
    expired=False,
    active=True,
    item_active=True,
    sale_price=None,
    discount_percent=25,
):
    now = datetime.now(timezone.utc)
    sale_id = uuid4()
    async with db.sessions.begin() as session:
        session.add(
            FlashSale(
                id=sale_id,
                name="Test sale",
                start_at=now - timedelta(days=2),
                end_at=now + timedelta(days=-1 if expired else 1),
                is_active=active,
            )
        )
        await session.flush()
        session.add(
            FlashSaleItem(
                flash_sale_id=sale_id,
                product_id=db.variant_product_id,
                discount_percent=discount_percent,
                sale_price=sale_price,
                is_active=item_active,
            )
        )
    return sale_id


@pytest.mark.parametrize(
    "expired,active,item_active,expected",
    [
        (False, True, True, "90000"),
        (True, True, True, "120000"),
        (False, False, True, "120000"),
        (False, True, False, "120000"),
    ],
)
async def test_promotion_dates_and_activity_respect_variant_override(
    checkout_db, expired, active, item_active, expected
):
    db = checkout_db
    await add_promotion(db, expired=expired, active=active, item_active=item_active)
    quote = await db.quote([db.line(2, variant=True)])
    assert money(quote["items"][0]["base_price"]) == Decimal("120000")
    assert money(quote["items"][0]["unit_price"]) == Decimal(expected)
    assert money(quote["subtotal"]) == Decimal("240000")
    assert money(quote["discount"]) == (Decimal("120000") - Decimal(expected)) * 2
    payload = await db.payload([db.line(2, variant=True)])
    response = await db.client.post("/api/v1/orders/guest", json=payload)
    assert response.status_code == 201, response.text
    assert money(response.json()["items"][0]["unit_price"]) == Decimal(expected)
    assert await db.stock(variant=True) == 8


async def test_fixed_promotion_cannot_increase_variant_price(checkout_db):
    db = checkout_db
    await add_promotion(db, sale_price=150000, discount_percent=0)
    quote = await db.quote([db.line(variant=True)])
    assert money(quote["items"][0]["unit_price"]) == Decimal("120000")
    assert money(quote["discount"]) == 0


async def test_expired_promotion_rejects_old_quote_without_stock_change(checkout_db):
    db = checkout_db
    sale_id = await add_promotion(db)
    payload = await db.payload([db.line(variant=True)])
    await db.change(FlashSale, sale_id, end_at=datetime.now(timezone.utc) - timedelta(seconds=1))
    field_error(await db.client.post("/api/v1/orders/guest", json=payload), 409, "pricing_token")
    assert await db.stock(variant=True) == 10
    assert await db.order_count() == 0


async def test_partial_stock_failure_rolls_back_every_line(checkout_db):
    db = checkout_db
    items = [
        db.line(2),
        {"product_id": str(db.other_id), "variant_id": None, "quantity": 2},
    ]
    payload = await db.payload(items)
    await db.change(Product, db.other_id, stock=1)
    response = await db.client.post("/api/v1/orders/guest", json=payload)
    field_error(response, 409, "quantity")
    assert await db.stock() == 10
    async with db.sessions() as session:
        assert await session.scalar(select(Product.stock).where(Product.id == db.other_id)) == 1
        assert await session.scalar(select(func.count()).select_from(OrderItem)) == 0
    assert await db.order_count() == 0
    await db.change(Product, db.other_id, stock=10)
    retry = await db.client.post("/api/v1/orders/guest", json=payload)
    assert retry.status_code == 201, retry.text
    assert await db.stock() == 8


async def test_database_insert_failure_rolls_back_stock_and_idempotency(checkout_db):
    db = checkout_db
    payload = await db.payload([db.line(2)])
    # A real PostgreSQL failure after stock mutation, not a mocked commit.
    async with db.sessions.begin() as session:
        await session.execute(
            text("""
            CREATE FUNCTION checkout_test_reject_item() RETURNS trigger LANGUAGE plpgsql
            AS $$ BEGIN RAISE EXCEPTION 'checkout test forced failure'; END; $$
        """)
        )
        await session.execute(
            text("""
            CREATE TRIGGER checkout_test_reject_item BEFORE INSERT ON order_items
            FOR EACH ROW EXECUTE FUNCTION checkout_test_reject_item()
        """)
        )
    try:
        async with AsyncClient(
            transport=ASGITransport(app=db.app, raise_app_exceptions=False),
            base_url="http://test",
        ) as client:
            failed = await client.post("/api/v1/orders/guest", json=payload)
        assert failed.status_code == 500, failed.text
        assert await db.stock() == 10
        assert await db.order_count() == 0
        async with db.sessions() as session:
            assert await session.scalar(select(func.count()).select_from(OrderItem)) == 0
    finally:
        async with db.sessions.begin() as session:
            await session.execute(text("DROP TRIGGER checkout_test_reject_item ON order_items"))
            await session.execute(text("DROP FUNCTION checkout_test_reject_item()"))
    retry = await db.client.post("/api/v1/orders/guest", json=payload)
    assert retry.status_code == 201, retry.text
    assert await db.stock() == 8
    assert await db.order_count() == 1


@pytest.mark.parametrize(
    "path,authenticated",
    [
        ("/api/v1/orders/guest", False),
        ("/api/v1/orders/guest", True),
        ("/api/v1/orders/", True),
    ],
)
async def test_delivery_snapshots_and_guest_authenticated_parity(checkout_db, path, authenticated):
    db = checkout_db
    payload = await db.payload([db.line(2, variant=True)])
    response = await db.client.post(path, json=payload, headers=db.auth() if authenticated else None)
    assert response.status_code == 201, response.text
    order = response.json()
    for field in [
        "customer_name",
        "contact_phone",
        "email",
        "province",
        "district",
        "ward",
        "address",
        "delivery_note",
    ]:
        assert order[field] == payload[field].strip()
    assert order["user_id"] == (str(db.user_id) if authenticated else None)
    assert order["shipping_method"] == "standard"
    assert order["payment_method"] == "cod"
    assert order["payment_status"] == "unpaid"
    assert order["fulfillment_status"] == "unfulfilled"
    assert money(order["subtotal"]) == Decimal("240000")
    assert money(order["shipping"]) == SHIPPING
    assert money(order["discount"]) == 0
    assert money(order["total_amount"]) == Decimal("265000")
    assert "idempotency_key" not in order
    item = order["items"][0]
    assert item["product_name"] == "Safety gloves"
    assert item["sku"] == "GLOVE-L-RED"
    assert item["attributes"]["material"] == "nitrile"
    assert item["quantity"] == 2
    assert money(item["unit_price"]) == Decimal("120000")
    assert "product" not in item
    await db.change(Product, db.variant_product_id, name="Changed hidden name", is_active=False)
    await db.change(
        ProductVariant,
        db.variant_id,
        sku="CHANGED",
        attributes={"material": "changed"},
        price_override=Decimal("1"),
    )
    retry = await db.client.post(path, json=payload, headers=db.auth() if authenticated else None)
    assert retry.status_code in {200, 201}, retry.text
    assert retry.json() == order
    if authenticated:
        fetched = await db.client.get(f"/api/v1/orders/{order['id']}", headers=db.auth())
        assert fetched.status_code == 200, fetched.text
        assert fetched.json()["items"] == order["items"]
        assert (await db.client.get(f"/api/v1/orders/{order['id']}", headers=db.auth(other=True))).status_code == 404


async def test_authentication_and_immutable_item_routes(checkout_db):
    db = checkout_db
    payload = await db.payload()
    assert (await db.client.post("/api/v1/orders/", json=payload)).status_code == 401
    assert (
        await db.client.post(
            "/api/v1/orders/guest",
            json=payload,
            headers={"Authorization": "Bearer invalid"},
        )
    ).status_code == 401
    response = await db.client.post("/api/v1/orders/", json=payload, headers=db.auth())
    assert response.status_code == 201, response.text
    order = response.json()
    item_id = order["items"][0]["id"]
    for method, path, body in [
        (
            "POST",
            "/api/v1/orders/items",
            {
                "order_id": order["id"],
                "product_id": str(db.product_id),
                "quantity": 99,
                "unit_price": 1,
            },
        ),
        ("PUT", f"/api/v1/orders/items/{item_id}", {"quantity": 99, "unit_price": 1}),
        ("DELETE", f"/api/v1/orders/items/{item_id}", None),
    ]:
        rejected = await db.client.request(method, path, json=body, headers=db.auth())
        assert rejected.status_code in {404, 405, 410}, rejected.text
    fetched = await db.client.get(f"/api/v1/orders/{order['id']}", headers=db.auth())
    assert fetched.status_code == 200, fetched.text
    assert fetched.json()["items"] == order["items"]
    assert await db.stock() == 9
    cancelled = await db.client.post(f"/api/v1/orders/{order['id']}/cancel", headers=db.auth())
    assert cancelled.status_code == 200, cancelled.text
    assert await db.stock() == 10


@pytest.mark.parametrize("change", ["price", "shipping", "quantity"])
async def test_stale_quote_is_field_specific_and_atomic(checkout_db, monkeypatch, change):
    db = checkout_db
    payload = await db.payload()
    if change == "price":
        await db.change(Product, db.product_id, price=Decimal("110000"))
    elif change == "shipping":
        monkeypatch.setattr(settings, "checkout_shipping_fee", Decimal("30000"))
    else:
        payload["items"][0]["quantity"] = 2
    field_error(await db.client.post("/api/v1/orders/guest", json=payload), 409, "pricing_token")
    assert await db.stock() == 10
    assert await db.order_count() == 0


async def test_unconfigured_shipping_blocks_checkout_without_inventing_fee(checkout_db, monkeypatch):
    db = checkout_db
    payload = await db.payload()
    monkeypatch.setattr(settings, "checkout_shipping_fee", None)
    quote = await db.quote()
    assert quote["shipping"] is None
    assert quote["total"] is None
    assert quote["pricing_token"] is None
    assert not quote["can_checkout"]
    assert quote["shipping_message"]
    field_error(
        await db.client.post("/api/v1/orders/guest", json=payload),
        503,
        "shipping_method",
    )
    assert await db.stock() == 10
    assert await db.order_count() == 0


async def test_authenticated_idempotency_cannot_be_replayed_by_another_user(
    checkout_db,
):
    db = checkout_db
    payload = await db.payload()
    first = await db.client.post("/api/v1/orders/", json=payload, headers=db.auth())
    assert first.status_code == 201, first.text
    field_error(
        await db.client.post("/api/v1/orders/", json=payload, headers=db.auth(other=True)),
        409,
        "idempotency_key",
    )
    field_error(
        await db.client.post("/api/v1/orders/guest", json=payload),
        409,
        "idempotency_key",
    )
    assert await db.stock() == 9
    assert await db.order_count() == 1


async def test_duplicate_lines_cannot_bypass_checkout_stock_validation(checkout_db):
    db = checkout_db
    payload = await db.payload([db.line(3), db.line(3)])
    # Each line still fits independently, but the combined quantity no longer does.
    await db.change(Product, db.product_id, stock=5)
    field_error(await db.client.post("/api/v1/orders/guest", json=payload), 409, "quantity")
    assert await db.stock() == 5
    assert await db.order_count() == 0


async def test_nonvariant_snapshot_has_no_fabricated_sku_or_dealer_data(checkout_db):
    db = checkout_db
    response = await db.client.post("/api/v1/orders/guest", json=await db.payload())
    assert response.status_code == 201, response.text
    item = response.json()["items"][0]
    assert item["product_name"] == "Safety helmet"
    assert item["sku"] is None
    assert money(item["unit_price"]) == Decimal("100000")
    assert "product" not in item
    assert "dealer_price" not in item


@pytest.mark.parametrize(
    "field,value",
    [
        ("customer_name", "   "),
        ("contact_phone", "   "),
        ("province", "   "),
        ("district", "   "),
        ("ward", "   "),
        ("address", "   "),
        ("email", "not-an-email"),
        ("shipping_method", "express"),
        ("payment_method", "transfer"),
    ],
)
async def test_delivery_and_payment_validation_is_field_specific(checkout_db, field, value):
    db = checkout_db
    payload = await db.payload()
    payload[field] = value
    field_error(await db.client.post("/api/v1/orders/guest", json=payload), 422, field)
    assert await db.stock() == 10
    assert await db.order_count() == 0


async def test_earliest_expiring_active_promotion_is_authoritative(checkout_db):
    db = checkout_db
    await add_promotion(db)  # 25%, expires first.
    now = datetime.now(timezone.utc)
    later_id = uuid4()
    async with db.sessions.begin() as session:
        session.add(
            FlashSale(
                id=later_id,
                name="Later sale",
                start_at=now - timedelta(days=1),
                end_at=now + timedelta(days=2),
            )
        )
        await session.flush()
        session.add(
            FlashSaleItem(
                flash_sale_id=later_id,
                product_id=db.variant_product_id,
                discount_percent=50,
            )
        )
    quote = await db.quote([db.line(variant=True)])
    assert money(quote["items"][0]["unit_price"]) == Decimal("90000")
    response = await db.client.post("/api/v1/orders/guest", json=await db.payload([db.line(variant=True)]))
    assert response.status_code == 201, response.text
    assert money(response.json()["items"][0]["unit_price"]) == Decimal("90000")


@pytest.mark.parametrize(
    "net,expected_shipping",
    [("499999.99", "30000"), ("500000", "0"), ("500000.01", "0")],
)
async def test_published_shipping_threshold_boundaries(checkout_db, monkeypatch, net, expected_shipping):
    db = checkout_db
    monkeypatch.setattr(settings, "checkout_shipping_fee", Decimal("30000"))
    monkeypatch.setattr(settings, "checkout_free_shipping_threshold", Decimal("500000"))
    await db.change(Product, db.product_id, price=Decimal(net))
    quote = await db.quote()
    assert money(quote["shipping"]) == Decimal(expected_shipping)
    assert money(quote["total"]) == Decimal(net) + Decimal(expected_shipping)
    response = await db.client.post("/api/v1/orders/guest", json=await db.payload())
    assert response.status_code == 201, response.text
    assert money(response.json()["shipping"]) == Decimal(expected_shipping)
    assert money(response.json()["total_amount"]) == Decimal(net) + Decimal(expected_shipping)


async def test_promotion_net_price_controls_free_shipping_eligibility(checkout_db, monkeypatch):
    db = checkout_db
    monkeypatch.setattr(settings, "checkout_shipping_fee", Decimal("30000"))
    monkeypatch.setattr(settings, "checkout_free_shipping_threshold", Decimal("500000"))
    await db.change(ProductVariant, db.variant_id, price_override=Decimal("600000"))
    before = await db.quote([db.line(variant=True)])
    assert money(before["shipping"]) == 0
    await add_promotion(db)  # 600000 less 25% = 450000, below free-shipping threshold.
    quote = await db.quote([db.line(variant=True)])
    assert money(quote["subtotal"]) == Decimal("600000")
    assert money(quote["discount"]) == Decimal("150000")
    assert money(quote["shipping"]) == Decimal("30000")
    assert money(quote["total"]) == Decimal("480000")
    response = await db.client.post("/api/v1/orders/guest", json=await db.payload([db.line(variant=True)]))
    assert response.status_code == 201, response.text
    assert money(response.json()["shipping"]) == Decimal("30000")
    assert money(response.json()["total_amount"]) == Decimal("480000")


async def test_large_quantity_within_stock_and_money_capacity(checkout_db):
    db = checkout_db
    await db.change(Product, db.product_id, price=Decimal("1"), stock=100_001)
    payload = await db.payload([db.line(100_001)])
    created = await db.client.post("/api/v1/orders/", json=payload, headers=db.auth())
    assert created.status_code == 201, created.text
    order = created.json()
    assert order["items"][0]["quantity"] == 100_001
    assert money(order["total_amount"]) == Decimal("125001")
    assert await db.stock() == 0
    cancelled = await db.client.post(f"/api/v1/orders/{order['id']}/cancel", headers=db.auth())
    assert cancelled.status_code == 200, cancelled.text
    assert await db.stock() == 100_001
