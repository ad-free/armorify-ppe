from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, Query, UploadFile, status

from app.core.database import DbSession
from app.core.deps import require_staff
from app.core.product_media import update_image as save_image
from app.core.product_media import upload_image
from app.crud.crud_product_image import product_image_crud
from app.models.product_image import ProductImage
from app.schemas.product_image import ProductImageRead, ProductImageUpdate

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


@router.post("/products/{product_id}/upload", response_model=ProductImageRead, status_code=status.HTTP_201_CREATED)
async def upload_product_image(
    product_id: UUID,
    db: DbSession,
    file: UploadFile = File(...),
    alt_text: str | None = Form(default=None, max_length=255),
    position: int = Form(default=0, ge=0, le=10000),
    is_cover: bool = Form(default=False),
) -> ProductImage:
    return await upload_image(db, product_id, file, alt_text, position, is_cover)


@router.put("/{image_id}", response_model=ProductImageRead)
async def update_image(image_id: UUID, payload: ProductImageUpdate, db: DbSession) -> ProductImage:
    return await save_image(db, image_id, payload.model_dump(exclude_unset=True))


@router.delete("/{image_id}", response_model=ProductImageRead)
async def delete_image(image_id: UUID, db: DbSession) -> ProductImage:
    return await save_image(db, image_id, {"is_active": False, "is_cover": False})
