from datetime import datetime, timedelta, timezone
from decimal import Decimal

from fastapi import APIRouter, Depends
from sqlalchemy import and_, func, select
from sqlalchemy.orm import selectinload

from app.core.database import DbSession
from app.core.deps import require_admin
from app.models.order import Order, OrderStatus
from app.models.product import Product
from app.models.user import User
from app.schemas.dashboard import DashboardData, DashboardStats, RevenueChartPoint
from app.schemas.order import OrderRead

router = APIRouter(prefix="/admin/dashboard", tags=["admin-dashboard"], dependencies=[Depends(require_admin)])


@router.get("/", response_model=DashboardData)
async def get_dashboard_data(db: DbSession):
    # 1. Stats
    # Realized revenue: active orders with both delivery states complete and payment recorded.
    realized_revenue = and_(
        Order.is_active.is_(True),
        Order.status == OrderStatus.DELIVERED,
        Order.fulfillment_status == "delivered",
        Order.payment_status == "paid",
    )
    revenue_res = await db.execute(select(func.sum(Order.total_amount)).where(realized_revenue))
    total_revenue = revenue_res.scalar() or Decimal(0)

    # Total Orders
    orders_count_res = await db.execute(select(func.count(Order.id)))
    total_orders = orders_count_res.scalar() or 0

    # Total Users
    users_count_res = await db.execute(select(func.count(User.id)))
    total_users = users_count_res.scalar() or 0

    # Low Stock (less than 10)
    low_stock_res = await db.execute(
        select(func.count(Product.id)).where(Product.available_stock < 10)  # type: ignore[attr-defined]
    )
    low_stock_count = low_stock_res.scalar() or 0

    stats = DashboardStats(
        total_revenue=total_revenue,
        total_orders=total_orders,
        total_users=total_users,
        low_stock_count=low_stock_count,
    )

    # 2. Revenue Chart (Last 30 days)
    thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
    chart_res = await db.execute(
        select(
            func.date(Order.created_at).label("date"),
            func.sum(Order.total_amount).label("revenue"),
            func.count(Order.id).label("orders"),
        )
        .where(and_(Order.created_at >= thirty_days_ago, realized_revenue))
        .group_by(func.date(Order.created_at))
        .order_by(func.date(Order.created_at))
    )

    chart_points = [
        RevenueChartPoint(date=r.date, revenue=Decimal(r.revenue or 0), orders=int(r.orders or 0))
        for r in chart_res.all()
    ]

    # 3. Recent Orders
    recent_orders_res = await db.execute(
        select(Order).options(selectinload(Order.items)).order_by(Order.created_at.desc()).limit(10)
    )
    recent_orders = [OrderRead.model_validate(row) for row in recent_orders_res.scalars().all()]

    return DashboardData(stats=stats, revenue_chart=chart_points, recent_orders=recent_orders)
