# app/routers/catalog.py
from typing import List
from uuid import UUID

from app.core.database import get_db
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
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/catalog", tags=["catalog"])


@router.get("/categories", response_model=List[CategoryRead])
async def list_categories(db: AsyncSession = Depends(get_db)) -> List[Category]:
    result = await db.execute(select(Category).where(Category.is_active.is_(True)))
    return result.scalars().all()


@router.post("/categories", response_model=CategoryRead, status_code=status.HTTP_201_CREATED)
async def create_category(category_in: CategoryCreate, db: AsyncSession = Depends(get_db)) -> Category:
    category = Category(**category_in.model_dump())
    db.add(category)
    await db.commit()
    await db.refresh(category)
    return category


@router.put("/categories/{category_id}", response_model=CategoryRead)
async def update_category(
    category_id: UUID,
    category_update: CategoryUpdate,
    db: AsyncSession = Depends(get_db)
) -> Category:
    category = await db.get(Category, category_id)
    if category is None or not category.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    data = category_update.model_dump(exclude_unset=True)
    for field, value in data.items():
        setattr(category, field, value)
    db.add(category)
    await db.commit()
    await db.refresh(category)
    return category


@router.delete("/categories/{category_id}", response_model=CategoryRead)
async def soft_delete_category(category_id: UUID, db: AsyncSession = Depends(get_db)) -> Category:
    category = await db.get(Category, category_id)
    if category is None or not category.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    category.is_active = False
    db.add(category)
    await db.commit()
    await db.refresh(category)
    return category


@router.get("/products", response_model=List[ProductRead])
async def list_products(db: AsyncSession = Depends(get_db)) -> List[Product]:
    result = await db.execute(select(Product).where(Product.is_active.is_(True)))
    return result.scalars().all()


@router.post("/products", response_model=ProductRead, status_code=status.HTTP_201_CREATED)
async def create_product(product_in: ProductCreate, db: AsyncSession = Depends(get_db)) -> Product:
    product = Product(**product_in.model_dump())
    db.add(product)
    await db.commit()
    await db.refresh(product)
    return product


@router.put("/products/{product_id}", response_model=ProductRead)
async def update_product(
    product_id: UUID,
    product_update: ProductUpdate,
    db: AsyncSession = Depends(get_db)
) -> Product:
    product = await db.get(Product, product_id)
    if product is None or not product.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    data = product_update.model_dump(exclude_unset=True)
    for field, value in data.items():
        setattr(product, field, value)
    db.add(product)
    await db.commit()
    await db.refresh(product)
    return product


@router.delete("/products/{product_id}", response_model=ProductRead)
async def soft_delete_product(product_id: UUID, db: AsyncSession = Depends(get_db)) -> Product:
    product = await db.get(Product, product_id)
    if product is None or not product.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    product.is_active = False
    db.add(product)
    await db.commit()
    await db.refresh(product)
    return product


@router.get("/variants", response_model=List[VariantRead])
async def list_variants(db: AsyncSession = Depends(get_db)) -> List[ProductVariant]:
    result = await db.execute(select(ProductVariant).where(ProductVariant.is_active.is_(True)))
    return result.scalars().all()


@router.post("/variants", response_model=VariantRead, status_code=status.HTTP_201_CREATED)
async def create_variant(variant_in: VariantCreate, db: AsyncSession = Depends(get_db)) -> ProductVariant:
    variant = ProductVariant(**variant_in.model_dump())
    db.add(variant)
    await db.commit()
    await db.refresh(variant)
    return variant


@router.put("/variants/{variant_id}", response_model=VariantRead)
async def update_variant(
    variant_id: UUID,
    variant_update: VariantUpdate,
    db: AsyncSession = Depends(get_db)
) -> ProductVariant:
    variant = await db.get(ProductVariant, variant_id)
    if variant is None or not variant.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Variant not found")
    data = variant_update.model_dump(exclude_unset=True)
    for field, value in data.items():
        setattr(variant, field, value)
    db.add(variant)
    await db.commit()
    await db.refresh(variant)
    return variant


@router.delete("/variants/{variant_id}", response_model=VariantRead)
async def soft_delete_variant(variant_id: UUID, db: AsyncSession = Depends(get_db)) -> ProductVariant:
    variant = await db.get(ProductVariant, variant_id)
    if variant is None or not variant.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Variant not found")
    variant.is_active = False
    db.add(variant)
    await db.commit()
    await db.refresh(variant)
    return variant
