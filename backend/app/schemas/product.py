# app/schemas/product.py
from typing import Any, Optional
from uuid import UUID

from pydantic import BaseModel


class CategoryBase(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    parent_id: Optional[UUID] = None
    industry_tags: Optional[Any] = None


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    parent_id: Optional[UUID] = None
    industry_tags: Optional[Any] = None


class CategoryRead(CategoryBase):
    id: UUID
    is_active: bool

    model_config = {"from_attributes": True}


class ProductBase(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    price: float
    dealer_price: Optional[float] = None
    stock: Optional[int] = 0
    is_featured: Optional[bool] = False
    category_id: UUID
    specifications: Optional[Any] = None


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    dealer_price: Optional[float] = None
    stock: Optional[int] = None
    is_featured: Optional[bool] = None
    category_id: Optional[UUID] = None
    specifications: Optional[Any] = None


class ProductRead(ProductBase):
    id: UUID
    is_active: bool

    model_config = {"from_attributes": True}


class VariantBase(BaseModel):
    product_id: UUID
    sku: str
    size: Optional[str] = None
    color: Optional[str] = None
    stock: Optional[int] = 0
    price_override: Optional[float] = None


class VariantCreate(VariantBase):
    pass


class VariantUpdate(BaseModel):
    sku: Optional[str] = None
    size: Optional[str] = None
    color: Optional[str] = None
    stock: Optional[int] = None
    price_override: Optional[float] = None


class VariantRead(VariantBase):
    id: UUID
    is_active: bool

    model_config = {"from_attributes": True}
