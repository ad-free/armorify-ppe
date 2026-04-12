# app/schemas/order.py
from datetime import datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel

from app.models.order import OrderStatus


class OrderBase(BaseModel):
    user_id: UUID | None = None
    order_code: str
    contact_phone: str
    total_amount: Decimal
    status: Optional[OrderStatus] = OrderStatus.PENDING


class OrderCreate(OrderBase):
    pass


class OrderUpdate(BaseModel):
    total_amount: Optional[Decimal] = None
    status: Optional[OrderStatus] = None


class OrderRead(OrderBase):
    id: UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class OrderItemBase(BaseModel):
    order_id: UUID
    product_id: UUID
    variant_id: UUID | None = None
    quantity: int
    unit_price: Decimal


class OrderItemCreate(OrderItemBase):
    pass


class OrderItemUpdate(BaseModel):
    product_id: UUID | None = None
    variant_id: UUID | None = None
    quantity: Optional[int] = None
    unit_price: Optional[Decimal] = None


class OrderItemRead(OrderItemBase):
    id: UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class GuestOrderItemCreate(BaseModel):
    product_id: UUID
    variant_id: UUID | None = None
    quantity: int
    unit_price: Decimal


class GuestOrderCreate(BaseModel):
    contact_phone: str
    items: list[GuestOrderItemCreate]
