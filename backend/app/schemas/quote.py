# app/schemas/quote.py
from typing import Optional
from uuid import UUID

from app.models.quote import QuoteStatus
from pydantic import BaseModel


class QuoteRequestBase(BaseModel):
    user_id: UUID
    company_name: str
    contact_phone: str
    note: Optional[str] = None
    status: Optional[QuoteStatus] = QuoteStatus.PENDING


class QuoteRequestCreate(QuoteRequestBase):
    pass


class QuoteRequestUpdate(BaseModel):
    company_name: Optional[str] = None
    contact_phone: Optional[str] = None
    note: Optional[str] = None
    status: Optional[QuoteStatus] = None


class QuoteRequestRead(QuoteRequestBase):
    id: UUID
    is_active: bool

    model_config = {"from_attributes": True}


class QuoteItemBase(BaseModel):
    quote_id: UUID
    product_id: UUID
    quantity: int
    note: Optional[str] = None


class QuoteItemCreate(QuoteItemBase):
    pass


class QuoteItemUpdate(BaseModel):
    product_id: Optional[UUID] = None
    quantity: Optional[int] = None
    note: Optional[str] = None


class QuoteItemRead(QuoteItemBase):
    id: UUID
    is_active: bool

    model_config = {"from_attributes": True}
