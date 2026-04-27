from fastapi import APIRouter, Depends
from sqlalchemy import select, func, and_
from datetime import datetime, timedelta
from decimal import Decimal

from app.core.database import DbSession
from app.models.order import Order, OrderItem, OrderStatus
from app.models.user import User
from app.models.product import Product
from app.schemas.dashboard import DashboardData, DashboardStats, RevenueChartPoint
from app.core.deps import require_admin
from sqlalchemy.orm import selectinload

router = APIRouter(prefix="/admin/dashboard", tags=["admin-dashboard"], dependencies=[Depends(require_admin)])

@router.get("/", response_model=DashboardData)
async def get_dashboard_data(db: DbSession):
    # 1. Stats
    # Total Revenue
    revenue_res = await db.execute(
        select(func.sum(Order.total_amount)).where(Order.status != OrderStatus.CANCELLED)
    )
    total_revenue = revenue_res.scalar() or Decimal(0)

    # Total Orders
    orders_count_res = await db.execute(select(func.count(Order.id)))
    total_orders = orders_count_res.scalar() or 0

    # Total Users
    users_count_res = await db.execute(select(func.count(User.id)))
    total_users = users_count_res.scalar() or 0

    # Low Stock (less than 10)
    low_stock_res = await db.execute(
        select(func.count(Product.id)).where(Product.stock < 10)
    )
    low_stock_count = low_stock_res.scalar() or 0

    # Growth (Simple mock for now, could be calculated by comparing with last month)
    revenue_growth = 12.5
    order_growth = 5.2

    stats = DashboardStats(
        total_revenue=total_revenue,
        total_orders=total_orders,
        total_users=total_users,
        low_stock_count=low_stock_count,
        revenue_growth=revenue_growth,
        order_growth=order_growth
    )

    # 2. Revenue Chart (Last 30 days)
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    chart_res = await db.execute(
        select(
            func.date(Order.created_at).label("date"),
            func.sum(Order.total_amount).label("revenue"),
            func.count(Order.id).label("orders")
        )
        .where(and_(Order.created_at >= thirty_days_ago, Order.status != OrderStatus.CANCELLED))
        .group_by(func.date(Order.created_at))
        .order_by(func.date(Order.created_at))
    )
    
    chart_points = [
        RevenueChartPoint(date=r.date, revenue=r.revenue or 0, orders=r.orders or 0)
        for r in chart_res.all()
    ]

    # 3. Recent Orders
    recent_orders_res = await db.execute(
        select(Order)
        .options(selectinload(Order.items).selectinload(OrderItem.product))
        .order_by(Order.created_at.desc())
        .limit(10)
    )
    recent_orders = recent_orders_res.scalars().all()

    return DashboardData(
        stats=stats,
        revenue_chart=chart_points,
        recent_orders=recent_orders
    )
