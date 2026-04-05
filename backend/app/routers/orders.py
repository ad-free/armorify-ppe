# app/routers/orders.py
from typing import List
from uuid import UUID

from app.core.database import get_db
from app.models.order import Order, OrderItem
from app.schemas.order import (
    OrderCreate,
    OrderItemCreate,
    OrderItemRead,
    OrderItemUpdate,
    OrderRead,
    OrderUpdate,
)
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/orders", tags=["orders"])


@router.get("/", response_model=List[OrderRead])
async def list_orders(db: AsyncSession = Depends(get_db)) -> List[Order]:
    result = await db.execute(select(Order).where(Order.is_active.is_(True)))
    return result.scalars().all()


@router.post("/", response_model=OrderRead, status_code=status.HTTP_201_CREATED)
async def create_order(order_in: OrderCreate, db: AsyncSession = Depends(get_db)) -> Order:
    order = Order(**order_in.model_dump())
    db.add(order)
    await db.commit()
    await db.refresh(order)
    return order


@router.get("/{order_id}", response_model=OrderRead)
async def get_order(order_id: UUID, db: AsyncSession = Depends(get_db)) -> Order:
    order = await db.get(Order, order_id)
    if order is None or not order.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    return order


@router.put("/{order_id}", response_model=OrderRead)
async def update_order(order_id: UUID, order_update: OrderUpdate, db: AsyncSession = Depends(get_db)) -> Order:
    order = await db.get(Order, order_id)
    if order is None or not order.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    data = order_update.model_dump(exclude_unset=True)
    for field, value in data.items():
        setattr(order, field, value)
    db.add(order)
    await db.commit()
    await db.refresh(order)
    return order


@router.delete("/{order_id}", response_model=OrderRead)
async def soft_delete_order(order_id: UUID, db: AsyncSession = Depends(get_db)) -> Order:
    order = await db.get(Order, order_id)
    if order is None or not order.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    order.is_active = False
    db.add(order)
    await db.commit()
    await db.refresh(order)
    return order


@router.get("/items", response_model=List[OrderItemRead])
async def list_order_items(db: AsyncSession = Depends(get_db)) -> List[OrderItem]:
    result = await db.execute(select(OrderItem).where(OrderItem.is_active.is_(True)))
    return result.scalars().all()


@router.post("/items", response_model=OrderItemRead, status_code=status.HTTP_201_CREATED)
async def create_order_item(item_in: OrderItemCreate, db: AsyncSession = Depends(get_db)) -> OrderItem:
    item = OrderItem(**item_in.model_dump())
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return item


@router.put("/items/{item_id}", response_model=OrderItemRead)
async def update_order_item(
    item_id: UUID,
    item_update: OrderItemUpdate,
    db: AsyncSession = Depends(get_db)
) -> OrderItem:
    item = await db.get(OrderItem, item_id)
    if item is None or not item.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order item not found")
    data = item_update.model_dump(exclude_unset=True)
    for field, value in data.items():
        setattr(item, field, value)
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return item


@router.delete("/items/{item_id}", response_model=OrderItemRead)
async def soft_delete_order_item(item_id: UUID, db: AsyncSession = Depends(get_db)) -> OrderItem:
    item = await db.get(OrderItem, item_id)
    if item is None or not item.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order item not found")
    item.is_active = False
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return item
