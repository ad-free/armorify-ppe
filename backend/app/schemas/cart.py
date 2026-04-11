# app/schemas/cart.py
from datetime import datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel


class CartItemBase(BaseModel):
    product_id: UUID
    variant_id: Optional[UUID] = None
    quantity: int
    unit_price: Decimal


class CartItemCreate(CartItemBase):
    pass


class CartItemUpdate(BaseModel):
    quantity: Optional[int] = None
    unit_price: Optional[Decimal] = None


class CartItemRead(CartItemBase):
    id: UUID
    cart_id: UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class CartRead(BaseModel):
    id: UUID
    user_id: UUID
    is_active: bool
    items: list[CartItemRead] = []
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
