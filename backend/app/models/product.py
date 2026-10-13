# app/models/product.py
from decimal import Decimal
from typing import TYPE_CHECKING, Any
from uuid import UUID as _UUID

if TYPE_CHECKING:
    from app.models.brand import Brand

from app.models.base import Base, BaseMixin
from sqlalchemy import (
    BigInteger,
    Boolean,
    CheckConstraint,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    case,
    cast,
    func,
    select,
    text,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, column_property, mapped_column, relationship


class Category(BaseMixin, Base):
    __tablename__ = "categories"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    parent_id: Mapped[_UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("categories.id", ondelete="SET NULL"),
        nullable=True,
    )
    industry_tags: Mapped[Any | None] = mapped_column(JSONB, nullable=True)
    products: Mapped[list["Product"]] = relationship(back_populates="category")

    __table_args__ = (
        Index("ix_categories_slug", "slug", unique=True),
        CheckConstraint(
            "slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'",
            name="ck_categories_slug_format",
        ),
    )


class Product(BaseMixin, Base):
    __tablename__ = "products"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    price: Mapped[Numeric] = mapped_column(Numeric(12, 2), nullable=False)
    dealer_price: Mapped[Numeric | None] = mapped_column(Numeric(12, 2), nullable=True)
    stock: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("0"))
    version: Mapped[int] = mapped_column(Integer, nullable=False, default=1, server_default=text("1"))
    is_featured: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("false"))
    category_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("categories.id", ondelete="RESTRICT"),
        nullable=False,
    )
    specifications: Mapped[Any | None] = mapped_column(
        JSONB,
        nullable=True,
        server_default=text("'{}'::jsonb"),
    )
    brand_id: Mapped[_UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("brands.id", ondelete="SET NULL"), nullable=True
    )
    compare_at_price: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    is_new: Mapped[bool] = mapped_column(Boolean, default=False, server_default=text("false"))
    video_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    cover_image_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    seo_title: Mapped[str | None] = mapped_column(String(160), nullable=True)
    seo_description: Mapped[str | None] = mapped_column(String(320), nullable=True)
    rating_avg: Mapped[Decimal | None] = mapped_column(Numeric(3, 2), nullable=True)
    rating_count: Mapped[int] = mapped_column(Integer, default=0, server_default=text("0"))
    category: Mapped[Category] = relationship(back_populates="products")
    brand: Mapped["Brand | None"] = relationship("Brand", foreign_keys=[brand_id], lazy="joined")
    variants: Mapped[list["ProductVariant"]] = relationship(back_populates="product")

    __table_args__ = (
        Index("ix_products_slug", "slug", unique=True),
        Index("ix_products_category_id", "category_id"),
        Index("ix_products_is_featured", "is_featured"),
        Index("ix_products_brand_id", "brand_id"),
        Index("ix_products_is_new", "is_new"),
        CheckConstraint(
            "compare_at_price > price OR compare_at_price IS NULL",
            name="ck_products_compare_at_price_gt_price",
        ),
        CheckConstraint("price > 0", name="ck_products_price_positive"),
        CheckConstraint(
            "dealer_price > 0 OR dealer_price IS NULL",
            name="ck_products_dealer_price_positive",
        ),
        CheckConstraint("stock >= 0", name="ck_products_stock_nonneg"),
        CheckConstraint("version >= 1", name="ck_products_version_positive"),
        CheckConstraint(
            "slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'",
            name="ck_products_slug_format",
        ),
    )


class ProductVariant(BaseMixin, Base):
    __tablename__ = "product_variants"

    product_id: Mapped[_UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("products.id", ondelete="CASCADE"),
        nullable=False,
    )
    sku: Mapped[str] = mapped_column(String(128), nullable=False)
    size: Mapped[str | None] = mapped_column(String(64), nullable=True)
    color: Mapped[str | None] = mapped_column(String(64), nullable=True)
    stock: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("0"))
    price_override: Mapped[Numeric | None] = mapped_column(Numeric(12, 2), nullable=True)
    attributes: Mapped[Any | None] = mapped_column(
        JSONB,
        nullable=True,
        server_default=text("'{}'::jsonb"),
    )
    product: Mapped[Product] = relationship(back_populates="variants")

    @property
    def available_stock(self) -> int:
        return self.stock if self.is_active else 0

    @property
    def stock_status(self) -> str:
        balance = self.available_stock
        return "out_of_stock" if balance == 0 else "low_stock" if balance < 10 else "in_stock"

    __table_args__ = (
        UniqueConstraint("id", "product_id", name="uq_variants_id_product"),
        Index("ix_variants_product_id", "product_id"),
        Index(
            "ix_variants_sku",
            "sku",
            unique=True,
            postgresql_where=text("is_active = true"),
        ),
        CheckConstraint("stock >= 0", name="ck_variants_stock_nonneg"),
    )


# Correlated expressions keep list filtering/sorting and serialization authoritative
# without loading variants or counting the legacy base balance twice.

_has_variants = (
    select(ProductVariant.id).where(ProductVariant.product_id == Product.id).correlate_except(ProductVariant).exists()
)
_variant_stock = (
    select(func.coalesce(func.sum(cast(ProductVariant.stock, BigInteger)), 0))
    .where(ProductVariant.product_id == Product.id, ProductVariant.is_active.is_(True))
    .correlate_except(ProductVariant)
    .scalar_subquery()
)
Product.has_variants = column_property(_has_variants)
_available_stock = case((_has_variants, _variant_stock), else_=cast(Product.stock, BigInteger))
Product.available_stock = column_property(_available_stock)
Product.stock_status = column_property(
    case(
        (_available_stock == 0, "out_of_stock"),
        (_available_stock < 10, "low_stock"),
        else_="in_stock",
    )
)
