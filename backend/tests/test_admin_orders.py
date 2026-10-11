"""Admin workflow uses the guarded, migrated disposable PostgreSQL checkout fixture."""

from datetime import datetime, timezone
from uuid import uuid4

import pytest
from app.models.order import Order, OrderEvent, OrderItem, OrderStatus
from app.models.product import Product
from app.models.user import User, UserRole
from app.routers.admin.orders import router
from httpx import ASGITransport, AsyncClient
from sqlalchemy import func, select, text
from sqlalchemy.exc import DBAPIError
from test_checkout import field_error

pytestmark = pytest.mark.anyio
ACTIONS = ("confirm", "process", "ship", "deliver", "pay", "cancel", "tracking", "note")


@pytest.fixture
async def admin_db(checkout_db):
    # Router carries its own authorization, even when mounted independently.
    checkout_db.app.include_router(router, prefix="/api/v1")
    await checkout_db.change(User, checkout_db.user_id, role=UserRole.ADMIN)
    return checkout_db


async def create(db, *, guest=False, items=None):
    response = await db.client.post(
        "/api/v1/orders/guest" if guest else "/api/v1/orders/",
        json=await db.payload(items),
        headers=None if guest else db.auth(),
    )
    assert response.status_code == 201, response.text
    return response.json()


async def detail(db, order):
    response = await db.client.get(f"/api/v1/admin/orders/{order['id']}", headers=db.auth())
    assert response.status_code == 200, response.text
    return response.json()


async def act(db, order, action, version=None, **fields):
    return await db.client.post(
        f"/api/v1/admin/orders/{order['id']}/actions",
        headers=db.auth(),
        json={"action": action, "expected_version": version or order.get("version", 1), **fields},
    )


@pytest.mark.parametrize(
    "status,fulfillment,payment,allowed",
    [
        ("pending", "unfulfilled", "unpaid", {"confirm", "pay", "cancel", "note"}),
        ("pending", "unfulfilled", "paid", {"confirm", "note"}),
        ("confirmed", "unfulfilled", "unpaid", {"process", "pay", "cancel", "note"}),
        ("confirmed", "unfulfilled", "paid", {"process", "note"}),
        ("confirmed", "processing", "unpaid", {"ship", "pay", "note"}),
        ("confirmed", "processing", "paid", {"ship", "note"}),
        ("shipped", "shipped", "unpaid", {"deliver", "pay", "tracking", "note"}),
        ("shipped", "shipped", "paid", {"deliver", "tracking", "note"}),
        ("delivered", "delivered", "unpaid", {"pay", "tracking", "note"}),
        ("delivered", "delivered", "paid", {"tracking", "note"}),
        ("cancelled", "cancelled", "cancelled", {"note"}),
        ("pending", "processing", "unpaid", {"note"}),
        ("confirmed", "shipped", "unpaid", {"note"}),
        ("shipped", "unfulfilled", "unpaid", {"note"}),
        ("delivered", "shipped", "paid", {"note"}),
        ("confirmed", "unfulfilled", None, {"note"}),
    ],
)
async def test_transition_matrix_is_authoritative(admin_db, status, fulfillment, payment, allowed):
    db = admin_db
    for action in ACTIONS:
        order = await create(db)
        await db.change(
            Order, order["id"], status=OrderStatus(status), fulfillment_status=fulfillment, payment_status=payment
        )
        before_stock = await db.stock()
        before = await detail(db, order)
        permitted = {entry["action"] for entry in before["allowed_actions"] if entry["allowed"]}
        assert permitted == allowed
        assert all(entry["reason"] for entry in before["allowed_actions"] if not entry["allowed"])
        fields = {"note": "Operator note"} if action == "note" else {}
        if action == "tracking":
            fields = {"tracking_number": "TRACK-01"}
        response = await act(db, order, action, **fields)
        if action not in allowed:
            field_error(response, 409, "action")
            assert (await detail(db, order)) == before
            assert await db.stock() == before_stock
            continue
        assert response.status_code == 200, response.text
        after = response.json()
        assert after["version"] == 2
        assert after["items"] == order["items"]
        assert after["user_id"] == order["user_id"]
        assert len(after["events"]) == 1
        event = after["events"][0]
        assert event["event_type"] == action and event["actor_id"] == str(db.user_id)
        assert event["previous_state"] == {
            "status": status,
            "payment_status": payment,
            "fulfillment_status": fulfillment,
        }
        assert event["new_state"] == {key: after[key] for key in event["previous_state"]}
        assert set(event["metadata"]) <= {"note", "carrier_name", "tracking_number"}
        assert await db.stock() == before_stock + (1 if action == "cancel" else 0)


async def test_shipment_payment_notes_snapshots_and_customer_separation(admin_db):
    db = admin_db
    order = await create(db, items=[db.line(2, variant=True)])
    original = order.copy()
    await db.change(Product, db.variant_product_id, name="Changed catalog", price=1, is_active=False)
    for action, fields in [
        ("confirm", {}),
        ("process", {}),
        ("ship", {"carrier_name": "  Carrier  ", "tracking_number": " TRACK-1 "}),
        ("tracking", {"tracking_number": "TRACK-2"}),
        ("note", {"note": "Private internal evidence"}),
        ("deliver", {}),
        ("pay", {}),
        ("tracking", {"carrier_name": None, "tracking_number": None}),
    ]:
        response = await act(db, order, action, **fields)
        assert response.status_code == 200, response.text
        order = response.json()
        assert order["items"] == original["items"]
        for field in (
            "user_id",
            "customer_name",
            "address",
            "delivery_note",
            "total_amount",
            "subtotal",
            "discount",
            "shipping",
        ):
            assert order[field] == original[field]
    assert order["version"] == 9
    assert order["status"] == order["fulfillment_status"] == "delivered"
    assert order["payment_status"] == "paid"
    assert order["shipped_at"] and order["delivered_at"]
    assert order["carrier_name"] is None and order["tracking_number"] is None
    assert [event["event_type"] for event in order["events"]] == [
        "confirm",
        "process",
        "ship",
        "tracking",
        "note",
        "deliver",
        "pay",
        "tracking",
    ]
    customer = await db.client.get(f"/api/v1/orders/{order['id']}", headers=db.auth())
    assert customer.status_code == 200
    assert customer.json()["items"] == original["items"]
    assert "events" not in customer.json() and "allowed_actions" not in customer.json()
    assert "Private internal evidence" not in customer.text
    forbidden = await db.client.get(f"/api/v1/orders/{order['id']}", headers=db.auth(other=True))
    assert forbidden.status_code == 404
    cancelled = await db.client.post(f"/api/v1/orders/{order['id']}/cancel", headers=db.auth())
    assert cancelled.status_code == 409
    assert await db.stock(variant=True) == 8


@pytest.mark.parametrize(
    "changes",
    [
        {"idempotency_key": None},
        {"checkout_payload_hash": None},
        {"checkout_payload_hash": "bad"},
        {"address": None},
        {"province": None},
        {"subtotal": None},
        {"discount": None},
        {"shipping": None},
        {"shipping_method": None},
        {"payment_method": None},
        {"payment_method": "card"},
        {"total_amount": 1},
    ],
)
async def test_incomplete_historical_snapshot_visible_but_state_changes_fail_closed(admin_db, changes):
    db = admin_db
    order = await create(db)
    await db.change(Order, order["id"], **changes)
    shown = await detail(db, order)
    assert {entry["action"] for entry in shown["allowed_actions"] if entry["allowed"]} == {"note"}
    for action in ("confirm", "process", "ship", "deliver", "pay", "cancel"):
        field_error(await act(db, order, action), 409, "action")
    assert await db.stock() == 9
    noted = await act(db, order, "note", note="Historical review")
    assert noted.status_code == 200
    assert noted.json()["version"] == 2


@pytest.mark.parametrize("changes", [{"product_name": None}, {"attributes": None}, {"quantity": 0}, {"unit_price": 1}])
async def test_incomplete_line_snapshot_blocks_workflow(admin_db, changes):
    db = admin_db
    order = await create(db)
    await db.change(OrderItem, order["items"][0]["id"], **changes)
    field_error(await act(db, order, "confirm"), 409, "action")
    field_error(await act(db, order, "cancel"), 409, "action")
    assert await db.stock() == 9


async def test_historical_tracking_is_only_safe_for_matching_shipped_state(admin_db):
    db = admin_db
    order = await create(db)
    await db.change(
        Order,
        order["id"],
        idempotency_key=None,
        checkout_payload_hash=None,
        status=OrderStatus.SHIPPED,
        fulfillment_status="shipped",
    )
    response = await act(db, order, "tracking", carrier_name="Manual carrier")
    assert response.status_code == 200, response.text
    assert response.json()["shipped_at"] is None  # No invented historical timestamp.
    field_error(await act(db, response.json(), "deliver"), 409, "action")


@pytest.mark.parametrize(
    "fields,field",
    [
        ({"expected_version": True}, "expected_version"),
        ({"expected_version": "1"}, "expected_version"),
        ({"expected_version": 0}, "expected_version"),
        ({"expected_version": 1.5}, "expected_version"),
        ({"note": " "}, "note"),
        ({"note": "bad\ntext"}, "note"),
        ({"note": "bad\x00text"}, "note"),
        ({"note": "a" * 2001}, "note"),
        ({"carrier_name": "a" * 121}, "carrier_name"),
        ({"tracking_number": "a" * 161}, "tracking_number"),
        ({"tracking_number": "\u202ehidden"}, "tracking_number"),
        ({"total_amount": 0}, "total_amount"),
        ({"status": "delivered"}, "status"),
        ({"user_id": str(uuid4())}, "user_id"),
        ({"metadata": {"secret": "x"}}, "metadata"),
    ],
)
async def test_strict_payload_validation(admin_db, fields, field):
    db = admin_db
    order = await create(db)
    payload = {"action": "ship", "expected_version": 1, **fields}
    response = await db.client.post(f"/api/v1/admin/orders/{order['id']}/actions", json=payload, headers=db.auth())
    field_error(response, 422, field)
    assert (await detail(db, order))["events"] == []
    assert await db.stock() == 9


@pytest.mark.parametrize(
    "payload",
    [
        {"action": "note"},
        {"action": "note", "note": None},
        {"action": "tracking"},
        {"action": "confirm", "carrier_name": "Not applicable"},
    ],
)
async def test_action_specific_required_fields(admin_db, payload):
    order = await create(admin_db)
    response = await admin_db.client.post(
        f"/api/v1/admin/orders/{order['id']}/actions", json={"expected_version": 1, **payload}, headers=admin_db.auth()
    )
    assert response.status_code == 422, response.text


async def test_optimistic_conflict_and_concurrent_note_tracking_mutations(admin_db):
    db = admin_db
    order = await create(db)
    for action in ("confirm", "process", "ship"):
        response = await act(db, order, action)
        assert response.status_code == 200
        order = response.json()
    version = order["version"]
    responses = await db.race(
        [
            {"action": "tracking", "expected_version": version, "tracking_number": "Race"},
            {"action": "note", "expected_version": version, "note": "Race note"},
        ],
        path=f"/api/v1/admin/orders/{order['id']}/actions",
        headers=db.auth(),
    )
    assert sorted(response.status_code for response in responses) == [200, 409]
    stale = next(response for response in responses if response.status_code == 409)
    field_error(stale, 409, "expected_version")
    current = await detail(db, order)
    assert current["version"] == version + 1 and len(current["events"]) == 4
    field_error(await act(db, order, "pay"), 409, "expected_version")
    assert await db.stock() == 9


async def test_concurrent_admin_cancellation_restock_once_and_customer_idempotency(admin_db):
    db = admin_db
    order = await create(db, items=[db.line(3), db.line(2, variant=True)])
    responses = await db.race(
        [{"action": "cancel", "expected_version": 1}] * 3,
        path=f"/api/v1/admin/orders/{order['id']}/actions",
        headers=db.auth(),
    )
    assert sorted(response.status_code for response in responses) == [200, 409, 409]
    assert await db.stock() == await db.stock(variant=True) == 10
    current = await detail(db, order)
    assert current["version"] == 2 and len(current["events"]) == 1
    for _ in range(2):
        repeated = await db.client.post(f"/api/v1/orders/{order['id']}/cancel", headers=db.auth())
        assert repeated.status_code == 200
        assert "events" not in repeated.json()
    assert (await detail(db, order)) == current
    another = await create(db)
    cancelled = await db.client.post(f"/api/v1/orders/{another['id']}/cancel", headers=db.auth())
    assert cancelled.status_code == 200
    evidence = await detail(db, another)
    assert evidence["version"] == 2
    assert evidence["events"][0]["actor_id"] == str(db.user_id)


async def test_audit_failure_rolls_back_cancellation_and_inventory(admin_db):
    db = admin_db
    order = await create(db, guest=True, items=[db.line(2), db.line(3, variant=True)])
    async with db.sessions.begin() as session:
        await session.execute(
            text("""
            CREATE FUNCTION admin_test_reject_event() RETURNS trigger LANGUAGE plpgsql AS $$
            BEGIN RAISE EXCEPTION 'forced audit failure'; END; $$
        """)
        )
        await session.execute(
            text("""
            CREATE TRIGGER admin_test_reject_event BEFORE INSERT ON order_events
            FOR EACH ROW EXECUTE FUNCTION admin_test_reject_event()
        """)
        )
    try:
        async with AsyncClient(
            transport=ASGITransport(app=db.app, raise_app_exceptions=False), base_url="http://test"
        ) as client:
            for action in ("confirm", "cancel", "note"):
                response = await client.post(
                    f"/api/v1/admin/orders/{order['id']}/actions",
                    headers=db.auth(),
                    json={
                        "action": action,
                        "expected_version": 1,
                        **({"note": "Must roll back"} if action == "note" else {}),
                    },
                )
                assert response.status_code == 500
                assert "forced audit failure" not in response.text
                assert await db.stock() == 8 and await db.stock(variant=True) == 7
                current = await detail(db, order)
                assert current["status"] == "pending" and current["version"] == 1 and current["events"] == []
    finally:
        async with db.sessions.begin() as session:
            await session.execute(text("DROP TRIGGER admin_test_reject_event ON order_events"))
            await session.execute(text("DROP FUNCTION admin_test_reject_event()"))
    retried = await act(db, order, "cancel")
    assert retried.status_code == 200
    assert await db.stock() == await db.stock(variant=True) == 10


async def test_guest_replay_never_exposes_internal_events(admin_db):
    db = admin_db
    payload = await db.payload()
    created = await db.client.post("/api/v1/orders/guest", json=payload)
    assert created.status_code == 201
    order = created.json()
    noted = await act(db, order, "note", note="Internal only")
    assert noted.status_code == 200
    replay = await db.client.post("/api/v1/orders/guest", json=payload)
    assert replay.status_code == 201
    assert "events" not in replay.json() and "allowed_actions" not in replay.json()
    assert "Internal only" not in replay.text
    assert replay.json()["items"] == order["items"]
    assert await db.stock() == 9


async def test_events_database_append_only(admin_db):
    db = admin_db
    order = await create(db)
    assert (await act(db, order, "note", note="Immutable")).status_code == 200
    for statement in ("UPDATE order_events SET metadata = '{}'::jsonb", "DELETE FROM order_events"):
        with pytest.raises(DBAPIError):
            async with db.sessions.begin() as session:
                await session.execute(text(statement))
    async with db.sessions() as session:
        assert await session.scalar(select(func.count()).select_from(OrderEvent)) == 1


async def test_admin_authorization_deleted_and_legacy_routes(admin_db):
    db = admin_db
    order = await create(db, guest=True)
    path = f"/api/v1/admin/orders/{order['id']}"
    for method, url, payload in [
        ("GET", "/api/v1/admin/orders", None),
        ("GET", path, None),
        ("POST", path + "/actions", {"action": "note", "expected_version": 1, "note": "x"}),
    ]:
        assert (await db.client.request(method, url, json=payload)).status_code == 401
        assert (await db.client.request(method, url, json=payload, headers=db.auth(other=True))).status_code == 403
        await db.change(User, db.other_user_id, role=UserRole.STAFF)
        assert (await db.client.request(method, url, json=payload, headers=db.auth(other=True))).status_code == 403
        await db.change(User, db.other_user_id, role=UserRole.CUSTOMER)
    assert (await db.client.put(path, json={"status": "delivered"}, headers=db.auth())).status_code == 405
    assert (await db.client.patch(path + "/status", json={"status": "delivered"}, headers=db.auth())).status_code in {
        404,
        405,
    }
    await db.change(Order, order["id"], is_active=False)
    assert (await db.client.get(path, headers=db.auth())).status_code == 404
    assert (await act(db, order, "note", note="x")).status_code == 404
    assert (await db.client.get("/api/v1/admin/orders", headers=db.auth())).json()["total"] == 0


async def test_compact_paginated_search_filters_dates_and_sort(admin_db):
    db = admin_db
    orders = [await create(db, guest=True) for _ in range(3)]
    stamps = [datetime(2026, 1, day, 23, 59, 59, tzinfo=timezone.utc) for day in (1, 2, 3)]
    for index, order in enumerate(orders):
        await db.change(
            Order,
            order["id"],
            order_code=f"TEST-{index}",
            customer_name=f"Buyer {index}",
            contact_phone=f"090000000{index}",
            created_at=stamps[index],
        )
    await db.change(
        Order, orders[1]["id"], status=OrderStatus.CONFIRMED, payment_status="paid", fulfillment_status="processing"
    )
    await db.change(Order, orders[2]["id"], payment_status=None, fulfillment_status=None)
    url = "/api/v1/admin/orders"
    response = await db.client.get(url, params={"page": 2, "page_size": 1, "sort_order": "asc"}, headers=db.auth())
    page = response.json()
    assert response.status_code == 200 and page["total"] == 3 and page["page"] == 2 and page["page_size"] == 1
    assert page["items"][0]["id"] == orders[1]["id"]
    assert set(page["items"][0]) == {
        "id",
        "order_code",
        "customer_name",
        "contact_phone",
        "total_amount",
        "status",
        "payment_status",
        "fulfillment_status",
        "created_at",
    }
    cases = [
        ({"search": "Buyer 1"}, [orders[1]["id"]]),
        ({"search": "0900000002"}, [orders[2]["id"]]),
        ({"search": "TEST-0"}, [orders[0]["id"]]),
        ({"search": "%"}, []),
        ({"status": "confirmed", "payment_status": "paid", "fulfillment_status": "processing"}, [orders[1]["id"]]),
        ({"payment_status": "unknown", "fulfillment_status": "unknown"}, [orders[2]["id"]]),
        ({"from_date": "2026-01-02", "to_date": "2026-01-02"}, [orders[1]["id"]]),
        ({"sort_by": "order_code", "sort_order": "desc"}, [order["id"] for order in reversed(orders)]),
        ({"page": 100}, []),
    ]
    for params, expected in cases:
        response = await db.client.get(url, params=params, headers=db.auth())
        assert response.status_code == 200, response.text
        assert [item["id"] for item in response.json()["items"]] == expected
    tied = await db.client.get(url, params={"sort_by": "total_amount", "sort_order": "asc"}, headers=db.auth())
    assert [item["id"] for item in tied.json()["items"]] == sorted(order["id"] for order in orders)
    for params in (
        {"sort_by": "customer_name"},
        {"sort_order": "DROP"},
        {"page": 0},
        {"page_size": 101},
        {"status": "unknown"},
        {"from_date": "2026-02-02", "to_date": "2026-01-01"},
    ):
        response = await db.client.get(url, params=params, headers=db.auth())
        assert response.status_code == 422, response.text


async def test_exact_text_limits_and_variant_snapshot_provenance(admin_db):
    db = admin_db
    order = await create(db, items=[db.line(variant=True)])
    item = order["items"][0]
    await db.change(OrderItem, item["id"], sku=None)
    field_error(await act(db, order, "confirm"), 409, "action")
    await db.change(OrderItem, item["id"], sku=item["sku"])
    for action in ("confirm", "process"):
        response = await act(db, order, action)
        assert response.status_code == 200
        order = response.json()
    response = await act(db, order, "ship", carrier_name="C" * 120, tracking_number="T" * 160, note="N" * 2000)
    assert response.status_code == 200, response.text
    shipped = response.json()
    assert len(shipped["carrier_name"]) == 120 and len(shipped["tracking_number"]) == 160
    assert len(shipped["events"][-1]["metadata"]["note"]) == 2000


async def test_concurrent_confirmation_only_appends_once(admin_db):
    db = admin_db
    order = await create(db)
    responses = await db.race(
        [{"action": "confirm", "expected_version": 1}] * 2,
        path=f"/api/v1/admin/orders/{order['id']}/actions",
        headers=db.auth(),
    )
    assert sorted(response.status_code for response in responses) == [200, 409]
    current = await detail(db, order)
    assert current["status"] == "confirmed" and current["version"] == 2
    assert len(current["events"]) == 1 and current["events"][0]["event_type"] == "confirm"
