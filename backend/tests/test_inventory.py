"""Inventory contract regressions using only the guarded, migrated checkout_db.

No opening history is invented. Stock preparation may target draft/inactive
inventory, while checkout uses active owners and cancellation its historical owner.
"""

import asyncio
from uuid import UUID, uuid4

import pytest
from app.core.checkout import cancel_checkout, create_checkout
from app.core.inventory import MAX_STOCK, adjust_inventory
from app.models.inventory import InventoryMovement
from app.models.order import Order, OrderStatus
from app.models.product import Product, ProductVariant
from app.schemas.order import CheckoutCreate
from fastapi import HTTPException
from sqlalchemy import delete, select, text, update
from sqlalchemy.exc import DBAPIError

pytestmark = pytest.mark.anyio


async def movements(db):
    async with db.sessions() as session:
        return list(
            (
                await session.scalars(
                    select(InventoryMovement).order_by(InventoryMovement.created_at, InventoryMovement.id)
                )
            ).all()
        )


async def adjust(db, delta, *, product_id=None, variant_id=None):
    async with db.sessions.begin() as session:
        return await adjust_inventory(
            session,
            product_id or db.product_id,
            variant_id,
            delta,
            "admin_adjustment",
            admin_actor_id=db.user_id,
            reason="Count correction",
        )


async def test_authoritative_stock_has_no_fabricated_opening_history(checkout_db):
    db = checkout_db
    assert await movements(db) == []
    async with db.sessions() as session:
        product = await session.get(Product, db.variant_product_id)
        assert (product.stock, product.has_variants, product.available_stock, product.stock_status) == (
            99,
            True,
            10,
            "in_stock",
        )
    await db.change(ProductVariant, db.variant_id, is_active=False)
    async with db.sessions() as session:
        product = await session.get(Product, db.variant_product_id)
        assert (product.has_variants, product.available_stock) == (False, 99)
    base_line = {"product_id": str(db.variant_product_id), "variant_id": None, "quantity": 1}
    assert (await db.quote([base_line]))["can_checkout"]
    assert not (await db.quote([db.line(variant=True)]))["can_checkout"]
    foreign = dict(db.line(), variant_id=str(db.variant_id))
    assert not (await db.quote([foreign]))["can_checkout"]


async def test_strict_owner_allows_preparing_inactive_inventory(checkout_db):
    db = checkout_db
    for product_id, variant_id in [
        (db.product_id, db.variant_id),
        (db.product_id, uuid4()),
        (db.variant_product_id, None),
    ]:
        with pytest.raises(HTTPException) as error:
            await adjust(db, 1, product_id=product_id, variant_id=variant_id)
        assert error.value.status_code == 409
    await db.change(Product, db.variant_product_id, is_active=False)
    await db.change(ProductVariant, db.variant_id, is_active=False)
    await adjust(db, 2, product_id=db.variant_product_id, variant_id=db.variant_id)
    await adjust(db, 3, product_id=db.variant_product_id)
    assert await db.stock(variant=True) == 12
    async with db.sessions() as session:
        product = await session.get(Product, db.variant_product_id)
        assert (product.stock, product.available_stock, product.version) == (102, 102, 3)
    assert len(await movements(db)) == 2


@pytest.mark.parametrize(
    "delta,status", [(0, 422), (True, 422), (1.5, 422), (MAX_STOCK + 1, 422), (-MAX_STOCK - 2, 422), (-11, 409)]
)
async def test_invalid_delta_never_changes_balance_or_history(checkout_db, delta, status):
    db = checkout_db
    with pytest.raises(HTTPException) as error:
        await adjust(db, delta)
    assert error.value.status_code == status
    assert await db.stock() == 10
    assert await movements(db) == []


async def test_overflow_and_transaction_rollback_preserve_every_balance(checkout_db):
    db = checkout_db
    await db.change(Product, db.product_id, stock=MAX_STOCK)
    with pytest.raises(HTTPException):
        await adjust(db, 1)
    assert await db.stock() == MAX_STOCK
    async with db.sessions() as session:
        await adjust_inventory(
            session, db.other_id, None, 2, "admin_adjustment", admin_actor_id=db.user_id, reason="Count"
        )
        await session.rollback()
    async with db.sessions() as session:
        other = await session.get(Product, db.other_id)
        assert (other.stock, other.version) == (10, 1)
    assert await movements(db) == []


@pytest.mark.parametrize("operation", ["orm_update", "orm_delete", "sql_update", "sql_delete"])
async def test_inventory_history_is_append_only(checkout_db, operation):
    db = checkout_db
    movement = await adjust(db, 1)
    async with db.sessions() as session:
        with pytest.raises(ValueError if operation.startswith("orm") else DBAPIError):
            if operation.startswith("orm"):
                saved = await session.get(InventoryMovement, movement.id)
                if operation == "orm_update":
                    saved.reason = "rewrite"
                else:
                    await session.delete(saved)
                await session.flush()
            elif operation == "sql_update":
                await session.execute(
                    update(InventoryMovement).where(InventoryMovement.id == movement.id).values(reason="rewrite")
                )
            else:
                await session.execute(delete(InventoryMovement).where(InventoryMovement.id == movement.id))
        await session.rollback()
    saved = await movements(db)
    assert len(saved) == 1 and saved[0].reason == "Count correction"


@pytest.mark.parametrize("owner", ["product", "variant", "actor", "order"])
async def test_inventory_history_references_cannot_be_deleted(checkout_db, owner):
    db = checkout_db
    created = await db.client.post("/api/v1/orders/", json=await db.payload([db.line(variant=True)]), headers=db.auth())
    assert created.status_code == 201, created.text
    await adjust(db, 1, product_id=db.variant_product_id, variant_id=db.variant_id)
    table, identity = {
        "product": ("products", db.variant_product_id),
        "variant": ("product_variants", db.variant_id),
        "actor": ("users", db.user_id),
        "order": ("orders", UUID(created.json()["id"])),
    }[owner]
    async with db.sessions() as session:
        with pytest.raises(DBAPIError):
            await session.execute(text(f"DELETE FROM {table} WHERE id = :id"), {"id": identity})
        await session.rollback()
    assert len(await movements(db)) == 2


async def test_checkout_and_cancellation_record_once_and_preserve_snapshot(checkout_db):
    db = checkout_db
    payload = await db.payload([db.line(2, variant=True)])
    created = await db.client.post("/api/v1/orders/", json=payload, headers=db.auth())
    assert created.status_code == 201, created.text
    order = created.json()
    await db.change(ProductVariant, db.variant_id, is_active=False)
    first = await db.client.post(f"/api/v1/orders/{order['id']}/cancel", headers=db.auth())
    second = await db.client.post(f"/api/v1/orders/{order['id']}/cancel", headers=db.auth())
    assert first.status_code == second.status_code == 200
    assert first.json()["items"] == order["items"]
    history = await movements(db)
    assert [(m.source_type, m.quantity_delta, m.resulting_balance) for m in history] == [
        ("checkout", -2, 8),
        ("cancellation", 2, 10),
    ]
    assert all(m.variant_id == db.variant_id and str(m.order_id) == order["id"] for m in history)


async def test_base_cancellation_restores_historical_owner_after_variant_added(checkout_db):
    db = checkout_db
    created = await db.client.post("/api/v1/orders/", json=await db.payload([db.line(2)]), headers=db.auth())
    assert created.status_code == 201, created.text
    async with db.sessions.begin() as session:
        session.add(ProductVariant(product_id=db.product_id, sku="NEW-OPTION", size="L", stock=4))
    cancelled = await db.client.post(f"/api/v1/orders/{created.json()['id']}/cancel", headers=db.auth())
    assert cancelled.status_code == 200, cancelled.text
    assert await db.stock() == 10
    assert (await movements(db))[-1].variant_id is None


async def test_movement_insert_failure_rolls_back_checkout_everywhere(checkout_db):
    db = checkout_db
    payload = await db.payload([db.line(2), db.line(3, variant=True)])
    async with db.sessions.begin() as session:
        await session.execute(
            text("""CREATE FUNCTION reject_test_movement() RETURNS trigger LANGUAGE plpgsql AS $$
            BEGIN RAISE EXCEPTION 'forced movement failure'; END; $$""")
        )
        await session.execute(
            text("""CREATE TRIGGER reject_test_movement BEFORE INSERT ON inventory_movements
            FOR EACH ROW EXECUTE FUNCTION reject_test_movement()""")
        )
    try:
        async with db.sessions() as session:
            with pytest.raises(DBAPIError):
                await create_checkout(session, CheckoutCreate.model_validate(payload), db.user_id)
        assert await db.stock() == await db.stock(variant=True) == 10
        assert await db.order_count() == 0
        assert await movements(db) == []
    finally:
        async with db.sessions.begin() as session:
            await session.execute(text("DROP TRIGGER reject_test_movement ON inventory_movements"))
            await session.execute(text("DROP FUNCTION reject_test_movement()"))


@pytest.mark.parametrize("variant", [False, True])
async def test_concurrent_checkout_cancellation_and_admin_are_atomic(checkout_db, variant):
    db = checkout_db
    product_id = db.variant_product_id if variant else db.product_id
    reserved = await db.client.post(
        "/api/v1/orders/", json=await db.payload([db.line(2, variant=variant)]), headers=db.auth()
    )
    assert reserved.status_code == 201, reserved.text
    order_id = UUID(reserved.json()["id"])
    payload = CheckoutCreate.model_validate(await db.payload([db.line(3, variant=variant)]))
    release = asyncio.Event()
    arrived = 0

    async def run(operation):
        nonlocal arrived
        async with db.sessions() as session:
            arrived += 1
            if arrived == 4:
                release.set()
            await asyncio.wait_for(release.wait(), 10)
            if operation == "checkout":
                return await create_checkout(session, payload, db.user_id)
            if operation == "cancel":
                return await cancel_checkout(session, order_id, db.user_id)
            await adjust_inventory(
                session,
                product_id,
                db.variant_id if variant else None,
                4,
                "admin_adjustment",
                admin_actor_id=db.user_id,
                reason="Delivery",
            )
            await session.commit()

    await asyncio.wait_for(asyncio.gather(run("checkout"), run("cancel"), run("cancel"), run("admin")), 30)
    assert await db.stock(variant=variant) == 11
    history = await movements(db)
    assert len(history) == 4
    assert sum(m.quantity_delta for m in history) == 1
    assert [m.resulting_balance for m in history] == [
        10 + sum(m.quantity_delta for m in history[: i + 1]) for i in range(len(history))
    ]
    async with db.sessions() as session:
        assert (await session.get(Order, order_id)).status == OrderStatus.CANCELLED
        assert (await session.get(Product, product_id)).version == 5


async def test_concurrent_multi_product_checkout_reversed_lines_uses_ordered_locks(checkout_db):
    db = checkout_db
    first = [db.line(2), db.line(2, variant=True)]
    responses = await db.race([await db.payload(first), await db.payload(list(reversed(first)))])
    assert [r.status_code for r in responses] == [201, 201]
    assert await db.stock() == await db.stock(variant=True) == 6
    assert len(await movements(db)) == 4


async def test_database_rejects_mismatched_movement_owner(checkout_db):
    db = checkout_db
    async with db.sessions() as session:
        session.add(
            InventoryMovement(
                product_id=db.product_id,
                variant_id=db.variant_id,
                quantity_delta=1,
                resulting_balance=11,
                source_type="admin_adjustment",
                admin_actor_id=db.user_id,
                reason="Wrong owner",
            )
        )
        with pytest.raises(DBAPIError):
            await session.flush()
        await session.rollback()
    assert await movements(db) == []


async def test_movement_failure_rolls_back_cancellation_and_order_audit(checkout_db):
    db = checkout_db
    created = await db.client.post("/api/v1/orders/", json=await db.payload([db.line(2)]), headers=db.auth())
    assert created.status_code == 201, created.text
    order_id = UUID(created.json()["id"])
    async with db.sessions.begin() as session:
        await session.execute(
            text("""CREATE FUNCTION reject_test_cancellation_movement() RETURNS trigger LANGUAGE plpgsql AS $$
            BEGIN
                IF NEW.source_type = 'cancellation' THEN RAISE EXCEPTION 'forced cancellation failure'; END IF;
                RETURN NEW;
            END; $$""")
        )
        await session.execute(
            text("""CREATE TRIGGER reject_test_cancellation_movement BEFORE INSERT ON inventory_movements
            FOR EACH ROW EXECUTE FUNCTION reject_test_cancellation_movement()""")
        )
    try:
        async with db.sessions() as session:
            with pytest.raises(DBAPIError):
                await cancel_checkout(session, order_id, db.user_id)
        assert await db.stock() == 8
        history = await movements(db)
        assert len(history) == 1 and history[0].source_type == "checkout"
        async with db.sessions() as session:
            order = await session.get(Order, order_id)
            assert order.status == OrderStatus.PENDING and order.payment_status == "unpaid"
            assert (
                await session.scalar(text("SELECT count(*) FROM order_events WHERE order_id = :id"), {"id": order_id})
                == 0
            )
    finally:
        async with db.sessions.begin() as session:
            await session.execute(text("DROP TRIGGER reject_test_cancellation_movement ON inventory_movements"))
            await session.execute(text("DROP FUNCTION reject_test_cancellation_movement()"))


async def test_concurrent_admin_withdrawal_and_checkout_cannot_oversell(checkout_db):
    db = checkout_db
    await db.change(Product, db.product_id, stock=3)
    payload = CheckoutCreate.model_validate(await db.payload([db.line(3)]))
    release = asyncio.Event()
    arrived = 0

    async def run(checkout):
        nonlocal arrived
        async with db.sessions() as session:
            arrived += 1
            if arrived == 2:
                release.set()
            await asyncio.wait_for(release.wait(), 10)
            try:
                if checkout:
                    await create_checkout(session, payload, db.user_id)
                else:
                    await adjust_inventory(
                        session,
                        db.product_id,
                        None,
                        -3,
                        "admin_adjustment",
                        admin_actor_id=db.user_id,
                        reason="Count loss",
                    )
                    await session.commit()
                return 201
            except HTTPException as error:
                await session.rollback()
                return error.status_code

    results = await asyncio.wait_for(asyncio.gather(run(True), run(False)), 30)
    assert sorted(results) == [201, 409]
    assert await db.stock() == 0
    history = await movements(db)
    assert len(history) == 1 and history[0].quantity_delta == -3 and history[0].resulting_balance == 0


async def test_inactive_variant_keeps_balance_but_has_no_sellable_stock(checkout_db):
    db = checkout_db
    await db.change(ProductVariant, db.variant_id, is_active=False)
    async with db.sessions() as session:
        variant = await session.get(ProductVariant, db.variant_id)
        assert variant.stock == 10
        assert variant.available_stock == 0
        assert variant.stock_status == "out_of_stock"
