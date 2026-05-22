from datetime import date
from decimal import Decimal

from pydantic import BaseModel

from .order import OrderRead


class DashboardStats(BaseModel):
    total_revenue: Decimal
    total_orders: int
    total_users: int
    low_stock_count: int
    revenue_growth: float  # Percentage
    order_growth: float  # Percentage


class RevenueChartPoint(BaseModel):
    date: date
    revenue: Decimal
    orders: int


class DashboardData(BaseModel):
    stats: DashboardStats
    revenue_chart: list[RevenueChartPoint]
    recent_orders: list[OrderRead]
