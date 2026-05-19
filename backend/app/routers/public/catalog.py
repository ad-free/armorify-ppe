from datetime import datetime, timezone
from decimal import Decimal
from typing import Any, Literal, cast
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import and_, func, or_, select
from sqlalchemy.orm import selectinload
from sqlalchemy.sql.elements import ColumnElement

from app.core.database import DbSession
from app.models.flash_sale import FlashSale, FlashSaleItem
from app.models.product import Category, Product, ProductVariant
from app.schemas.common import PaginatedResponse
from app.schemas.flash_sale import FlashSalePublicRead
from app.schemas.product import CategoryRead, ProductRead, VariantRead

router = APIRouter(prefix="/catalog", tags=["public-catalog"])


@router.get("/flash-sale", response_model=FlashSalePublicRead)
async def get_active_flash_sale(db: DbSession):
    now = datetime.now(timezone.utc)
    stmt = (
        select(FlashSale)
        .where(and_(FlashSale.is_active.is_(True), FlashSale.start_at <= now, FlashSale.end_at >= now))
        .options(selectinload(FlashSale.items).selectinload(FlashSaleItem.product))
        .order_by(FlashSale.end_at.asc())
        .limit(1)
    )
    result = await db.execute(stmt)
    sale = result.scalar_one_or_none()

    if not sale:
        raise HTTPException(status_code=404, detail="No active flash sale found")

    # Map FlashSaleItem to ProductRead list with calculated discounts
    products: list[ProductRead] = []
    for item in sale.items:
        if not item.product.is_active:
            continue

        p = cast(Any, item.product)
        # Add dynamic fields to the product instance for the schema to pick up
        p.flash_sale_discount = item.discount_percent

        if item.sale_price:
            p.flash_sale_price = Decimal(str(item.sale_price))
        else:
            # Calculate price: price * (1 - discount/100)
            discount_factor = Decimal(str(1 - (item.discount_percent / 100)))
            p.flash_sale_price = cast(Decimal, p.price) * discount_factor
            p.flash_sale_price = p.flash_sale_price.quantize(Decimal("1"))

        products.append(ProductRead.model_validate(p))

    return FlashSalePublicRead(
        id=cast(UUID, sale.id),
        name=sale.name,
        start_at=sale.start_at,
        end_at=sale.end_at,
        is_active=sale.is_active,
        products=products,
    )


@router.get("/categories", response_model=list[CategoryRead])
async def list_categories(db: DbSession) -> list[Category]:
    stmt = select(Category).where(Category.is_active.is_(True))
    result = await db.execute(stmt)
    return list(result.scalars().all())


@router.get("/products", response_model=PaginatedResponse[ProductRead])
async def list_products(
    db: DbSession,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=24, ge=1, le=100),
    category_id: UUID | None = None,
    is_featured: bool | None = None,
    brand_id: UUID | None = None,
    price_min: Decimal | None = None,
    price_max: Decimal | None = None,
    is_new: bool | None = None,
    sort_by: Literal["newest", "price_asc", "price_desc", "featured"] = "newest",
    q: str | None = Query(default=None, min_length=1),
    rating_min: Decimal | None = None,
) -> PaginatedResponse[ProductRead]:
    filters: list[ColumnElement[bool]] = [Product.is_active.is_(True)]

    if category_id is not None:
        # Include products from subcategories (up to 3 levels deep)
        cat_ids = [category_id]

        children_res = await db.execute(
            select(Category.id).where(Category.parent_id == category_id, Category.is_active.is_(True))
        )
        children_ids = list(children_res.scalars().all())

        if children_ids:
            cat_ids.extend(children_ids)
            grandchildren_res = await db.execute(
                select(Category.id).where(Category.parent_id.in_(children_ids), Category.is_active.is_(True))
            )
            cat_ids.extend(grandchildren_res.scalars().all())

        filters.append(Product.category_id.in_(cat_ids))
    if is_featured is not None:
        filters.append(Product.is_featured.is_(is_featured))
    if brand_id is not None:
        filters.append(Product.brand_id == brand_id)
    if price_min is not None:
        filters.append(Product.price >= price_min)
    if price_max is not None:
        filters.append(Product.price <= price_max)
    if is_new is not None:
        filters.append(Product.is_new.is_(is_new))
    if q is not None:
        term = f"%{q}%"
        filters.append(or_(Product.name.ilike(term), Product.description.ilike(term)))
    if rating_min is not None:
        filters.append(Product.rating_avg >= rating_min)

    _sort_options: dict[str, list[ColumnElement[Any]]] = {
        "newest": [Product.created_at.desc()],
        "price_asc": [Product.price.asc()],
        "price_desc": [Product.price.desc()],
        "featured": [Product.is_featured.desc(), Product.created_at.desc()],
    }
    _sort = _sort_options[sort_by]

    where_clause = and_(*filters)
    total = (await db.execute(select(func.count()).select_from(Product).where(where_clause))).scalar_one()

    rows = (
        (
            await db.execute(
                select(Product)
                .options(selectinload(Product.brand))
                .where(where_clause)
                .order_by(*_sort)
                .offset(skip)
                .limit(limit)
            )
        )
        .scalars()
        .all()
    )
    product_read_response = [ProductRead.model_validate(row) for row in rows]
    return PaginatedResponse(items=product_read_response, total=total, skip=skip, limit=limit)


# Static path segments must be registered before `/products/{product_id}` so `slug` is not parsed as a UUID.
@router.get("/products/slug/{slug}", response_model=ProductRead)
async def get_product_by_slug(slug: str, db: DbSession) -> Product:
    stmt = select(Product).options(selectinload(Product.brand)).where(Product.slug == slug, Product.is_active.is_(True))
    result = await db.execute(stmt)
    product_result = result.scalar_one_or_none()
    if product_result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    product = cast(Product, product_result)

    now = datetime.now(timezone.utc)
    fs_stmt = (
        select(FlashSale, FlashSaleItem)
        .join(FlashSaleItem, FlashSale.id == FlashSaleItem.flash_sale_id)
        .where(
            and_(
                FlashSale.is_active.is_(True),
                FlashSale.start_at <= now,
                FlashSale.end_at >= now,
                FlashSaleItem.product_id == product.id,
            )
        )
        .order_by(FlashSale.end_at.asc())
        .limit(1)
    )
    fs_result = await db.execute(fs_stmt)
    fs_row = fs_result.first()

    if fs_row:
        sale, item = fs_row
        product_obj = cast(Any, product)
        product_obj.is_flash_deal = True
        product_obj.flash_deal_end = sale.end_at
        product_obj.flash_sale_discount = item.discount_percent
        if item.sale_price:
            product_obj.flash_sale_price = Decimal(str(item.sale_price))
        else:
            discount_factor = Decimal(str(1 - (item.discount_percent / 100)))
            product_obj.flash_sale_price = cast(Decimal, product_obj.price) * discount_factor
            product_obj.flash_sale_price = product_obj.flash_sale_price.quantize(Decimal("1"))

    return product


@router.get("/products/{product_id}/variants", response_model=list[VariantRead])
async def list_product_variants(product_id: UUID, db: DbSession) -> list[ProductVariant]:
    stmt = select(ProductVariant).where(
        ProductVariant.product_id == product_id,
        ProductVariant.is_active.is_(True),
    )
    result = await db.execute(stmt)
    return list(result.scalars().all())


@router.get("/products/{product_id}", response_model=ProductRead)
async def get_product(product_id: UUID, db: DbSession) -> Product:
    stmt = (
        select(Product)
        .options(selectinload(Product.brand))
        .where(Product.id == product_id, Product.is_active.is_(True))
    )
    result = await db.execute(stmt)
    product_result = result.scalar_one_or_none()
    if product_result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    product = cast(Product, product_result)

    now = datetime.now(timezone.utc)
    fs_stmt = (
        select(FlashSale, FlashSaleItem)
        .join(FlashSaleItem, FlashSale.id == FlashSaleItem.flash_sale_id)
        .where(
            and_(
                FlashSale.is_active.is_(True),
                FlashSale.start_at <= now,
                FlashSale.end_at >= now,
                FlashSaleItem.product_id == product.id,
            )
        )
        .order_by(FlashSale.end_at.asc())
        .limit(1)
    )
    fs_result = await db.execute(fs_stmt)
    fs_row = fs_result.first()

    if fs_row:
        sale, item = fs_row
        product_obj = cast(Any, product)
        product_obj.is_flash_deal = True
        product_obj.flash_deal_end = sale.end_at
        product_obj.flash_sale_discount = item.discount_percent
        if item.sale_price:
            product_obj.flash_sale_price = Decimal(str(item.sale_price))
        else:
            discount_factor = Decimal(str(1 - (item.discount_percent / 100)))
            product_obj.flash_sale_price = cast(Decimal, product_obj.price) * discount_factor
            product_obj.flash_sale_price = product_obj.flash_sale_price.quantize(Decimal("1"))

    return product
