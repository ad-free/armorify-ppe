# app/schemas/order.py
from datetime import datetime
from decimal import Decimal
from typing import Annotated, Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.order import OrderStatus
from app.schemas.product import ProductRead


class CheckoutInput(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class CheckoutItem(CheckoutInput):
    product_id: UUID
    variant_id: UUID | None = None
    quantity: Annotated[int, Field(strict=True, ge=1, le=2_147_483_647)]  # PostgreSQL INTEGER; stock supplies the sales limit.


class CheckoutQuoteRequest(CheckoutInput):
    items: list[CheckoutItem] = Field(min_length=1, max_length=100)


class CheckoutCreate(CheckoutQuoteRequest):
    customer_name: str = Field(min_length=1, max_length=128)
    contact_phone: str = Field(min_length=6, max_length=32, pattern=r"^\+?[0-9][0-9 .()-]*$")
    email: str | None = Field(default=None, max_length=254)
    province: str = Field(min_length=1, max_length=128)
    district: str = Field(min_length=1, max_length=128)
    ward: str = Field(min_length=1, max_length=128)
    address: str = Field(min_length=1, max_length=512)
    delivery_note: str | None = Field(default=None, max_length=1000)
    shipping_method: Literal["standard"]
    payment_method: Literal["cod"]
    idempotency_key: UUID
    pricing_token: str = Field(min_length=64, max_length=64, pattern=r"^[0-9a-f]{64}$")

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str | None) -> str | None:
        if value is None:
            return None
        # No dependency required: checkout accepts a simple mailbox, not display names.
        import re
        if not re.fullmatch(r"[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+", value):
            raise ValueError("Địa chỉ email không hợp lệ")
        return value


class CheckoutQuoteItem(BaseModel):
    product_id: UUID
    variant_id: UUID | None
    quantity: int
    product_name: str | None = None
    slug: str | None = None
    image_url: str | None = None
    sku: str | None = None
    attributes: dict = Field(default_factory=dict)
    stock: int = 0
    base_price: Decimal | None = None
    unit_price: Decimal | None = None
    line_total: Decimal | None = None
    issue: str | None = None


class CheckoutQuote(BaseModel):
    items: list[CheckoutQuoteItem]
    subtotal: Decimal
    discount: Decimal
    shipping: Decimal | None
    total: Decimal | None
    pricing_token: str | None
    can_checkout: bool
    shipping_method: Literal["standard"] = "standard"
    payment_methods: list[Literal["cod"]] = Field(default_factory=lambda: ["cod"])
    shipping_message: str | None = None


class OrderBase(BaseModel):
    user_id: UUID | None = Field(None, json_schema_extra={"x-ui-hidden": True})
    order_code: str = Field(..., json_schema_extra={"x-ui-priority": True, "x-ui-order": 1})
    customer_name: str | None = Field(None, json_schema_extra={"x-ui-priority": True, "x-ui-order": 2})
    contact_phone: str = Field(..., json_schema_extra={"x-ui-order": 3})
    total_amount: Decimal = Field(..., json_schema_extra={"x-ui-order": 4})
    status: OrderStatus | None = Field(OrderStatus.PENDING, json_schema_extra={"x-ui-order": 5})



class OrderUpdate(CheckoutInput):
    status: OrderStatus | None = None


class OrderItemBase(BaseModel):
    order_id: UUID
    product_id: UUID
    variant_id: UUID | None = None
    quantity: int
    unit_price: Decimal

class OrderItemRead(OrderItemBase):
    id: UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime
    product_name: str | None = None
    sku: str | None = None
    attributes: dict | None = None
    model_config = ConfigDict(from_attributes=True)


class OrderRead(OrderBase):
    id: UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime
    email: str | None = None
    province: str | None = None
    district: str | None = None
    ward: str | None = None
    address: str | None = None
    delivery_note: str | None = None
    shipping_method: str | None = None
    payment_method: str | None = None
    payment_status: str | None = None
    fulfillment_status: str | None = None
    subtotal: Decimal | None = None
    discount: Decimal | None = None
    shipping: Decimal | None = None
    items: list[OrderItemRead] = Field(default_factory=list)
    model_config = ConfigDict(from_attributes=True)


class AdminOrderItemRead(OrderItemRead):
    product: ProductRead | None = None


class AdminOrderRead(OrderRead):
    items: list[AdminOrderItemRead] = Field(default_factory=list)
