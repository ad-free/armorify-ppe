# app/routers/public/related.py
from uuid import UUID

from app.core.database import DbSession
from app.models.product import Product
from app.schemas.product import ProductRead
from fastapi import APIRouter, HTTPException, status
from sqlalchemy import and_, select

router = APIRouter(prefix="/api/v1/catalog/products", tags=["public-related"])


@router.get("/{product_id}/related", response_model=list[ProductRead])
async def list_related_products(product_id: UUID, db: DbSession) -> list[Product]:
    product = await db.get(Product, product_id)
    if product is None or not product.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    filters = [
        Product.id != product_id,
        Product.is_active.is_(True),
        Product.category_id == product.category_id,
    ]

    if product.brand_id is not None:
        filters.append(Product.brand_id == product.brand_id)

    stmt = (
        select(Product)
        .where(and_(*filters))
        .order_by(Product.is_featured.desc(), Product.created_at.desc())
        .limit(6)
    )
    result = await db.execute(stmt)
    return list(result.scalars().all())
