from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.checkout import cancel_checkout
from app.core.database import DbSession
from app.models.order import Order, OrderItem, OrderStatus
from app.schemas.order import AdminOrderRead, OrderUpdate

router = APIRouter(prefix="/admin/orders", tags=["admin-orders"])


class OrderStatusUpdate(BaseModel):
    status: OrderStatus


@router.get("", response_model=list[AdminOrderRead])
async def list_orders(
    db: DbSession,
    status_filter: OrderStatus | None = None,
    from_date: datetime | None = None,
    to_date: datetime | None = None,
) -> list[Order]:
    stmt = (
        select(Order)
        .where(Order.is_active.is_(True))
        .options(selectinload(Order.items).selectinload(OrderItem.product))
        .order_by(Order.created_at.desc())
    )

    if status_filter is not None:
        stmt = stmt.where(Order.status == status_filter)
    if from_date is not None:
        stmt = stmt.where(Order.created_at >= from_date)
    if to_date is not None:
        stmt = stmt.where(Order.created_at <= to_date)

    result = await db.execute(stmt)
    return list(result.scalars().all())


@router.get("/{order_id}", response_model=AdminOrderRead)
async def get_order(order_id: UUID, db: DbSession) -> Order:
    stmt = select(Order).where(Order.id == order_id).options(selectinload(Order.items).selectinload(OrderItem.product))
    result = await db.execute(stmt)
    order = result.scalar_one_or_none()
    if order is None or not order.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    return order


@router.put("/{order_id}", response_model=AdminOrderRead)
async def update_order(order_id: UUID, payload: OrderUpdate, db: DbSession) -> Order:
    if payload.status is None:
        return await get_order(order_id, db)
    return await update_order_status(order_id, OrderStatusUpdate(status=payload.status), db)


@router.patch("/{order_id}/status", response_model=AdminOrderRead)
async def update_order_status(order_id: UUID, payload: OrderStatusUpdate, db: DbSession) -> Order:
    stmt = (
        select(Order)
        .where(Order.id == order_id)
        .options(selectinload(Order.items).selectinload(OrderItem.product))
        .with_for_update(of=Order)
        .execution_options(populate_existing=True)
    )
    result = await db.execute(stmt)
    order = result.scalar_one_or_none()

    if order is None or not order.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    if payload.status == OrderStatus.CANCELLED:
        await cancel_checkout(db, order_id, order.user_id)
        return await get_order(order_id, db)
    if order.status == OrderStatus.CANCELLED:
        raise HTTPException(status_code=409, detail="A cancelled order cannot be reopened")

    order.status = payload.status
    db.add(order)
    await db.commit()

    # Re-fetch for clean serialization
    result = await db.execute(stmt)
    return result.scalar_one()
