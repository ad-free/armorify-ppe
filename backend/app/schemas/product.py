# app/schemas/product.py
from datetime import datetime
from decimal import Decimal
from typing import Any, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class CategoryBase(BaseModel):
    name: str
    slug: str
    description: str | None = None
    parent_id: UUID | None = None
    industry_tags: Optional[Any] = None


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    name: str | None = None
    slug: str | None = None
    description: str | None = None
    parent_id: UUID | None = None
    industry_tags: Optional[Any] = None


class CategoryRead(CategoryBase):
    id: UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ProductBase(BaseModel):
    name: str = Field(title="Name")
    slug: str = Field(title="Slug")
    description: str | None = Field(default=None, title="Description", json_schema_extra={"x-ui-widget": "rich-text"})
    price: Decimal = Field(title="Price")
    dealer_price: Optional[Decimal] = Field(default=None, title="Dealer Price")
    compare_at_price: Optional[Decimal] = Field(default=None, title="Compare At Price")
    stock: Optional[int] = Field(default=0, title="Stock")
    is_featured: Optional[bool] = Field(default=False, title="Featured")
    category_id: UUID = Field(title="Category")
    brand_id: UUID | None = Field(default=None, title="Brand")
    specifications: Optional[dict[str, Any]] = Field(default=None, title="Specifications")
    cover_image_url: str | None = Field(default=None, title="Cover Image")


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: str | None = None
    slug: str | None = None
    description: str | None = Field(default=None, json_schema_extra={"x-ui-widget": "rich-text"})
    price: Optional[float] = None
    dealer_price: Optional[float] = None
    compare_at_price: Optional[float] = None
    stock: Optional[int] = None
    is_featured: Optional[bool] = None
    category_id: UUID | None = None
    brand_id: UUID | None = None
    specifications: Optional[dict[str, Any]] = None
    cover_image_url: str | None = None


class ProductBrandRead(BaseModel):
    """Lightweight brand payload for storefront product cards and detail."""

    id: UUID
    name: str
    slug: str
    logo_url: str | None = None
    country_of_origin: str | None = None

    model_config = {"from_attributes": True}


class ProductRead(ProductBase):
    id: UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime
    brand_id: UUID | None = None
    is_new: bool = False
    video_url: str | None = None
    seo_title: str | None = None
    seo_description: str | None = None
    rating_avg: Decimal | None = None
    rating_count: int = 0
    brand: ProductBrandRead | None = None
    flash_sale_price: Optional[Decimal] = None
    flash_sale_discount: Optional[float] = None
    is_flash_deal: bool = False
    flash_deal_end: Optional[datetime] = None

    model_config = {"from_attributes": True}


class VariantBase(BaseModel):
    product_id: UUID
    sku: str
    size: str | None = None
    color: str | None = None
    stock: Optional[int] = 0
    price_override: Optional[Decimal] = None
    attributes: Optional[dict[str, Any]] = None


class VariantCreate(VariantBase):
    pass


class VariantUpdate(BaseModel):
    sku: str | None = None
    size: str | None = None
    color: str | None = None
    stock: Optional[int] = None
    price_override: Optional[float] = None
    attributes: Optional[dict[str, Any]] = None


class VariantRead(VariantBase):
    id: UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
