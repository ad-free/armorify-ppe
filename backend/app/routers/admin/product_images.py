# app/routers/admin/product_images.py
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.database import DbSession
from app.core.deps import require_staff
from app.crud.crud_product_image import product_image_crud
from app.models.product_image import ProductImage
from app.schemas.product_image import ProductImageAdminCreate, ProductImageCreate, ProductImageRead, ProductImageUpdate

router = APIRouter(
    prefix="/admin/catalog/product-images",
    tags=["admin-product-images"],
    dependencies=[Depends(require_staff)],
)


@router.get("", response_model=list[ProductImageRead])
async def list_images(
    db: DbSession,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    include_inactive: bool = False,
) -> list[ProductImage]:
    return await product_image_crud.get_multi(db, skip=skip, limit=limit, include_inactive=include_inactive)


@router.post("", response_model=ProductImageRead, status_code=status.HTTP_201_CREATED)
async def create_image(payload: ProductImageAdminCreate, db: DbSession) -> ProductImage:
    return await product_image_crud.create(db, payload)


@router.put("/{image_id}", response_model=ProductImageRead)
async def update_image(image_id: UUID, payload: ProductImageUpdate, db: DbSession) -> ProductImage:
    image = await product_image_crud.update(db, image_id, payload)
    if image is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Image not found")
    return image


@router.delete("/{image_id}", response_model=ProductImageRead)
async def delete_image(image_id: UUID, db: DbSession) -> ProductImage:
    image = await product_image_crud.soft_delete(db, image_id)
    if image is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Image not found")
    return image


# Backward-compatible endpoint for product-scoped image creation
@router.post("/products/{product_id}", response_model=ProductImageRead, status_code=status.HTTP_201_CREATED)
async def create_image_for_product(product_id: UUID, payload: ProductImageCreate, db: DbSession) -> ProductImage:
    instance = ProductImage(product_id=product_id, **payload.model_dump())
    db.add(instance)
    await db.commit()
    await db.refresh(instance)
    return instance
