from pydantic import BaseModel
from decimal import Decimal
from datetime import date
from typing import List
from .order import OrderRead

class DashboardStats(BaseModel):
    total_revenue: Decimal
    total_orders: int
    total_users: int
    low_stock_count: int
    revenue_growth: float # Percentage
    order_growth: float # Percentage

class RevenueChartPoint(BaseModel):
    date: date
    revenue: Decimal
    orders: int

class DashboardData(BaseModel):
    stats: DashboardStats
    revenue_chart: List[RevenueChartPoint]
    recent_orders: List[OrderRead]
