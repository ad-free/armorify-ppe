"""Versioned administration of immutable checkout snapshots and internal audit evidence."""

from uuid import UUID

from app.core.checkout import checkout_error
from app.models.order import Order, OrderEvent, OrderStatus
from app.schemas.admin_order import AdminOrderAction, AdminOrderRead, AllowedOrderAction, OrderEventRead
from app.schemas.order import OrderRead
from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

ACTIONS = ("confirm", "process", "ship", "deliver", "pay", "cancel", "tracking", "note")


def order_state(order: Order) -> dict:
    return {
        "status": order.status.value,
        "payment_status": order.payment_status,
        "fulfillment_status": order.fulfillment_status,
    }


def has_checkout_snapshot(order: Order) -> bool:
    return bool(
        order.idempotency_key
        and order.checkout_payload_hash
        and len(order.checkout_payload_hash) == 64
        and all(character in "0123456789abcdef" for character in order.checkout_payload_hash)
        and all(
            getattr(order, field) and getattr(order, field).strip()
            for field in ("customer_name", "contact_phone", "province", "district", "ward", "address")
        )
        and order.shipping_method == "standard"
        and order.payment_method == "cod"
        and order.subtotal is not None
        and order.discount is not None
        and order.shipping is not None
        and all(getattr(order, field).is_finite() for field in ("subtotal", "discount", "shipping", "total_amount"))
        and order.subtotal >= 0
        and 0 <= order.discount <= order.subtotal
        and order.shipping >= 0
        and order.total_amount == order.subtotal - order.discount + order.shipping
        and order.items
        and all(
            item.product_name
            and item.product_name.strip()
            and isinstance(item.attributes, dict)
            and (item.variant_id is None or (item.sku and item.sku.strip()))
            and item.quantity > 0
            and item.unit_price.is_finite()
            and item.unit_price >= 0
            for item in order.items
        )
        and sum(item.quantity * item.unit_price for item in order.items) == order.subtotal - order.discount
    )


def action_reason(order: Order, action: str) -> str | None:
    if action == "note":
        return None
    if action == "tracking":
        if (
            order.status in (OrderStatus.SHIPPED, OrderStatus.DELIVERED)
            and order.fulfillment_status == order.status.value
        ):
            return None
        return "Tracking can only be edited for a shipped or delivered order."
    if not has_checkout_snapshot(order):
        return "This order has incomplete or unproven checkout snapshots; state changes are unavailable."
    if order.payment_status not in ("unpaid", "paid"):
        return "The payment state is unknown or cancelled."
    status, fulfillment = order.status, order.fulfillment_status
    valid = {
        "confirm": status == OrderStatus.PENDING and fulfillment == "unfulfilled",
        "process": status == OrderStatus.CONFIRMED and fulfillment == "unfulfilled",
        "ship": status == OrderStatus.CONFIRMED and fulfillment == "processing",
        "deliver": status == OrderStatus.SHIPPED and fulfillment == "shipped",
        "pay": status != OrderStatus.CANCELLED
        and order.payment_status == "unpaid"
        and (status, fulfillment)
        in {
            (OrderStatus.PENDING, "unfulfilled"),
            (OrderStatus.CONFIRMED, "unfulfilled"),
            (OrderStatus.CONFIRMED, "processing"),
            (OrderStatus.SHIPPED, "shipped"),
            (OrderStatus.DELIVERED, "delivered"),
        },
        "cancel": status in (OrderStatus.PENDING, OrderStatus.CONFIRMED)
        and fulfillment == "unfulfilled"
        and order.payment_status == "unpaid",
    }
    return None if valid.get(action, False) else "This action is not allowed in the current order state."


def record_order_event(
    db: AsyncSession, order: Order, actor_id: UUID, action: str, previous: dict, metadata: dict
) -> None:
    order.version += 1
    order.updated_at = func.clock_timestamp()
    db.add(
        OrderEvent(
            order_id=order.id,
            actor_id=actor_id,
            event_type=action,
            previous_state=previous,
            new_state=order_state(order),
            event_metadata=metadata,
        )
    )


async def load_order(db: AsyncSession, order_id: UUID, *, lock: bool = False) -> Order:
    stmt = (
        select(Order)
        .where(Order.id == order_id, Order.is_active.is_(True))
        .options(selectinload(Order.items), selectinload(Order.events))
        .execution_options(populate_existing=True)
    )
    if lock:
        stmt = stmt.with_for_update(of=Order)
    order = (await db.execute(stmt)).scalar_one_or_none()
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


def order_detail(order: Order) -> AdminOrderRead:
    snapshot = OrderRead.model_validate(order).model_dump()
    return AdminOrderRead(
        **snapshot,
        carrier_name=order.carrier_name,
        tracking_number=order.tracking_number,
        shipped_at=order.shipped_at,
        delivered_at=order.delivered_at,
        version=order.version,
        allowed_actions=[
            AllowedOrderAction(action=action, allowed=(reason := action_reason(order, action)) is None, reason=reason)
            for action in ACTIONS
        ],
        events=[
            OrderEventRead(
                id=event.id,
                actor_id=event.actor_id,
                event_type=event.event_type,
                previous_state=event.previous_state,
                new_state=event.new_state,
                metadata={
                    key: value
                    for key, value in event.event_metadata.items()
                    if key in {"note", "carrier_name", "tracking_number"}
                },
                created_at=event.created_at,
            )
            for event in order.events
        ],
    )


async def apply_order_action(db: AsyncSession, order_id: UUID, payload: AdminOrderAction, actor_id: UUID) -> Order:
    try:
        order = await load_order(db, order_id, lock=True)
        if order.version != payload.expected_version:
            raise checkout_error(409, "expected_version", "Order changed; reload before trying again.", "stale_version")
        reason = action_reason(order, payload.action)
        if reason:
            raise checkout_error(409, "action", reason, "invalid_transition")
        previous = order_state(order)
        metadata = payload.model_dump(exclude_unset=True, exclude={"action", "expected_version"})
        if payload.action == "cancel":
            from app.core.checkout import cancel_checkout

            await cancel_checkout(db, order.id, order.user_id, commit=False, actor_id=actor_id, metadata=metadata)
        else:
            if payload.action == "confirm":
                order.status = OrderStatus.CONFIRMED
            elif payload.action == "process":
                order.fulfillment_status = "processing"
            elif payload.action == "ship":
                order.status = OrderStatus.SHIPPED
                order.fulfillment_status = "shipped"
                order.shipped_at = func.clock_timestamp()
            elif payload.action == "deliver":
                order.status = OrderStatus.DELIVERED
                order.fulfillment_status = "delivered"
                order.delivered_at = func.clock_timestamp()
            elif payload.action == "pay":
                order.payment_status = "paid"
            if payload.action in {"ship", "tracking"}:
                for field in ("carrier_name", "tracking_number"):
                    if field in payload.model_fields_set:
                        setattr(order, field, getattr(payload, field))
            record_order_event(db, order, actor_id, payload.action, previous, metadata)
        await db.commit()
        return await load_order(db, order_id)
    except Exception:
        await db.rollback()
        raise
