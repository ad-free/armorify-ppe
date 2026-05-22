# app/routers/protected/orders.py
from uuid import UUID

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.database import DbSession
from app.core.deps import CurrentUser
from app.models.order import Order, OrderItem, OrderStatus
from app.schemas.order import (
    OrderCreate,
    OrderItemCreate,
    OrderItemRead,
    OrderItemUpdate,
    OrderRead,
)

router = APIRouter(prefix="/orders", tags=["orders"])


@router.get("/", response_model=list[OrderRead])
async def list_my_orders(current_user: CurrentUser, db: DbSession) -> list[Order]:
    result = await db.execute(
        select(Order)
        .where(Order.user_id == current_user.id, Order.is_active.is_(True))
        .options(selectinload(Order.items).selectinload(OrderItem.product))
        .order_by(Order.created_at.desc())
    )
    return list(result.scalars().all())


@router.post("/", response_model=OrderRead, status_code=status.HTTP_201_CREATED)
async def create_order(payload: OrderCreate, current_user: CurrentUser, db: DbSession) -> Order:
    order = Order(**payload.model_dump(), user_id=current_user.id)
    db.add(order)
    await db.commit()
    await db.refresh(order)
    return order


@router.get("/{order_id}", response_model=OrderRead)
async def get_order(order_id: UUID, current_user: CurrentUser, db: DbSession) -> Order:
    order = await db.get(Order, order_id)
    if order is None or order.user_id != current_user.id or not order.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    return order


@router.post("/{order_id}/cancel", response_model=OrderRead)
async def cancel_order(order_id: UUID, current_user: CurrentUser, db: DbSession) -> Order:
    order = await db.get(Order, order_id)
    if order is None or order.user_id != current_user.id or not order.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    if order.status not in (OrderStatus.PENDING, OrderStatus.CONFIRMED):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Order cannot be cancelled at this stage")
    order.status = OrderStatus.CANCELLED
    db.add(order)
    await db.commit()
    await db.refresh(order)
    return order


@router.post("/items", response_model=OrderItemRead, status_code=status.HTTP_201_CREATED)
async def add_order_item(payload: OrderItemCreate, current_user: CurrentUser, db: DbSession) -> OrderItem:
    order = await db.get(Order, payload.order_id)
    if order is None or order.user_id != current_user.id or not order.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    item = OrderItem(**payload.model_dump())
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return item


@router.put("/items/{item_id}", response_model=OrderItemRead)
async def update_order_item(
    item_id: UUID, payload: OrderItemUpdate, current_user: CurrentUser, db: DbSession
) -> OrderItem:
    item = await db.get(OrderItem, item_id)
    if item is None or not item.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order item not found")
    order = await db.get(Order, item.order_id)
    if order is None or order.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order item not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(item, field, value)
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return item


@router.delete("/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_order_item(item_id: UUID, current_user: CurrentUser, db: DbSession) -> None:
    item = await db.get(OrderItem, item_id)
    if item is None or not item.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order item not found")
    order = await db.get(Order, item.order_id)
    if order is None or order.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order item not found")
    item.is_active = False
    db.add(item)
    await db.commit()
