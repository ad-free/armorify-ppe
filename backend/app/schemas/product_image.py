# app/schemas/product_image.py
from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel


class ProductImageCreate(BaseModel):
    url: str
    alt_text: Optional[str] = None
    position: int = 0


class ProductImageUpdate(BaseModel):
    url: Optional[str] = None
    alt_text: Optional[str] = None
    position: Optional[int] = None


class ProductImageRead(BaseModel):
    id: UUID
    product_id: UUID
    url: str
    alt_text: Optional[str] = None
    position: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
