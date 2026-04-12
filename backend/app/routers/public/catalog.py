from decimal import Decimal
from typing import Any, Literal
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import and_, func, or_, select

from app.core.database import DbSession
from app.models.product import Category, Product, ProductVariant
from app.schemas.common import PaginatedResponse
from app.schemas.product import CategoryRead, ProductRead, VariantRead

router = APIRouter(prefix="/catalog", tags=["public-catalog"])


@router.get("/categories", response_model=list[CategoryRead])
async def list_categories(db: DbSession) -> list[Category]:
    stmt = select(Category).where(Category.is_active.is_(True))
    result = await db.execute(stmt)
    return list(result.scalars().all())


@router.get("/products", response_model=PaginatedResponse[ProductRead])
async def list_products(
    db: DbSession,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=24, ge=1, le=100),
    category_id: UUID | None = None,
    is_featured: bool | None = None,
    brand_id: UUID | None = None,
    price_min: Decimal | None = None,
    price_max: Decimal | None = None,
    is_new: bool | None = None,
    sort_by: Literal["newest", "price_asc", "price_desc", "featured"] = "newest",
    q: str | None = Query(default=None, min_length=1),
) -> PaginatedResponse[ProductRead]:
    filters: list[Any] = [Product.is_active.is_(True)]
    if category_id is not None:
        filters.append(Product.category_id == category_id)
    if is_featured is not None:
        filters.append(Product.is_featured.is_(is_featured))
    if brand_id is not None:
        filters.append(Product.brand_id == brand_id)
    if price_min is not None:
        filters.append(Product.price >= price_min)
    if price_max is not None:
        filters.append(Product.price <= price_max)
    if is_new is not None:
        filters.append(Product.is_new.is_(is_new))
    if q is not None:
        term = f"%{q}%"
        filters.append(or_(Product.name.ilike(term), Product.description.ilike(term)))

    _sort = {
        "newest": [Product.created_at.desc()],
        "price_asc": [Product.price.asc()],
        "price_desc": [Product.price.desc()],
        "featured": [Product.is_featured.desc(), Product.created_at.desc()],
    }[sort_by]

    base = select(Product).where(and_(*filters))
    total = (await db.execute(select(func.count()).select_from(base.subquery()))).scalar_one()
    rows = (await db.execute(base.order_by(*_sort).offset(skip).limit(limit))).scalars().all()
    return PaginatedResponse(items=list(rows), total=total, skip=skip, limit=limit)


@router.get("/products/{product_id}", response_model=ProductRead)
async def get_product(product_id: UUID, db: DbSession) -> Product:
    product = await db.get(Product, product_id)
    if product is None or not product.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return product


@router.get("/products/slug/{slug}", response_model=ProductRead)
async def get_product_by_slug(slug: str, db: DbSession) -> Product:
    stmt = select(Product).where(Product.slug == slug, Product.is_active.is_(True))
    result = await db.execute(stmt)
    product = result.scalar_one_or_none()
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return product


@router.get("/products/{product_id}/variants", response_model=list[VariantRead])
async def list_product_variants(product_id: UUID, db: DbSession) -> list[ProductVariant]:
    stmt = select(ProductVariant).where(
        ProductVariant.product_id == product_id,
        ProductVariant.is_active.is_(True),
    )
    result = await db.execute(stmt)
    return list(result.scalars().all())
