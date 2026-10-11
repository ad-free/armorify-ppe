"""Catalog mutations share parent/reference locks with inventory and media."""

from app.models.brand import Brand
from app.models.cart import CartItem
from app.models.product import Category, Product, ProductVariant
from app.models.product_image import ProductImage
from fastapi import HTTPException
from sqlalchemy import func, select, text
from sqlalchemy.exc import IntegrityError


def conflict(field, message, kind="catalog_conflict", status=409):
    raise HTTPException(status, detail=[{"loc": ["body", field], "msg": message, "type": kind}])


async def locked(db, model, identity):
    row = await db.scalar(
        select(model).where(model.id == identity).with_for_update(of=model).execution_options(populate_existing=True)
    )
    if row is None:
        raise HTTPException(404, f"{model.__name__} not found")
    return row


async def commit(db, row, field="slug"):
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        conflict(field, "Value conflicts with an existing catalog record")
    await db.refresh(row)
    return row


async def references(db, values):
    for model, field in ((Category, "category_id"), (Brand, "brand_id")):
        identity = values.get(field)
        if identity is None:
            if model is Category:
                conflict(field, "Category is required", status=422)
            continue
        row = await db.scalar(
            select(model)
            .where(model.id == identity)
            .with_for_update(of=model)
            .execution_options(populate_existing=True)
        )
        if row is None or (values["is_active"] and not row.is_active):
            conflict(field, "Reference must exist and be active for an active product", status=422)


async def save_product(db, payload, product_id=None):
    values = payload.model_dump(exclude_unset=True)
    if product_id is None:
        product = Product(**values, stock=0)
        merged = {**values, "is_active": values.get("is_active", True)}
    else:
        product = await locked(db, Product, product_id)
        if values.pop("expected_version") != product.version:
            conflict("expected_version", "Product changed; reload before saving", "stale_version")
        if "cover_image_url" in values and await db.scalar(
            select(ProductImage.id).where(ProductImage.product_id == product_id).limit(1)
        ):
            conflict("cover_image_url", "Managed images own the cover; use the image editor")
        merged = {
            field: values.get(field, getattr(product, field))
            for field in ("category_id", "brand_id", "is_active", "price", "compare_at_price")
        }
        for field in ("name", "slug", "price", "category_id", "is_active", "is_featured", "is_new"):
            if field in values and values[field] is None:
                conflict(field, "Must not be null", status=422)
    await references(db, merged)
    price = merged.get("price", values.get("price"))
    compare = merged.get("compare_at_price", values.get("compare_at_price"))
    if compare is not None and compare <= price:
        conflict("compare_at_price", "Comparison price must exceed price", status=422)
    if product_id is not None:
        for field, value in values.items():
            setattr(product, field, value)
        product.version += 1
    db.add(product)
    return await commit(db, product)


async def update_reference(db, model, identity, values):
    row = await locked(db, model, identity)
    if values.get("is_active") is False:
        field = "category_id" if model is Category else "brand_id"
        if await db.scalar(
            select(Product.id).where(getattr(Product, field) == identity, Product.is_active.is_(True)).limit(1)
        ):
            conflict("is_active", "Deactivate or move active products first", "active_products")
    for field, value in values.items():
        if field in {"name", "slug", "is_active"} and value is None:
            conflict(field, "Must not be null", status=422)
        setattr(row, field, value)
    return await commit(db, row)


def option_key(values):
    def normalize(value):
        return " ".join(value.split()).casefold() if isinstance(value, str) else str(value).casefold()

    attributes = values.get("attributes") or {}
    return (
        normalize(values.get("size") or ""),
        normalize(values.get("color") or ""),
        tuple(sorted((normalize(k), normalize(v)) for k, v in attributes.items())),
    )


async def cart_count(db, variant_id):
    return await db.scalar(
        select(func.count())
        .select_from(CartItem)
        .where(CartItem.variant_id == variant_id, CartItem.is_active.is_(True))
    )


async def save_variant(db, payload, variant_id=None):
    values = payload.model_dump(exclude_unset=True)
    confirmed = values.pop("confirm_cart_impact", False)
    if variant_id is None:
        product_id = values["product_id"]
        variant = None
    else:
        product_id = await db.scalar(select(ProductVariant.product_id).where(ProductVariant.id == variant_id))
        if product_id is None:
            raise HTTPException(404, "Variant not found")
    product = await locked(db, Product, product_id)
    if variant_id is not None:
        variant = await locked(db, ProductVariant, variant_id)
    fields = ("sku", "size", "color", "attributes", "price_override", "is_active")
    merged = {
        field: values.get(field, getattr(variant, field) if variant else (True if field == "is_active" else None))
        for field in fields
    }
    for field in ("sku", "is_active"):
        if merged[field] is None:
            conflict(field, "Must not be null", status=422)
    key = option_key(merged)
    if not any(key):
        conflict("attributes", "A size, color or meaningful selection attribute is required", status=422)
    # Serialize cross-product SKU writers; product locks serialize option writers.
    await db.execute(text("SELECT pg_advisory_xact_lock(hashtext(:sku))"), {"sku": merged["sku"].casefold()})
    if merged["is_active"]:
        duplicate = await db.scalar(
            select(ProductVariant.id)
            .where(
                func.lower(ProductVariant.sku) == merged["sku"].lower(),
                ProductVariant.is_active.is_(True),
                ProductVariant.id != variant_id if variant_id else True,
            )
            .limit(1)
        )
        if duplicate:
            conflict("sku", "An active variant already uses this SKU", "duplicate_sku")
    siblings = (await db.scalars(select(ProductVariant).where(ProductVariant.product_id == product_id))).all()
    if any(
        other.id != variant_id and option_key({field: getattr(other, field) for field in fields}) == key
        for other in siblings
    ):
        conflict("attributes", "A variant already uses these options", "duplicate_options")
    if variant is not None:
        changed = any(getattr(variant, field) != value for field, value in values.items())
        if changed and await cart_count(db, variant_id) and not confirmed:
            conflict("confirm_cart_impact", "This variant is in saved carts; confirm the change", "cart_impact")
        for field, value in values.items():
            setattr(variant, field, value)
    else:
        variant = ProductVariant(**values, stock=0)
    product.version += 1
    db.add(variant)
    return await commit(db, variant, "sku")
