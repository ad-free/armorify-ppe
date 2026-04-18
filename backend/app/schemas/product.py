# app/schemas/product.py
from datetime import datetime
from decimal import Decimal
from typing import Any, Optional
from uuid import UUID

from pydantic import BaseModel


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
    name: str
    slug: str
    description: str | None = None
    price: Decimal
    dealer_price: Optional[Decimal] = None
    compare_at_price: Optional[Decimal] = None
    stock: Optional[int] = 0
    is_featured: Optional[bool] = False
    category_id: UUID
    specifications: Optional[Any] = None
    cover_image_url: str | None = None


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: str | None = None
    slug: str | None = None
    description: str | None = None
    price: Optional[float] = None
    dealer_price: Optional[float] = None
    compare_at_price: Optional[float] = None
    stock: Optional[int] = None
    is_featured: Optional[bool] = None
    category_id: UUID | None = None
    specifications: Optional[Any] = None
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
