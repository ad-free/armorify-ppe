"""Cancellation uses real PostgreSQL transactions in the disposable checkout target."""

import asyncio
import pytest
from fastapi import Depends
from httpx import ASGITransport, AsyncClient
from sqlalchemy import select, text
from test_checkout import checkout_db as checkout_db, checkout_schema as checkout_schema

from app.core.deps import require_admin
from app.models.order import Order, OrderStatus
from app.models.product import Product, ProductVariant
from app.models.user import User, UserRole
from app.routers.admin.orders import router as admin_router

pytestmark = pytest.mark.anyio


@pytest.mark.parametrize("variant", [False, True])
async def test_cancellation_restores_purchased_stock_and_voids_cod(
    checkout_db, variant
):
    db = checkout_db
    payload = await db.payload(
        [db.line(2, variant=variant), db.line(1, variant=variant)]
    )
    created = await db.client.post("/api/v1/orders/", json=payload, headers=db.auth())
    assert created.status_code == 201, created.text
    order = created.json()
    assert await db.stock(variant=variant) == 7
    await db.change(Order, order["id"], status=OrderStatus.CONFIRMED)
    # Deactivating a catalog selection cannot strand its already-reserved stock.
    await db.change(
        ProductVariant if variant else Product,
        db.variant_id if variant else db.product_id,
        is_active=False,
    )
    cancelled = await db.client.post(
        f"/api/v1/orders/{order['id']}/cancel", headers=db.auth()
    )
    assert cancelled.status_code == 200, cancelled.text
    assert await db.stock(variant=variant) == 10
    assert cancelled.json()["status"] == "cancelled"
    assert cancelled.json()["payment_status"] == "cancelled"
    assert cancelled.json()["fulfillment_status"] == "cancelled"
    assert cancelled.json()["items"] == order["items"]
    if variant:
        async with db.sessions() as session:
            assert (
                await session.scalar(
                    select(Product.stock).where(Product.id == db.variant_product_id)
                )
                == 99
            )


async def test_concurrent_repeated_cancellation_never_restock_twice(checkout_db):
    db = checkout_db
    payload = await db.payload([db.line(3), db.line(2, variant=True)])
    created = await db.client.post("/api/v1/orders/", json=payload, headers=db.auth())
    assert created.status_code == 201, created.text
    order = created.json()
    path = f"/api/v1/orders/{order['id']}/cancel"
    forbidden = await db.client.post(path, headers=db.auth(other=True))
    assert forbidden.status_code == 404
    assert await db.stock() == 7
    assert await db.stock(variant=True) == 8
    responses = await db.race([None, None, None], path=path, headers=db.auth())
    assert [response.status_code for response in responses] == [200, 200, 200]
    assert all(response.json()["id"] == order["id"] for response in responses)
    assert await db.stock() == 10
    assert await db.stock(variant=True) == 10
    # A later purchase makes an accidental second restoration observable.
    next_payload = await db.payload([db.line(2), db.line(1, variant=True)])
    next_order = await db.client.post(
        "/api/v1/orders/", json=next_payload, headers=db.auth()
    )
    assert next_order.status_code == 201, next_order.text
    repeated = await db.client.post(path, headers=db.auth())
    assert repeated.status_code == 200, repeated.text
    assert await db.stock() == 8
    assert await db.stock(variant=True) == 9
    replay = await db.client.post("/api/v1/orders/", json=payload, headers=db.auth())
    assert replay.status_code == 201, replay.text
    assert replay.json()["id"] == order["id"]
    assert replay.json()["status"] == "cancelled"
    assert await db.stock() == 8


@pytest.mark.parametrize(
    "fulfillment", ["processing", "shipped", "delivered", "cancelled", None]
)
async def test_ineligible_fulfillment_cannot_cancel_or_restock(
    checkout_db, fulfillment
):
    db = checkout_db
    created = await db.client.post(
        "/api/v1/orders/", json=await db.payload(), headers=db.auth()
    )
    assert created.status_code == 201, created.text
    order = created.json()
    await db.change(Order, order["id"], fulfillment_status=fulfillment)
    rejected = await db.client.post(
        f"/api/v1/orders/{order['id']}/cancel", headers=db.auth()
    )
    assert rejected.status_code == 409, rejected.text
    assert await db.stock() == 9
    async with db.sessions() as session:
        saved = await session.get(Order, order["id"])
        assert saved.status == OrderStatus.PENDING
        assert saved.fulfillment_status == fulfillment
        assert saved.payment_status == "unpaid"


@pytest.mark.parametrize(
    "change",
    [
        dict(payment_status="paid"),
        dict(payment_status=None),
        dict(status=OrderStatus.SHIPPED),
        dict(idempotency_key=None),
        dict(checkout_payload_hash=None),
    ],
)
async def test_unproven_reservation_or_ineligible_order_cannot_restock(
    checkout_db, change
):
    db = checkout_db
    created = await db.client.post(
        "/api/v1/orders/", json=await db.payload(), headers=db.auth()
    )
    assert created.status_code == 201, created.text
    order = created.json()
    await db.change(Order, order["id"], **change)
    rejected = await db.client.post(
        f"/api/v1/orders/{order['id']}/cancel", headers=db.auth()
    )
    assert rejected.status_code == 409, rejected.text
    assert await db.stock() == 9


async def test_restock_failure_rolls_back_all_inventory_and_order_states(checkout_db):
    db = checkout_db
    created = await db.client.post(
        "/api/v1/orders/",
        json=await db.payload([db.line(2), db.line(3, variant=True)]),
        headers=db.auth(),
    )
    assert created.status_code == 201, created.text
    order = created.json()
    path = f"/api/v1/orders/{order['id']}/cancel"
    async with db.sessions.begin() as session:
        await session.execute(
            text("""
            CREATE FUNCTION checkout_test_reject_restock() RETURNS trigger LANGUAGE plpgsql
            AS $$ BEGIN
                IF NEW.stock > OLD.stock THEN RAISE EXCEPTION 'forced restock failure'; END IF;
                RETURN NEW;
            END; $$
        """)
        )
        await session.execute(
            text("""
            CREATE TRIGGER checkout_test_reject_restock BEFORE UPDATE OF stock ON product_variants
            FOR EACH ROW EXECUTE FUNCTION checkout_test_reject_restock()
        """)
        )
    try:
        async with AsyncClient(
            transport=ASGITransport(app=db.app, raise_app_exceptions=False),
            base_url="http://test",
        ) as client:
            failed = await client.post(path, headers=db.auth())
        assert failed.status_code == 500, failed.text
        assert "forced restock" not in failed.text
        assert await db.stock() == 8
        assert await db.stock(variant=True) == 7
        async with db.sessions() as session:
            saved = await session.get(Order, order["id"])
            assert saved.status == OrderStatus.PENDING
            assert saved.payment_status == "unpaid"
            assert saved.fulfillment_status == "unfulfilled"
    finally:
        async with db.sessions.begin() as session:
            await session.execute(
                text("DROP TRIGGER checkout_test_reject_restock ON product_variants")
            )
            await session.execute(text("DROP FUNCTION checkout_test_reject_restock()"))
    retried = await db.client.post(path, headers=db.auth())
    assert retried.status_code == 200, retried.text
    assert await db.stock() == 10
    assert await db.stock(variant=True) == 10
    repeated = await db.client.post(path, headers=db.auth())
    assert repeated.status_code == 200
    assert await db.stock() == 10
    assert await db.stock(variant=True) == 10


async def test_admin_cancellation_shares_restock_and_cannot_reopen(checkout_db):
    db = checkout_db
    db.app.include_router(
        admin_router, prefix="/api/v1", dependencies=[Depends(require_admin)]
    )
    await db.change(User, db.user_id, role=UserRole.ADMIN)
    # An admin can cancel a guest reservation, without changing its owner.
    created = await db.client.post(
        "/api/v1/orders/guest", json=await db.payload([db.line(2)])
    )
    assert created.status_code == 201, created.text
    order = created.json()
    path = f"/api/v1/admin/orders/{order['id']}"
    cancelled = await db.client.put(
        path, json={"status": "cancelled"}, headers=db.auth()
    )
    assert cancelled.status_code == 200, cancelled.text
    assert cancelled.json()["user_id"] is None
    assert cancelled.json()["payment_status"] == "cancelled"
    assert cancelled.json()["fulfillment_status"] == "cancelled"
    assert await db.stock() == 10
    repeated = await db.client.patch(
        path + "/status", json={"status": "cancelled"}, headers=db.auth()
    )
    assert repeated.status_code == 200, repeated.text
    for method, target in [("PUT", path), ("PATCH", path + "/status")]:
        reopened = await db.client.request(
            method, target, json={"status": "confirmed"}, headers=db.auth()
        )
        assert reopened.status_code == 409, reopened.text
    assert await db.stock() == 10


async def test_admin_shipping_and_customer_cancellation_serialize(checkout_db):
    db = checkout_db
    db.app.include_router(
        admin_router, prefix="/api/v1", dependencies=[Depends(require_admin)]
    )
    await db.change(User, db.user_id, role=UserRole.ADMIN)
    created = await db.client.post(
        "/api/v1/orders/", json=await db.payload([db.line(3)]), headers=db.auth()
    )
    assert created.status_code == 201, created.text
    order = created.json()
    arrived = 0
    release = asyncio.Event()

    async def rendezvous():
        nonlocal arrived
        arrived += 1
        if arrived == 2:
            release.set()
        await asyncio.wait_for(release.wait(), timeout=10)

    db.barrier = rendezvous
    try:
        cancelled, shipped = await asyncio.wait_for(
            asyncio.gather(
                db.client.post(
                    f"/api/v1/orders/{order['id']}/cancel", headers=db.auth()
                ),
                db.client.patch(
                    f"/api/v1/admin/orders/{order['id']}/status",
                    json={"status": "shipped"},
                    headers=db.auth(),
                ),
            ),
            timeout=30,
        )
    finally:
        db.barrier = None
    assert sorted([cancelled.status_code, shipped.status_code]) == [200, 409]
    async with db.sessions() as session:
        saved = await session.get(Order, order["id"])
        if cancelled.status_code == 200:
            assert saved.status == OrderStatus.CANCELLED
            assert saved.payment_status == saved.fulfillment_status == "cancelled"
            assert await db.stock() == 10
        else:
            assert saved.status == OrderStatus.SHIPPED
            assert saved.payment_status == "unpaid"
            assert await db.stock() == 7


async def test_restock_capacity_failure_is_safe_and_atomic(checkout_db):
    db = checkout_db
    created = await db.client.post(
        "/api/v1/orders/", json=await db.payload([db.line(2)]), headers=db.auth()
    )
    assert created.status_code == 201, created.text
    order = created.json()
    await db.change(Product, db.product_id, stock=2_147_483_647)
    rejected = await db.client.post(
        f"/api/v1/orders/{order['id']}/cancel", headers=db.auth()
    )
    assert rejected.status_code == 409, rejected.text
    assert rejected.json()["detail"][0]["type"] == "restock_unavailable"
    assert await db.stock() == 2_147_483_647
    async with db.sessions() as session:
        saved = await session.get(Order, order["id"])
        assert saved.status == OrderStatus.PENDING
        assert saved.payment_status == "unpaid"
        assert saved.fulfillment_status == "unfulfilled"
