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
    stock: Optional[int] = 0
    is_featured: Optional[bool] = False
    category_id: UUID
    specifications: Optional[Any] = None


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: str | None = None
    slug: str | None = None
    description: str | None = None
    price: Optional[float] = None
    dealer_price: Optional[float] = None
    stock: Optional[int] = None
    is_featured: Optional[bool] = None
    category_id: UUID | None = None
    specifications: Optional[Any] = None


class ProductRead(ProductBase):
    id: UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class VariantBase(BaseModel):
    product_id: UUID
    sku: str
    size: str | None = None
    color: str | None = None
    stock: Optional[int] = 0
    price_override: Optional[Decimal] = None


class VariantCreate(VariantBase):
    pass


class VariantUpdate(BaseModel):
    sku: str | None = None
    size: str | None = None
    color: str | None = None
    stock: Optional[int] = None
    price_override: Optional[float] = None


class VariantRead(VariantBase):
    id: UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
