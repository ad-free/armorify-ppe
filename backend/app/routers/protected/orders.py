# app/routers/protected/orders.py
from uuid import UUID

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.database import DbSession
from app.core.checkout import create_checkout
from app.core.deps import CurrentUser
from app.models.order import Order, OrderStatus
from app.schemas.order import (
    CheckoutCreate,
    OrderRead,
)

router = APIRouter(prefix="/orders", tags=["orders"])


@router.get("/", response_model=list[OrderRead])
async def list_my_orders(current_user: CurrentUser, db: DbSession) -> list[Order]:
    result = await db.execute(
        select(Order)
        .where(Order.user_id == current_user.id, Order.is_active.is_(True))
        .options(selectinload(Order.items))
        .order_by(Order.created_at.desc())
    )
    return list(result.scalars().all())


@router.post("/", response_model=OrderRead, status_code=status.HTTP_201_CREATED)
async def create_order(payload: CheckoutCreate, current_user: CurrentUser, db: DbSession) -> Order:
    return await create_checkout(db, payload, current_user.id)


@router.get("/{order_id}", response_model=OrderRead)
async def get_order(order_id: UUID, current_user: CurrentUser, db: DbSession) -> Order:
    order = (await db.execute(select(Order).where(Order.id == order_id).options(selectinload(Order.items)))).scalar_one_or_none()
    if order is None or order.user_id != current_user.id or not order.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    return order


@router.post("/{order_id}/cancel", response_model=OrderRead)
async def cancel_order(order_id: UUID, current_user: CurrentUser, db: DbSession) -> Order:
    order = (await db.execute(select(Order).where(Order.id == order_id).options(selectinload(Order.items)))).scalar_one_or_none()
    if order is None or order.user_id != current_user.id or not order.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    if order.status not in (OrderStatus.PENDING, OrderStatus.CONFIRMED):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Order cannot be cancelled at this stage")
    order.status = OrderStatus.CANCELLED
    db.add(order)
    await db.commit()
    await db.refresh(order)
    return order
