# app/schemas/product_image.py
from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel


class ProductImageCreate(BaseModel):
    url: str
    alt_text: str | None = None
    position: int = 0


class ProductImageUpdate(BaseModel):
    url: str | None = None
    alt_text: str | None = None
    position: Optional[int] = None


class ProductImageRead(BaseModel):
    id: UUID
    product_id: UUID
    url: str
    alt_text: str | None = None
    position: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
