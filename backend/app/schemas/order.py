# app/schemas/order.py
from datetime import datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.order import OrderStatus
from app.schemas.product import ProductRead


class OrderBase(BaseModel):
    user_id: UUID | None = Field(None, json_schema_extra={"x-ui-hidden": True})
    order_code: str = Field(..., json_schema_extra={"x-ui-priority": True, "x-ui-order": 1})
    customer_name: str | None = Field(None, json_schema_extra={"x-ui-priority": True, "x-ui-order": 2})
    contact_phone: str = Field(..., json_schema_extra={"x-ui-order": 3})
    total_amount: Decimal = Field(..., json_schema_extra={"x-ui-order": 4})
    status: Optional[OrderStatus] = Field(OrderStatus.PENDING, json_schema_extra={"x-ui-order": 5})


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
    items: list["OrderItemRead"] = []

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
    product: Optional[ProductRead] = None

    model_config = {"from_attributes": True}


class GuestOrderItemCreate(BaseModel):
    product_id: UUID
    variant_id: UUID | None = None
    quantity: int
    unit_price: Decimal


class GuestOrderCreate(BaseModel):
    contact_phone: str
    customer_name: str | None = None
    items: list[GuestOrderItemCreate]
