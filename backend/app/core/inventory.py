"""Stock and its movement are one transaction; the caller owns commit/rollback."""

from uuid import UUID

from app.models.inventory import InventoryMovement
from app.models.product import Product, ProductVariant
from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

MAX_STOCK = 2_147_483_647
MIN_DELTA = -2_147_483_648


def inventory_error(status: int, field: str, message: str, kind: str) -> HTTPException:
    return HTTPException(status_code=status, detail=[{"loc": ["body", field], "msg": message, "type": kind}])


async def adjust_inventory(
    db: AsyncSession,
    product_id: UUID,
    variant_id: UUID | None,
    quantity_delta: int,
    source_type: str,
    order_id: UUID | None = None,
    admin_actor_id: UUID | None = None,
    reason: str = "",
) -> InventoryMovement:
    if type(quantity_delta) is not int or not MIN_DELTA <= quantity_delta <= MAX_STOCK or quantity_delta == 0:
        raise inventory_error(
            422, "quantity_delta", "A nonzero signed 32-bit integer is required.", "inventory_delta_invalid"
        )
    if not isinstance(reason, str) or not reason.strip() or len(reason.strip()) > 1000:
        raise inventory_error(422, "reason", "A reason of 1–1000 characters is required.", "inventory_reason_invalid")
    if source_type not in {"admin_adjustment", "checkout", "cancellation"}:
        raise inventory_error(422, "source_type", "Invalid inventory source.", "inventory_source_invalid")
    if (
        (source_type == "admin_adjustment" and (admin_actor_id is None or order_id is not None))
        or (source_type == "checkout" and (order_id is None or quantity_delta >= 0))
        or (source_type == "cancellation" and (order_id is None or quantity_delta <= 0))
    ):
        raise inventory_error(422, "source_type", "Invalid inventory source context.", "inventory_source_invalid")
    # All workflows take product locks before variant locks. Multi-product callers
    # acquire their entire product set in UUID order before entering this service.
    product = (
        await db.execute(
            select(Product)
            .where(Product.id == product_id)
            .with_for_update(of=Product)
            .execution_options(populate_existing=True)
        )
    ).scalar_one_or_none()
    if product is None:
        raise inventory_error(409, "product_id", "Product is unavailable.", "inventory_owner_invalid")
    target = product
    if variant_id is not None:
        target = (
            await db.execute(
                select(ProductVariant)
                .where(ProductVariant.id == variant_id, ProductVariant.product_id == product_id)
                .with_for_update()
                .execution_options(populate_existing=True)
            )
        ).scalar_one_or_none()
        if target is None or target.product_id != product_id:
            raise inventory_error(
                409, "variant_id", "Variant does not belong to this product.", "inventory_owner_invalid"
            )
    if source_type == "checkout" and (not product.is_active or (variant_id is not None and not target.is_active)):
        raise inventory_error(
            409, "variant_id" if variant_id else "product_id", "Inventory is unavailable.", "inventory_owner_invalid"
        )
    if source_type != "cancellation" and variant_id is None:
        # A separate statement sees variant changes committed while the product lock waited.
        has_variants = await db.scalar(
            select(select(ProductVariant.id).where(ProductVariant.product_id == product_id).exists())
        )
        if has_variants:
            raise inventory_error(409, "variant_id", "Select a variant to adjust inventory.", "inventory_owner_invalid")
    balance = target.stock + quantity_delta
    if target.stock < 0 or not 0 <= balance <= MAX_STOCK:
        raise inventory_error(
            409,
            "quantity_delta",
            "Adjustment would create a negative or overflowing balance.",
            "inventory_balance_invalid",
        )
    target.stock = balance
    product.version += 1
    movement = InventoryMovement(
        product_id=product_id,
        variant_id=variant_id,
        quantity_delta=quantity_delta,
        resulting_balance=balance,
        source_type=source_type,
        order_id=order_id,
        admin_actor_id=admin_actor_id,
        reason=reason.strip(),
    )
    db.add(movement)
    await db.flush()
    # Computed properties otherwise retain the balance from the locking SELECT.
    await db.refresh(product, attribute_names=["has_variants", "available_stock", "stock_status"])
    return movement
