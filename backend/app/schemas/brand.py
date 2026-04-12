# app/schemas/brand.py
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class BrandBase(BaseModel):
    name: str
    slug: str
    logo_url: str | None = None
    country_of_origin: str | None = None
    description: str | None = None


class BrandCreate(BrandBase):
    pass


class BrandUpdate(BaseModel):
    name: str | None = None
    slug: str | None = None
    logo_url: str | None = None
    country_of_origin: str | None = None
    description: str | None = None


class BrandRead(BrandBase):
    id: UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
