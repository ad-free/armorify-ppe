# app/routers/catalog.py
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.brand import Brand
from app.models.product import Category, Product, ProductVariant
from app.models.product_image import ProductImage
from app.models.review import Review
from app.schemas.brand import BrandRead
from app.schemas.common import PaginatedResponse
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
from app.schemas.product_image import ProductImageRead
from app.schemas.review import ReviewCreate, ReviewRead

router = APIRouter(prefix="/catalog", tags=["catalog"])


# ------------------------------------------------------------------
# CATEGORIES
# ------------------------------------------------------------------
@router.get("/categories", response_model=PaginatedResponse[CategoryRead])
async def list_categories(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    query = select(Category).where(Category.is_active.is_(True))
    total_res = await db.execute(select(func.count()).select_from(query.subquery()))
    total = total_res.scalar_one()

    result = await db.execute(query.offset(skip).limit(limit))
    items = list(result.scalars().all())
    return {"items": items, "total": total, "skip": skip, "limit": limit}


@router.post("/categories", response_model=CategoryRead, status_code=status.HTTP_201_CREATED)
async def create_category(category_in: CategoryCreate, db: AsyncSession = Depends(get_db)):
    category = Category(**category_in.model_dump())
    db.add(category)
    await db.commit()
    await db.refresh(category)
    return category


@router.put("/categories/{category_id}", response_model=CategoryRead)
async def update_category(category_id: UUID, category_update: CategoryUpdate, db: AsyncSession = Depends(get_db)):
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
async def soft_delete_category(category_id: UUID, db: AsyncSession = Depends(get_db)):
    category = await db.get(Category, category_id)
    if category is None or not category.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    category.is_active = False
    db.add(category)
    await db.commit()
    await db.refresh(category)
    return category


# ------------------------------------------------------------------
# BRANDS
# ------------------------------------------------------------------
@router.get("/brands", response_model=PaginatedResponse[BrandRead])
async def list_brands(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    query = select(Brand).where(Brand.is_active.is_(True))
    total_res = await db.execute(select(func.count()).select_from(query.subquery()))
    total = total_res.scalar_one()

    result = await db.execute(query.offset(skip).limit(limit))
    items = list(result.scalars().all())
    return {"items": items, "total": total, "skip": skip, "limit": limit}


# ------------------------------------------------------------------
# PRODUCTS
# ------------------------------------------------------------------
@router.get("/products", response_model=PaginatedResponse[ProductRead])
async def list_products(
    skip: int = 0,
    limit: int = 20,
    sort_by: str = "newest",
    category_id: UUID | None = None,
    db: AsyncSession = Depends(get_db),
):
    query = select(Product).where(Product.is_active.is_(True))

    if category_id:
        # Fetch up to 3 levels of subcategories manually to ensure compatibility across DB drivers
        cat_ids = [category_id]

        children_res = await db.execute(select(Category.id).where(Category.parent_id == category_id))
        children_ids = list(children_res.scalars().all())

        if children_ids:
            cat_ids.extend(children_ids)
            grandchildren_res = await db.execute(select(Category.id).where(Category.parent_id.in_(children_ids)))
            cat_ids.extend(grandchildren_res.scalars().all())

        query = query.where(Product.category_id.in_(cat_ids))

    if sort_by == "price_desc":
        query = query.order_by(Product.price.desc())
    elif sort_by == "price_asc":
        query = query.order_by(Product.price.asc())
    else:
        query = query.order_by(Product.created_at.desc())

    total_res = await db.execute(select(func.count()).select_from(query.subquery()))
    total = total_res.scalar_one()

    result = await db.execute(query.offset(skip).limit(limit))
    items = list(result.scalars().all())
    return {"items": items, "total": total, "skip": skip, "limit": limit}


@router.post("/products", response_model=ProductRead, status_code=status.HTTP_201_CREATED)
async def create_product(product_in: ProductCreate, db: AsyncSession = Depends(get_db)):
    product = Product(**product_in.model_dump())
    db.add(product)
    await db.commit()
    await db.refresh(product)
    return product


@router.put("/products/{product_id}", response_model=ProductRead)
async def update_product(product_id: UUID, product_update: ProductUpdate, db: AsyncSession = Depends(get_db)):
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
async def soft_delete_product(product_id: UUID, db: AsyncSession = Depends(get_db)):
    product = await db.get(Product, product_id)
    if product is None or not product.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    product.is_active = False
    db.add(product)
    await db.commit()
    await db.refresh(product)
    return product


# ------------------------------------------------------------------
# PRODUCT RELATIONS (IMAGES, REVIEWS)
# ------------------------------------------------------------------
@router.get("/products/{product_id}/images", response_model=list[ProductImageRead])
async def list_product_images(product_id: UUID, db: AsyncSession = Depends(get_db)):
    query = (
        select(ProductImage)
        .where(ProductImage.product_id == product_id, ProductImage.is_active.is_(True))
        .order_by(ProductImage.position.asc())
    )

    result = await db.execute(query)
    return list(result.scalars().all())


@router.get("/products/{product_id}/reviews", response_model=PaginatedResponse[ReviewRead])
async def list_product_reviews(product_id: UUID, skip: int = 0, limit: int = 10, db: AsyncSession = Depends(get_db)):
    query = (
        select(Review)
        .where(Review.product_id == product_id, Review.is_approved.is_(True), Review.is_active.is_(True))
        .order_by(Review.created_at.desc())
    )

    total_res = await db.execute(select(func.count()).select_from(query.subquery()))
    total = total_res.scalar_one()

    result = await db.execute(query.offset(skip).limit(limit))
    items = list(result.scalars().all())
    return {"items": items, "total": total, "skip": skip, "limit": limit}


@router.post("/products/{product_id}/reviews", response_model=ReviewRead, status_code=status.HTTP_201_CREATED)
async def create_product_review(product_id: UUID, review_in: ReviewCreate, db: AsyncSession = Depends(get_db)):
    # Auto approve for frontend testing
    review = Review(product_id=product_id, **review_in.model_dump(), is_approved=True, is_active=True)
    db.add(review)
    await db.commit()
    await db.refresh(review)
    return review


# ------------------------------------------------------------------
# VARIANTS
# ------------------------------------------------------------------
@router.get("/variants", response_model=list[VariantRead])
async def list_variants(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ProductVariant).where(ProductVariant.is_active.is_(True)))
    return list(result.scalars().all())


@router.post("/variants", response_model=VariantRead, status_code=status.HTTP_201_CREATED)
async def create_variant(variant_in: VariantCreate, db: AsyncSession = Depends(get_db)):
    variant = ProductVariant(**variant_in.model_dump())
    db.add(variant)
    await db.commit()
    await db.refresh(variant)
    return variant


@router.put("/variants/{variant_id}", response_model=VariantRead)
async def update_variant(variant_id: UUID, variant_update: VariantUpdate, db: AsyncSession = Depends(get_db)):
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
async def soft_delete_variant(variant_id: UUID, db: AsyncSession = Depends(get_db)):
    variant = await db.get(ProductVariant, variant_id)
    if variant is None or not variant.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Variant not found")
    variant.is_active = False
    db.add(variant)
    await db.commit()
    await db.refresh(variant)
    return variant
