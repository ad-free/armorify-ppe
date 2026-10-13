"""One authoritative pricing and inventory path for guest and signed-in checkout."""

import hashlib
import json
from collections import Counter
from datetime import datetime, timezone
from decimal import ROUND_HALF_UP, Decimal, InvalidOperation
from uuid import UUID, uuid4

from app.core.inventory import adjust_inventory
from app.core.settings import settings
from app.models.flash_sale import FlashSale, FlashSaleItem
from app.models.order import Order, OrderItem, OrderStatus
from app.models.product import Product, ProductVariant
from app.schemas.order import (
    CheckoutCreate,
    CheckoutQuote,
    CheckoutQuoteItem,
    CheckoutQuoteRequest,
)
from fastapi import HTTPException
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

CENT = Decimal("0.01")
MAX_MONEY = Decimal("9999999999.99")
SHIPPING_MESSAGE = "Phí vận chuyển chưa được cấu hình. Vui lòng liên hệ cửa hàng."


def checkout_error(status: int, field: str | list, message: str, kind: str) -> HTTPException:
    loc = ["body", *(field if isinstance(field, list) else [field])]
    return HTTPException(status_code=status, detail=[{"loc": loc, "msg": message, "type": kind}])


def _hash(value) -> str:
    return hashlib.sha256(
        json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()
    ).hexdigest()


def _money(value) -> Decimal:
    try:
        amount = Decimal(str(value))
        if not amount.is_finite() or amount <= 0 or amount > MAX_MONEY:
            raise ValueError("Invalid price")
        amount = amount.quantize(CENT, rounding=ROUND_HALF_UP)
        if amount <= 0:
            raise ValueError("Invalid price")
        return amount
    except (InvalidOperation, TypeError):
        raise ValueError("Invalid price") from None


async def _catalog(db: AsyncSession, payload: CheckoutQuoteRequest, lock: bool):
    ids = sorted({item.product_id for item in payload.items}, key=str)
    products_stmt = select(Product).where(Product.id.in_(ids)).order_by(Product.id)
    if lock:
        products_stmt = products_stmt.with_for_update(of=Product)
    products = {p.id: p for p in (await db.execute(products_stmt.execution_options(populate_existing=True))).scalars()}
    variants_stmt = select(ProductVariant).where(ProductVariant.product_id.in_(ids)).order_by(ProductVariant.id)
    if lock:
        variants_stmt = variants_stmt.with_for_update()
    variants = list((await db.execute(variants_stmt.execution_options(populate_existing=True))).scalars())
    # Lock promotions in a deterministic order before evaluating their dates/prices.
    sales_stmt = (
        select(FlashSale).join(FlashSaleItem).where(FlashSaleItem.product_id.in_(ids)).distinct().order_by(FlashSale.id)
    )
    if lock:
        # PostgreSQL disallows FOR UPDATE with DISTINCT; use an IN subquery instead.
        sales_stmt = (
            select(FlashSale)
            .where(FlashSale.id.in_(select(FlashSaleItem.flash_sale_id).where(FlashSaleItem.product_id.in_(ids))))
            .order_by(FlashSale.id)
            .with_for_update()
        )
    sales = list((await db.execute(sales_stmt.execution_options(populate_existing=True))).scalars())
    promos_stmt = select(FlashSaleItem).where(FlashSaleItem.product_id.in_(ids)).order_by(FlashSaleItem.id)
    if lock:
        promos_stmt = promos_stmt.with_for_update()
    promos = list((await db.execute(promos_stmt.execution_options(populate_existing=True))).scalars())
    return products, variants, sales, promos


def _evaluate(payload, products, variants, sales, promos) -> CheckoutQuote:
    now = datetime.now(timezone.utc)
    active_sales = {s.id: s for s in sales if s.is_active and s.start_at <= now < s.end_at}
    promotions: dict[UUID, FlashSaleItem] = {}
    for promo in sorted(
        (p for p in promos if p.is_active and p.flash_sale_id in active_sales),
        key=lambda p: (
            active_sales[p.flash_sale_id].end_at,
            str(p.flash_sale_id),
            str(p.id),
        ),
    ):
        promotions.setdefault(promo.product_id, promo)
    by_id = {v.id: v for v in variants}
    variant_products = {v.product_id for v in variants}
    quantities: Counter[tuple[UUID, UUID | None]] = Counter()
    for item in payload.items:
        quantities[(item.product_id, item.variant_id)] += item.quantity
    lines = []
    subtotal = Decimal("0.00")
    discount = Decimal("0.00")
    for item in payload.items:
        line = CheckoutQuoteItem(**item.model_dump())
        product = products.get(item.product_id)
        variant = by_id.get(item.variant_id) if item.variant_id else None
        if product is None or not product.is_active:
            line.issue = "Sản phẩm không còn khả dụng."
        elif item.variant_id and (variant is None or not variant.is_active or variant.product_id != product.id):
            line.issue = "Lựa chọn sản phẩm không còn khả dụng."
        elif not item.variant_id and product.id in variant_products:
            line.issue = "Vui lòng chọn biến thể sản phẩm."
        else:
            try:
                base = _money(
                    variant.price_override if variant and variant.price_override is not None else product.price
                )
                unit = base
                promo = promotions.get(product.id)
                if promo:
                    percent = Decimal(str(promo.discount_percent))
                    if not percent.is_finite() or not 0 <= percent <= 100:
                        raise ValueError("Invalid discount")
                    fixed = _money(promo.sale_price) if promo.sale_price is not None else None
                    if percent > 0:
                        unit = (base * (100 - percent) / 100).quantize(CENT, rounding=ROUND_HALF_UP)
                    elif fixed is not None:
                        unit = min(base, fixed)
                line.product_name = product.name
                line.slug = product.slug
                line.image_url = product.cover_image_url
                line.sku = variant.sku if variant else None
                line.attributes = dict(variant.attributes) if variant and isinstance(variant.attributes, dict) else {}
                if variant:
                    if variant.size:
                        line.attributes["size"] = variant.size
                    if variant.color:
                        line.attributes["color"] = variant.color
                line.stock = variant.stock if variant else product.stock
                line.base_price = base
                line.unit_price = unit
                line.line_total = unit * item.quantity
                subtotal += base * item.quantity
                discount += (base - unit) * item.quantity
                if quantities[(item.product_id, item.variant_id)] > line.stock:
                    line.issue = "Số lượng vượt quá tồn kho hiện có."
            except (ValueError, InvalidOperation):
                line.issue = "Giá sản phẩm chưa hợp lệ. Vui lòng liên hệ cửa hàng."
        lines.append(line)
    shipping = settings.checkout_shipping_fee
    threshold = settings.checkout_free_shipping_threshold
    if shipping is not None and threshold is not None and subtotal - discount >= threshold:
        shipping = Decimal("0.00")
    valid = all(line.issue is None for line in lines)
    total = subtotal - discount + shipping if shipping is not None else None
    if subtotal > MAX_MONEY or (total is not None and total > MAX_MONEY):
        lines[0].issue = "Giá trị đơn hàng vượt quá giới hạn cho phép."
        valid = False
    token = (
        _hash(
            {
                "items": [
                    {
                        "product_id": str(line.product_id),
                        "variant_id": str(line.variant_id) if line.variant_id else None,
                        "quantity": line.quantity,
                        "base_price": str(line.base_price),
                        "unit_price": str(line.unit_price),
                    }
                    for line in lines
                ],
                "shipping": str(shipping),
            }
        )
        if valid and shipping is not None
        else None
    )
    return CheckoutQuote(
        items=lines,
        subtotal=subtotal,
        discount=discount,
        shipping=shipping,
        total=total,
        pricing_token=token,
        can_checkout=valid and shipping is not None,
        shipping_message=SHIPPING_MESSAGE if shipping is None else None,
    )


async def quote_checkout(db: AsyncSession, payload: CheckoutQuoteRequest) -> CheckoutQuote:
    return _evaluate(payload, *await _catalog(db, payload, False))


async def create_checkout(db: AsyncSession, payload: CheckoutCreate, user_id: UUID | None = None) -> Order:
    request_hash = _hash(
        {
            "owner": str(user_id) if user_id else None,
            "payload": payload.model_dump(mode="json", exclude={"idempotency_key"}),
        }
    )
    # Auth may already have autobegun this session. Own that transaction rather than
    # nesting begin(), so locks, stock and order commit or roll back together.
    try:
        advisory_key = int.from_bytes(
            hashlib.sha256(payload.idempotency_key.bytes).digest()[:8],
            "big",
            signed=True,
        )
        await db.execute(text("SELECT pg_advisory_xact_lock(:key)"), {"key": advisory_key})
        existing = (
            await db.execute(
                select(Order).where(Order.idempotency_key == payload.idempotency_key).options(selectinload(Order.items))
            )
        ).scalar_one_or_none()
        if existing is not None:
            if existing.checkout_payload_hash != request_hash or existing.user_id != user_id:
                raise checkout_error(
                    409,
                    "idempotency_key",
                    "Mã gửi đơn đã được sử dụng cho yêu cầu khác.",
                    "idempotency_conflict",
                )
            await db.commit()
            return existing
        catalog = await _catalog(db, payload, True)
        quote = _evaluate(payload, *catalog)
        if quote.shipping is None:
            raise checkout_error(503, "shipping_method", SHIPPING_MESSAGE, "shipping_unavailable")
        for index, line in enumerate(quote.items):
            if line.issue:
                field = (
                    "quantity"
                    if line.unit_price is not None
                    else "variant_id"
                    if line.variant_id or line.product_id in {v.product_id for v in catalog[1]}
                    else "product_id"
                )
                raise checkout_error(409, ["items", index, field], line.issue, "checkout_unavailable")
        if quote.pricing_token != payload.pricing_token:
            raise checkout_error(
                409,
                "pricing_token",
                "Giá hoặc phí vận chuyển đã thay đổi. Vui lòng kiểm tra lại đơn hàng.",
                "stale_pricing",
            )
        order = Order(
            order_code=f"ODR-{uuid4().hex.upper()}",
            user_id=user_id,
            idempotency_key=payload.idempotency_key,
            checkout_payload_hash=request_hash,
            subtotal=quote.subtotal,
            discount=quote.discount,
            shipping=quote.shipping,
            total_amount=quote.total,
            payment_status="unpaid",
            fulfillment_status="unfulfilled",
            **payload.model_dump(exclude={"items", "idempotency_key", "pricing_token"}),
        )
        order.items = []
        # Persist the order before its inventory audit rows reference it.
        db.add(order)
        await db.flush()
        for line in quote.items:
            await adjust_inventory(
                db,
                line.product_id,
                line.variant_id,
                -line.quantity,
                "checkout",
                order_id=order.id,
                reason="Checkout reservation",
            )
            order.items.append(
                OrderItem(
                    product_id=line.product_id,
                    variant_id=line.variant_id,
                    quantity=line.quantity,
                    unit_price=line.unit_price,
                    product_name=line.product_name,
                    sku=line.sku,
                    attributes=line.attributes,
                )
            )
        await db.flush()
        await db.commit()
        return order
    except Exception:
        await db.rollback()
        raise


async def cancel_checkout(
    db: AsyncSession,
    order_id: UUID,
    user_id: UUID | None,
    *,
    commit: bool = True,
    actor_id: UUID | None = None,
    metadata: dict | None = None,
) -> Order:
    """Void an unfulfilled COD reservation once; unknown historical stock stays untouched."""
    from app.core.order_workflow import has_checkout_snapshot, order_state, record_order_event

    try:
        event_actor_id = actor_id or user_id
        if event_actor_id is None:
            raise ValueError("Cancellation requires an audit actor")
        order = (
            await db.execute(
                select(Order)
                .where(Order.id == order_id, Order.user_id == user_id, Order.is_active.is_(True))
                .options(selectinload(Order.items))
                .with_for_update(of=Order)
                .execution_options(populate_existing=True)
            )
        ).scalar_one_or_none()
        if order is None:
            raise HTTPException(status_code=404, detail="Order not found")
        reserved = has_checkout_snapshot(order)
        if (
            reserved
            and order.status == OrderStatus.CANCELLED
            and order.payment_status == "cancelled"
            and order.fulfillment_status == "cancelled"
        ):
            if commit:
                await db.commit()
            return order
        if (
            not reserved
            or not order.items
            or order.status not in (OrderStatus.PENDING, OrderStatus.CONFIRMED)
            or order.payment_method != "cod"
            or order.payment_status != "unpaid"
            or order.fulfillment_status != "unfulfilled"
        ):
            raise checkout_error(
                409,
                "status",
                "Đơn hàng không thể hủy ở trạng thái hiện tại.",
                "cancellation_ineligible",
            )
        previous = order_state(order)
        products = {
            product.id: product
            for product in (
                await db.execute(
                    select(Product)
                    .where(Product.id.in_({item.product_id for item in order.items}))
                    .order_by(Product.id)
                    .with_for_update(of=Product)
                    .execution_options(populate_existing=True)
                )
            ).scalars()
        }
        variants = {
            variant.id: variant
            for variant in (
                await db.execute(
                    select(ProductVariant)
                    .where(ProductVariant.id.in_({item.variant_id for item in order.items if item.variant_id}))
                    .order_by(ProductVariant.id)
                    .with_for_update()
                    .execution_options(populate_existing=True)
                )
            ).scalars()
        }
        quantities: Counter[tuple[UUID, UUID | None]] = Counter()
        inventory = {}
        for item in order.items:
            target = variants.get(item.variant_id) if item.variant_id else products.get(item.product_id)
            if (
                item.product_id not in products
                or target is None
                or item.quantity <= 0
                or (isinstance(target, ProductVariant) and target.product_id != item.product_id)
            ):
                raise checkout_error(
                    409,
                    "status",
                    "Không thể hoàn lại tồn kho an toàn. Vui lòng liên hệ hỗ trợ.",
                    "restock_unavailable",
                )
            key = (item.product_id, item.variant_id)
            quantities[key] += item.quantity
            inventory[key] = target
        for key, quantity in quantities.items():
            target = inventory[key]
            if target.stock < 0 or target.stock + quantity > 2_147_483_647:
                raise checkout_error(
                    409,
                    "status",
                    "Không thể hoàn lại tồn kho an toàn. Vui lòng liên hệ hỗ trợ.",
                    "restock_unavailable",
                )
        for key, quantity in sorted(quantities.items(), key=lambda item: (str(item[0][0]), str(item[0][1]))):
            await adjust_inventory(
                db,
                key[0],
                key[1],
                quantity,
                "cancellation",
                order_id=order.id,
                admin_actor_id=event_actor_id,
                reason="Order cancellation",
            )
        order.status = OrderStatus.CANCELLED
        order.payment_status = "cancelled"
        order.fulfillment_status = "cancelled"
        record_order_event(db, order, event_actor_id, "cancel", previous, metadata or {})
        if commit:
            await db.commit()
        else:
            await db.flush()
        await db.refresh(order, attribute_names=["updated_at"])
        return order
    except Exception:
        await db.rollback()
        raise
