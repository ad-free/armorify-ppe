from pathlib import Path
from uuid import UUID, uuid4

from fastapi import APIRouter, File, HTTPException, Query, Request, UploadFile, status

from app.core.database import DbSession
from app.crud.base import CRUDBase
from app.models.product import Category, Product, ProductVariant
from app.schemas.product import (
    CategoryCreate,
    CategoryRead,
    CategoryUpdate,
    ProductCreate,
    ProductRead,
    ProductUpdate,
    VariantCreate,
    VariantRead,
    VariantUpdate,
)

router = APIRouter(prefix="/admin/catalog", tags=["admin-catalog"])

category_crud = CRUDBase[Category](Category)
product_crud = CRUDBase[Product](Product)
variant_crud = CRUDBase[ProductVariant](ProductVariant)


@router.get("/categories", response_model=list[CategoryRead])
async def list_categories(
    db: DbSession,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    include_inactive: bool = False,
) -> list[Category]:
    return await category_crud.get_multi(db, skip=skip, limit=limit, include_inactive=include_inactive)


@router.post("/categories", response_model=CategoryRead, status_code=status.HTTP_201_CREATED)
async def create_category(payload: CategoryCreate, db: DbSession) -> Category:
    return await category_crud.create(db, payload)


@router.put("/categories/{category_id}", response_model=CategoryRead)
async def update_category(category_id: UUID, payload: CategoryUpdate, db: DbSession) -> Category:
    if payload.parent_id is not None and payload.parent_id == category_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Category cannot be its own parent")
    category = await category_crud.update(db, category_id, payload)
    if category is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    return category


@router.delete("/categories/{category_id}", response_model=CategoryRead)
async def soft_delete_category(category_id: UUID, db: DbSession) -> Category:
    category = await category_crud.soft_delete(db, category_id)
    if category is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    return category


@router.get("/products", response_model=list[ProductRead])
async def list_products(
    db: DbSession,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    include_inactive: bool = False,
) -> list[Product]:
    return await product_crud.get_multi(db, skip=skip, limit=limit, include_inactive=include_inactive)


@router.post("/products", response_model=ProductRead, status_code=status.HTTP_201_CREATED)
async def create_product(payload: ProductCreate, db: DbSession) -> Product:
    return await product_crud.create(db, payload)


@router.post("/uploads/images", status_code=status.HTTP_201_CREATED)
async def upload_product_image(request: Request, file: UploadFile = File(...)) -> dict[str, str]:
    static_root = Path(__file__).resolve().parents[3] / "static" / "uploads"
    static_root.mkdir(parents=True, exist_ok=True)

    file_extension = Path(file.filename).suffix
    safe_filename = f"{uuid4().hex}{file_extension}"
    destination = static_root / safe_filename

    contents = await file.read()
    destination.write_bytes(contents)

    image_url = str(request.url_for("static", path=f"uploads/{safe_filename}"))
    return {"url": image_url}


@router.put("/products/{product_id}", response_model=ProductRead)
async def update_product(product_id: UUID, payload: ProductUpdate, db: DbSession) -> Product:
    product = await product_crud.update(db, product_id, payload)
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return product


@router.delete("/products/{product_id}", response_model=ProductRead)
async def soft_delete_product(product_id: UUID, db: DbSession) -> Product:
    product = await product_crud.soft_delete(db, product_id)
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return product


@router.get("/variants", response_model=list[VariantRead])
async def list_variants(
    db: DbSession,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    include_inactive: bool = False,
) -> list[ProductVariant]:
    return await variant_crud.get_multi(db, skip=skip, limit=limit, include_inactive=include_inactive)


@router.post("/variants", response_model=VariantRead, status_code=status.HTTP_201_CREATED)
async def create_variant(payload: VariantCreate, db: DbSession) -> ProductVariant:
    return await variant_crud.create(db, payload)


@router.put("/variants/{variant_id}", response_model=VariantRead)
async def update_variant(variant_id: UUID, payload: VariantUpdate, db: DbSession) -> ProductVariant:
    variant = await variant_crud.update(db, variant_id, payload)
    if variant is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Variant not found")
    return variant


@router.delete("/variants/{variant_id}", response_model=VariantRead)
async def soft_delete_variant(variant_id: UUID, db: DbSession) -> ProductVariant:
    variant = await variant_crud.soft_delete(db, variant_id)
    if variant is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Variant not found")
    return variant
