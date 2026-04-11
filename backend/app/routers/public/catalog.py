from typing import Any
from uuid import UUID

from app.core.database import DbSession
from app.models.product import Category, Product, ProductVariant
from app.schemas.product import CategoryRead, ProductRead, VariantRead
from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import and_, or_, select

router = APIRouter(prefix="/catalog", tags=["public-catalog"])


@router.get("/categories", response_model=list[CategoryRead])
async def list_categories(db: DbSession) -> list[Category]:
    stmt = select(Category).where(Category.is_active.is_(True))
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/products", response_model=list[ProductRead])
async def list_products(
    db: DbSession,
    category_id: UUID | None = None,
    is_featured: bool | None = None,
    q: str | None = Query(default=None, min_length=1),
) -> list[Product]:
    filters: list[Any] = [Product.is_active.is_(True)]
    if category_id is not None:
        filters.append(Product.category_id == category_id)
    if is_featured is not None:
        filters.append(Product.is_featured.is_(is_featured))
    if q is not None:
        term = f"%{q}%"
        filters.append(or_(Product.name.ilike(term), Product.description.ilike(term)))
    stmt = select(Product).where(and_(*filters))
    result = await db.execute(stmt)
    return result.scalars().all()


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
    return result.scalars().all()
