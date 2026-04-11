from decimal import Decimal
from uuid import uuid4

from app.core.database import DbSession
from app.models.order import Order, OrderItem
from app.schemas.order import GuestOrderCreate, OrderRead
from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import select

router = APIRouter(prefix="/orders", tags=["public-orders"])


def _generate_order_code() -> str:
    return f"ODR-{uuid4().hex[:12].upper()}"


@router.post("/guest", response_model=OrderRead, status_code=status.HTTP_201_CREATED)
async def create_guest_order(payload: GuestOrderCreate, db: DbSession) -> Order:
    if not payload.items:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Order items are required")

    total_amount = sum((item.unit_price * item.quantity for item in payload.items), Decimal("0"))
    order = Order(
        order_code=_generate_order_code(),
        contact_phone=payload.contact_phone,
        total_amount=total_amount,
    )
    db.add(order)
    await db.flush()

    for item in payload.items:
        db.add(
            OrderItem(
                order_id=order.id,
                product_id=item.product_id,
                variant_id=item.variant_id,
                quantity=item.quantity,
                unit_price=item.unit_price,
            )
        )

    await db.commit()
    await db.refresh(order)
    return order


@router.get("/track", response_model=OrderRead)
async def track_order(
    db: DbSession,
    order_code: str = Query(..., min_length=5),
    contact_phone: str = Query(..., min_length=6),
) -> Order:
    stmt = select(Order).where(
        Order.order_code == order_code,
        Order.contact_phone == contact_phone,
        Order.is_active.is_(True),
    )
    result = await db.execute(stmt)
    order = result.scalar_one_or_none()
    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    return order
