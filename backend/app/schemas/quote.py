# app/schemas/quote.py
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel

from app.models.quote import QuoteStatus


class QuoteRequestBase(BaseModel):
    user_id: UUID
    company_name: str
    contact_phone: str
    note: str | None = None
    status: QuoteStatus | None = QuoteStatus.PENDING


class QuoteRequestCreate(QuoteRequestBase):
    pass


class QuoteRequestUpdate(BaseModel):
    company_name: str | None = None
    contact_phone: str | None = None
    note: str | None = None
    status: QuoteStatus | None = None


class QuoteRequestRead(QuoteRequestBase):
    id: UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class QuoteItemBase(BaseModel):
    quote_id: UUID
    product_id: UUID
    quantity: int
    note: str | None = None


class QuoteItemCreate(QuoteItemBase):
    pass


class QuoteItemUpdate(BaseModel):
    product_id: UUID | None = None
    quantity: int | None = None
    note: str | None = None


class QuoteItemRead(QuoteItemBase):
    id: UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
