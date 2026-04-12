# app/routers/admin/product_images.py
from uuid import UUID

from app.core.database import DbSession
from app.core.deps import require_staff
from app.crud.crud_product_image import product_image_crud
from app.models.product_image import ProductImage
from app.schemas.product_image import ProductImageCreate, ProductImageRead, ProductImageUpdate
from fastapi import APIRouter, Depends, HTTPException, status

router = APIRouter(
    prefix="/api/v1/admin/catalog/products",
    tags=["admin-product-images"],
    dependencies=[Depends(require_staff)],
)


@router.post("/{product_id}/images", response_model=ProductImageRead, status_code=status.HTTP_201_CREATED)
async def create_image(product_id: UUID, payload: ProductImageCreate, db: DbSession) -> ProductImage:
    instance = ProductImage(product_id=product_id, **payload.model_dump())
    db.add(instance)
    await db.commit()
    await db.refresh(instance)
    return instance


@router.put("/images/{image_id}", response_model=ProductImageRead)
async def update_image(image_id: UUID, payload: ProductImageUpdate, db: DbSession) -> ProductImage:
    image = await product_image_crud.update(db, image_id, payload)
    if image is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Image not found")
    return image


@router.delete("/images/{image_id}", response_model=ProductImageRead)
async def delete_image(image_id: UUID, db: DbSession) -> ProductImage:
    image = await product_image_crud.soft_delete(db, image_id)
    if image is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Image not found")
    return image
