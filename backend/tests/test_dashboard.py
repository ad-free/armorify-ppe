"""Dashboard regressions reuse the guarded disposable PostgreSQL checkout fixtures."""

from datetime import datetime, timedelta, timezone
from decimal import Decimal

import pytest
from app.models.order import Order, OrderStatus
from app.models.product import Product
from app.models.user import User, UserRole
from app.routers.admin.dashboard import router as dashboard_router
from sqlalchemy import event

pytestmark = pytest.mark.anyio
DASHBOARD_PATH = "/api/v1/admin/dashboard/"


async def test_dashboard_requires_admin_and_empty_totals_are_real(checkout_db):
    db = checkout_db
    db.app.include_router(dashboard_router, prefix="/api/v1")
    assert (await db.client.get(DASHBOARD_PATH)).status_code == 401
    assert (await db.client.get(DASHBOARD_PATH, headers=db.auth())).status_code == 403
    await db.change(User, db.user_id, role=UserRole.ADMIN)
    response = await db.client.get(DASHBOARD_PATH, headers=db.auth())
    assert response.status_code == 200, response.text
    dashboard = response.json()
    assert dashboard["stats"] == {
        "total_revenue": "0",
        "total_orders": 0,
        "total_users": 2,
        "low_stock_count": 0,
    }
    assert dashboard["revenue_chart"] == []
    assert dashboard["recent_orders"] == []


async def test_dashboard_delivered_paid_active_revenue_and_immutable_recent_snapshots(checkout_db):
    db = checkout_db
    db.app.include_router(dashboard_router, prefix="/api/v1")
    await db.change(User, db.user_id, role=UserRole.ADMIN)
    today = datetime.now(timezone.utc).replace(hour=12, minute=0, second=0, microsecond=0)
    cases = [
        (OrderStatus.DELIVERED, "delivered", "paid", True, today - timedelta(days=1)),
        (OrderStatus.DELIVERED, "delivered", "unpaid", True, today - timedelta(days=1)),
        (OrderStatus.CANCELLED, "delivered", "paid", True, today - timedelta(days=1)),
        (OrderStatus.DELIVERED, "delivered", "paid", False, today - timedelta(days=1)),
        (OrderStatus.PENDING, "unfulfilled", "paid", True, today - timedelta(days=1)),
        (OrderStatus.DELIVERED, "delivered", "paid", True, today - timedelta(days=40)),
        (OrderStatus.SHIPPED, "shipped", "paid", True, today - timedelta(days=2)),
        (OrderStatus.CONFIRMED, "delivered", "paid", True, today - timedelta(days=1)),
        (OrderStatus.DELIVERED, "shipped", "paid", True, today - timedelta(days=1)),
        (OrderStatus.DELIVERED, None, "paid", True, today - timedelta(days=1)),
    ]
    orders = []
    for status, fulfillment, payment, active, created_at in cases:
        response = await db.client.post("/api/v1/orders/guest", json=await db.payload())
        assert response.status_code == 201, response.text
        order = response.json()
        orders.append(order)
        await db.change(
            Order,
            order["id"],
            status=status,
            fulfillment_status=fulfillment,
            payment_status=payment,
            is_active=active,
            created_at=created_at,
        )

    # A catalog edit must not rewrite the purchased name, price, or attributes.
    await db.change(Product, db.product_id, name="Renamed live product", price=Decimal("999999"))
    statements = []
    engine = db.sessions.kw["bind"].sync_engine

    def capture(_connection, _cursor, statement, _parameters, _context, _many):
        statements.append(statement)

    event.listen(engine, "before_cursor_execute", capture)
    try:
        response = await db.client.get(DASHBOARD_PATH, headers=db.auth())
    finally:
        event.remove(engine, "before_cursor_execute", capture)
    assert response.status_code == 200, response.text
    dashboard = response.json()
    amount = Decimal(orders[0]["total_amount"])
    assert Decimal(dashboard["stats"]["total_revenue"]) == amount * 2
    assert dashboard["stats"]["total_orders"] == len(cases)
    assert dashboard["stats"]["total_users"] == 2
    assert dashboard["stats"]["low_stock_count"] == 1
    assert set(dashboard["stats"]) == {"total_revenue", "total_orders", "total_users", "low_stock_count"}
    assert dashboard["revenue_chart"] == [
        {"date": (today - timedelta(days=1)).date().isoformat(), "revenue": str(amount), "orders": 1},
    ]
    recent = {order["id"]: order for order in dashboard["recent_orders"]}
    assert len(recent) == len(cases)
    assert recent[orders[0]["id"]]["status"] == "delivered"
    assert recent[orders[2]["id"]]["status"] == "cancelled"
    for order in orders:
        assert recent[order["id"]]["items"] == order["items"]
        assert "product" not in recent[order["id"]]["items"][0]
    # The stock aggregate may query products, but recent-order loading may not.
    assert not any(
        "from products" in statement.lower() and "count(" not in statement.lower() for statement in statements
    )
