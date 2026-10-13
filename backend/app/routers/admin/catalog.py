from typing import Literal
from uuid import UUID

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy import func, select

from app.core.catalog_admin import commit, conflict, save_product, save_variant, update_reference
from app.core.database import DbSession
from app.core.deps import require_staff
from app.core.inventory import adjust_inventory
from app.core.product_media import store_image_file
from app.crud.base import CRUDBase
from app.models.cart import CartItem
from app.models.inventory import InventoryMovement
from app.models.product import Category, Product, ProductVariant
from app.models.product_image import ProductImage
from app.models.user import User
from app.schemas.product import (
    AdminProductRead,
    AdminVariantRead,
    CategoryCreate,
    CategoryRead,
    CategoryUpdate,
    InventoryAdjustment,
    InventoryMovementRead,
    ProductCreate,
    ProductDetail,
    ProductPage,
    ProductUpdate,
    VariantCreate,
    VariantUpdate,
)

router = APIRouter(prefix="/admin/catalog", tags=["admin-catalog"], dependencies=[Depends(require_staff)])
category_crud = CRUDBase[Category](Category)
variant_crud = CRUDBase[ProductVariant](ProductVariant)


async def variant_reads(db, variants):
    if not variants:
        return []
    counts = dict(
        (
            await db.execute(
                select(CartItem.variant_id, func.count())
                .where(CartItem.variant_id.in_([variant.id for variant in variants]), CartItem.is_active.is_(True))
                .group_by(CartItem.variant_id)
            )
        ).all()
    )
    return [
        AdminVariantRead.model_validate(variant).model_copy(update={"cart_count": counts.get(variant.id, 0)})
        for variant in variants
    ]


@router.get("/categories", response_model=list[CategoryRead])
async def list_categories(
    db: DbSession, skip: int = Query(0, ge=0), limit: int = Query(100, ge=1, le=500), include_inactive: bool = False
):
    return await category_crud.get_multi(db, skip=skip, limit=limit, include_inactive=include_inactive)


@router.post("/categories", response_model=CategoryRead, status_code=status.HTTP_201_CREATED)
async def create_category(payload: CategoryCreate, db: DbSession):
    category = Category(**payload.model_dump())
    if category.parent_id and await db.get(Category, category.parent_id) is None:
        conflict("parent_id", "Parent category not found", status=422)
    db.add(category)
    return await commit(db, category)


@router.put("/categories/{category_id}", response_model=CategoryRead)
async def update_category(category_id: UUID, payload: CategoryUpdate, db: DbSession):
    if payload.parent_id == category_id:
        conflict("parent_id", "Category cannot be its own parent", status=422)
    if payload.parent_id and await db.get(Category, payload.parent_id) is None:
        conflict("parent_id", "Parent category not found", status=422)
    return await update_reference(db, Category, category_id, payload.model_dump(exclude_unset=True))


@router.delete("/categories/{category_id}", response_model=CategoryRead)
async def soft_delete_category(category_id: UUID, db: DbSession):
    return await update_reference(db, Category, category_id, {"is_active": False})


@router.get("/products", response_model=ProductPage)
async def list_products(
    db: DbSession,
    skip: int = Query(0, ge=0),
    limit: int = Query(25, ge=1, le=500),
    q: str | None = Query(None, max_length=255),
    category_id: UUID | None = None,
    brand_id: UUID | None = None,
    is_active: bool | None = None,
    is_featured: bool | None = None,
    is_new: bool | None = None,
    variant_mode: Literal["with", "without"] | None = None,
    low_stock: bool | None = None,
    sort_by: Literal["newest", "name_asc", "name_desc", "price_asc", "price_desc", "stock_asc"] = "newest",
):
    filters = []
    for field, value in (
        ("category_id", category_id),
        ("brand_id", brand_id),
        ("is_active", is_active),
        ("is_featured", is_featured),
        ("is_new", is_new),
    ):
        if value is not None:
            filters.append(getattr(Product, field) == value)
    if q and q.strip():
        term = q.strip().replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
        active_sku = (
            select(ProductVariant.id)
            .where(
                ProductVariant.product_id == Product.id,
                ProductVariant.is_active.is_(True),
                ProductVariant.sku.ilike(f"%{term}%", escape="\\"),
            )
            .exists()
        )
        filters.append(
            Product.name.ilike(f"%{term}%", escape="\\") | Product.slug.ilike(f"%{term}%", escape="\\") | active_sku
        )
    if variant_mode:
        filters.append(Product.has_variants == (variant_mode == "with"))  # type: ignore[attr-defined]
    if low_stock is not None:
        filters.append(
            (Product.available_stock < 10)  # type: ignore[attr-defined]
            if low_stock
            else (Product.available_stock >= 10)  # type: ignore[attr-defined]
        )
    sorts = {
        "newest": Product.created_at.desc(),
        "name_asc": Product.name.asc(),
        "name_desc": Product.name.desc(),
        "price_asc": Product.price.asc(),
        "price_desc": Product.price.desc(),
        "stock_asc": Product.available_stock.asc(),  # type: ignore[attr-defined]
    }
    total = await db.scalar(select(func.count()).select_from(Product).where(*filters))
    items = (
        await db.scalars(select(Product).where(*filters).order_by(sorts[sort_by], Product.id).offset(skip).limit(limit))
    ).all()
    return {"items": items, "total": total, "skip": skip, "limit": limit}


@router.get("/products/{product_id}", response_model=ProductDetail)
async def get_product(product_id: UUID, db: DbSession):
    product = await db.get(Product, product_id)
    if product is None:
        raise HTTPException(404, "Product not found")
    variants = (
        await db.scalars(
            select(ProductVariant)
            .where(ProductVariant.product_id == product_id)
            .order_by(ProductVariant.created_at, ProductVariant.id)
        )
    ).all()
    variant_results = await variant_reads(db, variants)
    images = (
        await db.scalars(
            select(ProductImage)
            .where(ProductImage.product_id == product_id)
            .order_by(ProductImage.position, ProductImage.id)
        )
    ).all()
    movements = (
        await db.scalars(
            select(InventoryMovement)
            .where(InventoryMovement.product_id == product_id)
            .order_by(InventoryMovement.created_at.desc(), InventoryMovement.id)
            .limit(50)
        )
    ).all()
    return {
        **AdminProductRead.model_validate(product).model_dump(),
        "variants": variant_results,
        "images": images,
        "recent_movements": movements,
    }


@router.post("/products", response_model=AdminProductRead, status_code=status.HTTP_201_CREATED)
async def create_product(payload: ProductCreate, db: DbSession):
    return await save_product(db, payload)


@router.put("/products/{product_id}", response_model=AdminProductRead)
async def update_product(product_id: UUID, payload: ProductUpdate, db: DbSession):
    return await save_product(db, payload, product_id)


@router.post(
    "/products/{product_id}/inventory-adjustments",
    response_model=InventoryMovementRead,
    status_code=status.HTTP_201_CREATED,
)
async def adjust_product_inventory(
    product_id: UUID, payload: InventoryAdjustment, db: DbSession, actor: User = Depends(require_staff)
):
    movement = await adjust_inventory(
        db,
        product_id,
        payload.variant_id,
        payload.quantity_delta,
        "admin_adjustment",
        admin_actor_id=actor.id,
        reason=payload.reason,
    )
    await db.commit()
    await db.refresh(movement)
    return movement


@router.get("/variants", response_model=list[AdminVariantRead])
async def list_variants(
    db: DbSession, skip: int = Query(0, ge=0), limit: int = Query(100, ge=1, le=500), include_inactive: bool = False
):
    variants = await variant_crud.get_multi(db, skip=skip, limit=limit, include_inactive=include_inactive)
    return await variant_reads(db, variants)


@router.post("/variants", response_model=AdminVariantRead, status_code=status.HTTP_201_CREATED)
async def create_variant(payload: VariantCreate, db: DbSession):
    variant = await save_variant(db, payload)
    return (await variant_reads(db, [variant]))[0]


@router.put("/variants/{variant_id}", response_model=AdminVariantRead)
async def update_variant(variant_id: UUID, payload: VariantUpdate, db: DbSession):
    variant = await save_variant(db, payload, variant_id)
    return (await variant_reads(db, [variant]))[0]


@router.post("/uploads/images")
async def upload_catalog_image(file: UploadFile = File(...)):
    url, _ = await store_image_file(file)
    return {"url": url}
