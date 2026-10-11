import unicodedata
from datetime import datetime
from decimal import Decimal
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.models.order import OrderStatus
from app.schemas.order import OrderRead

OrderAction = Literal["confirm", "process", "ship", "deliver", "pay", "cancel", "tracking", "note"]


class AdminOrderAction(BaseModel):
    model_config = ConfigDict(extra="forbid")

    action: OrderAction
    expected_version: int = Field(strict=True, ge=1, le=2_147_483_647)
    carrier_name: str | None = Field(default=None, max_length=120)
    tracking_number: str | None = Field(default=None, max_length=160)
    note: str | None = Field(default=None, max_length=2000)

    @field_validator("carrier_name", "tracking_number", "note", mode="before")
    @classmethod
    def safe_text(cls, value):
        if value is None:
            return None
        if not isinstance(value, str):
            raise ValueError("Must be text")
        if any(unicodedata.category(character).startswith("C") for character in value):
            raise ValueError("Control characters are not allowed")
        value = value.strip()
        if not value:
            raise ValueError("Must not be blank")
        return value

    @model_validator(mode="after")
    def action_fields(self):
        supplied = self.model_fields_set - {"action", "expected_version"}
        allowed = {"note"}
        if self.action in {"ship", "tracking"}:
            allowed |= {"carrier_name", "tracking_number"}
        if supplied - allowed:
            raise ValueError("Fields are not applicable to this action")
        if self.action == "note" and self.note is None:
            raise ValueError("A note is required")
        if self.action == "tracking" and not supplied.intersection({"carrier_name", "tracking_number"}):
            raise ValueError("A shipment field is required")
        return self


class AllowedOrderAction(BaseModel):
    action: OrderAction
    allowed: bool
    reason: str | None


class OrderEventRead(BaseModel):
    id: UUID
    actor_id: UUID
    event_type: str
    previous_state: dict[str, str | None]
    new_state: dict[str, str | None]
    metadata: dict[str, str | None]
    created_at: datetime


class AdminOrderRead(OrderRead):
    carrier_name: str | None
    tracking_number: str | None
    shipped_at: datetime | None
    delivered_at: datetime | None
    version: int
    allowed_actions: list[AllowedOrderAction]
    events: list[OrderEventRead]


class AdminOrderListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    order_code: str
    customer_name: str | None
    contact_phone: str
    total_amount: Decimal
    status: OrderStatus
    payment_status: str | None
    fulfillment_status: str | None
    created_at: datetime


class AdminOrderPage(BaseModel):
    items: list[AdminOrderListItem]
    total: int
    page: int
    page_size: int
