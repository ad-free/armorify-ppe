# app/schemas/brand.py
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.schemas.product import CatalogInput


class BrandBase(BaseModel):
    name: str
    slug: str
    logo_url: str | None = None
    country_of_origin: str | None = None
    description: str | None = Field(default=None, json_schema_extra={"x-ui-widget": "rich-text"})


class BrandCreate(CatalogInput, BrandBase):
    name: str = Field(min_length=1, max_length=255)
    slug: str = Field(min_length=1, max_length=255)
    logo_url: str | None = Field(default=None, max_length=512)
    country_of_origin: str | None = Field(default=None, max_length=128)
    description: str | None = Field(default=None, max_length=50000, json_schema_extra={"x-ui-widget": "rich-text"})
    is_active: bool = True


class BrandUpdate(CatalogInput):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    slug: str | None = Field(default=None, min_length=1, max_length=255)
    logo_url: str | None = Field(default=None, max_length=512)
    country_of_origin: str | None = Field(default=None, max_length=128)
    description: str | None = Field(default=None, max_length=50000, json_schema_extra={"x-ui-widget": "rich-text"})
    is_active: bool | None = None


class BrandRead(BrandBase):
    id: UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
