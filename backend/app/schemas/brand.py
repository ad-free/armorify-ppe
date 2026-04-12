# app/schemas/brand.py
from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel


class BrandBase(BaseModel):
    name: str
    slug: str
    logo_url: Optional[str] = None
    country_of_origin: Optional[str] = None
    description: Optional[str] = None


class BrandCreate(BrandBase):
    pass


class BrandUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    logo_url: Optional[str] = None
    country_of_origin: Optional[str] = None
    description: Optional[str] = None


class BrandRead(BrandBase):
    id: UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
