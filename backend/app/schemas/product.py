import json
import math
import re
from datetime import datetime
from decimal import Decimal
from typing import Any
from urllib.parse import urlsplit
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.schemas.product_image import ProductImageRead


class CatalogInput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    @field_validator("*", mode="before")
    @classmethod
    def normalize_text(cls, value, info):
        if isinstance(value, str):
            value = value.strip()
            if any(ord(c) < 32 and c not in "\n\t" for c in value) or any(0xD800 <= ord(c) <= 0xDFFF for c in value):
                raise ValueError("Unsafe control characters")
            if info.field_name in {"name", "slug", "sku", "reason", "size", "color"} and not value:
                raise ValueError("Must not be blank")
        return value

    @field_validator("slug", check_fields=False)
    @classmethod
    def slug_format(cls, value):
        if value is not None and not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", value):
            raise ValueError("Use lowercase letters, digits and single hyphens")
        return value

    @field_validator("cover_image_url", "video_url", "logo_url", check_fields=False)
    @classmethod
    def safe_url(cls, value, info):
        if value is None:
            return value
        parsed = urlsplit(value)
        if (
            parsed.scheme in {"http", "https"}
            and parsed.hostname
            and not parsed.username
            and not parsed.password
            and not any(c.isspace() for c in value)
        ):
            parsed.port  # Reject malformed or out-of-range ports.
            return value
        if info.field_name == "cover_image_url" and re.fullmatch(
            r"/static/(?:uploads|product-images)/[A-Za-z0-9_-]+\.(?:jpg|jpeg|png|webp)", value
        ):
            return value
        raise ValueError("Use an HTTP(S) URL or a safe managed image path")

    @field_validator("specifications", "attributes", mode="before", check_fields=False)
    @classmethod
    def bounded_attributes(cls, value):
        if value is None:
            return None
        if not isinstance(value, dict) or len(value) > 32:
            raise ValueError("At most 32 key/value entries are allowed")
        result = {}
        for key, item in value.items():
            if not isinstance(key, str) or not key.strip() or len(key.strip()) > 64:
                raise ValueError("Keys must be meaningful text of at most 64 characters")
            key = key.strip()
            if key.casefold() in {k.casefold() for k in result}:
                raise ValueError("Duplicate normalized keys")
            if isinstance(item, str):
                item = item.strip()
                if not item or len(item) > 512:
                    raise ValueError("Values must be meaningful text of at most 512 characters")
            elif type(item) not in {int, float, bool} or (
                type(item) in {int, float} and (abs(item) > 1e12 or not math.isfinite(item))
            ):
                raise ValueError("Values must be bounded finite scalars")
            if any(ord(c) < 32 or 0xD800 <= ord(c) <= 0xDFFF for c in key + (item if isinstance(item, str) else "")):
                raise ValueError("Unsafe characters in attributes")
            result[key] = item
        if len(json.dumps(result, ensure_ascii=False).encode()) > 8192:
            raise ValueError("Attributes exceed 8192 bytes")
        return result

    @field_validator("industry_tags", mode="before", check_fields=False)
    @classmethod
    def bounded_tags(cls, value):
        if value is None:
            return None
        if not isinstance(value, (dict, list)) or len(value) > 32:
            raise ValueError("Industry tags must be a bounded list or object")
        try:
            encoded = json.dumps(value, ensure_ascii=False, allow_nan=False).encode()
        except (TypeError, ValueError, UnicodeError, RecursionError) as exc:
            raise ValueError("Industry tags must be finite JSON") from exc
        if len(encoded) > 8192:
            raise ValueError("Industry tags exceed 8192 bytes")
        return value


class CategoryBase(BaseModel):
    name: str
    slug: str
    description: str | None = None
    parent_id: UUID | None = None
    industry_tags: Any | None = None


class CategoryCreate(CatalogInput, CategoryBase):
    name: str = Field(min_length=1, max_length=255)
    slug: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=50000)
    is_active: bool = True


class CategoryUpdate(CatalogInput):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    slug: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=50000)
    parent_id: UUID | None = None
    industry_tags: Any | None = None
    is_active: bool | None = None


class CategoryRead(CategoryBase):
    id: UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class ProductBase(BaseModel):
    name: str
    slug: str
    description: str | None = None
    price: Decimal
    dealer_price: Decimal | None = None
    compare_at_price: Decimal | None = None
    is_featured: bool = False
    category_id: UUID
    brand_id: UUID | None = None
    specifications: dict[str, Any] | None = None
    cover_image_url: str | None = None
    is_new: bool = False
    video_url: str | None = None
    seo_title: str | None = None
    seo_description: str | None = None


class ProductCreate(CatalogInput, ProductBase):
    name: str = Field(min_length=1, max_length=255)
    slug: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=50000)
    price: Decimal = Field(gt=0, max_digits=12, decimal_places=2, allow_inf_nan=False)
    dealer_price: Decimal | None = Field(default=None, gt=0, max_digits=12, decimal_places=2, allow_inf_nan=False)
    compare_at_price: Decimal | None = Field(default=None, gt=0, max_digits=12, decimal_places=2, allow_inf_nan=False)
    cover_image_url: str | None = Field(default=None, max_length=512)
    video_url: str | None = Field(default=None, max_length=2048)
    seo_title: str | None = Field(default=None, max_length=160)
    seo_description: str | None = Field(default=None, max_length=320)
    is_active: bool = True


class ProductUpdate(CatalogInput):
    expected_version: int = Field(strict=True, ge=1, le=2147483647)
    name: str | None = Field(default=None, min_length=1, max_length=255)
    slug: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=50000)
    price: Decimal | None = Field(default=None, gt=0, max_digits=12, decimal_places=2, allow_inf_nan=False)
    dealer_price: Decimal | None = Field(default=None, gt=0, max_digits=12, decimal_places=2, allow_inf_nan=False)
    compare_at_price: Decimal | None = Field(default=None, gt=0, max_digits=12, decimal_places=2, allow_inf_nan=False)
    category_id: UUID | None = None
    brand_id: UUID | None = None
    specifications: dict[str, Any] | None = None
    cover_image_url: str | None = Field(default=None, max_length=512)
    video_url: str | None = Field(default=None, max_length=2048)
    seo_title: str | None = Field(default=None, max_length=160)
    seo_description: str | None = Field(default=None, max_length=320)
    is_active: bool | None = None
    is_featured: bool | None = None
    is_new: bool | None = None


class ProductBrandRead(BaseModel):
    id: UUID
    name: str
    slug: str
    logo_url: str | None = None
    country_of_origin: str | None = None
    model_config = ConfigDict(from_attributes=True)


class ProductRead(ProductBase):
    id: UUID
    stock: int = 0
    available_stock: int = 0
    has_variants: bool = False
    stock_status: str = "out_of_stock"
    is_active: bool
    created_at: datetime
    updated_at: datetime
    rating_avg: Decimal | None = None
    rating_count: int = 0
    brand: ProductBrandRead | None = None
    flash_sale_price: Decimal | None = None
    flash_sale_discount: float | None = None
    is_flash_deal: bool = False
    flash_deal_end: datetime | None = None
    model_config = ConfigDict(from_attributes=True)


class VariantBase(BaseModel):
    product_id: UUID
    sku: str
    size: str | None = None
    color: str | None = None
    price_override: Decimal | None = None
    attributes: dict[str, Any] | None = None


class VariantCreate(CatalogInput, VariantBase):
    sku: str = Field(min_length=1, max_length=128)
    size: str | None = Field(default=None, max_length=64)
    color: str | None = Field(default=None, max_length=64)
    price_override: Decimal | None = Field(default=None, gt=0, max_digits=12, decimal_places=2, allow_inf_nan=False)
    is_active: bool = True


class VariantUpdate(CatalogInput):
    sku: str | None = Field(default=None, min_length=1, max_length=128)
    size: str | None = Field(default=None, max_length=64)
    color: str | None = Field(default=None, max_length=64)
    price_override: Decimal | None = Field(default=None, gt=0, max_digits=12, decimal_places=2, allow_inf_nan=False)
    attributes: dict[str, Any] | None = None
    is_active: bool | None = None
    confirm_cart_impact: bool = False


class VariantRead(VariantBase):
    id: UUID
    stock: int = 0
    available_stock: int = 0
    stock_status: str = "out_of_stock"
    is_active: bool
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class AdminVariantRead(VariantRead):
    cart_count: int = 0


class InventoryAdjustment(CatalogInput):
    variant_id: UUID | None = None
    quantity_delta: int = Field(strict=True, ge=-2147483648, le=2147483647)
    reason: str = Field(min_length=1, max_length=1000)


class InventoryMovementRead(BaseModel):
    id: UUID
    product_id: UUID
    variant_id: UUID | None
    quantity_delta: int
    resulting_balance: int
    source_type: str
    order_id: UUID | None
    admin_actor_id: UUID | None
    reason: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class AdminProductRead(ProductRead):
    version: int


class ProductPage(BaseModel):
    items: list[AdminProductRead]
    total: int
    skip: int
    limit: int


class ProductDetail(AdminProductRead):
    variants: list[AdminVariantRead]
    images: list[ProductImageRead]
    recent_movements: list[InventoryMovementRead]
