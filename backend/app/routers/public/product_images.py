# app/routers/public/product_images.py
from uuid import UUID

from fastapi import APIRouter
from sqlalchemy import select

from app.core.database import DbSession
from app.models.product_image import ProductImage
from app.schemas.product_image import ProductImageRead

router = APIRouter(prefix="/api/v1/catalog/products", tags=["public-product-images"])


@router.get("/{product_id}/images", response_model=list[ProductImageRead])
async def list_product_images(product_id: UUID, db: DbSession) -> list[ProductImage]:
    stmt = (
        select(ProductImage)
        .where(ProductImage.product_id == product_id, ProductImage.is_active.is_(True))
        .order_by(ProductImage.position)
    )
    result = await db.execute(stmt)
    return list(result.scalars().all())
