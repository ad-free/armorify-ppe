from decimal import Decimal
from typing import Optional
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.database import DbSession
from app.core.settings import settings
from app.models.order import Order, OrderItem
from app.models.user import User
from app.schemas.order import GuestOrderCreate, OrderRead

router = APIRouter(prefix="/orders", tags=["public-orders"])

_bearer = HTTPBearer(auto_error=False)


def _generate_order_code() -> str:
    return f"ODR-{uuid4().hex[:12].upper()}"


async def _try_get_user(
    db: DbSession,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(_bearer),
) -> Optional[User]:
    """Optionally resolve the current user from Bearer token — does NOT raise if missing/invalid."""
    if credentials is None:
        return None
    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm],
        )
        user_id: str | None = payload.get("sub")
        if user_id is None:
            return None
        user = await db.get(User, user_id)
        return user if user and user.is_active else None
    except JWTError:
        return None


@router.post("/guest", response_model=OrderRead, status_code=status.HTTP_201_CREATED)
async def create_guest_order(
    payload: GuestOrderCreate,
    db: DbSession,
    current_user: Optional[User] = Depends(_try_get_user),
) -> Order:
    if not payload.items:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Order items are required")

    total_amount = sum((item.unit_price * item.quantity for item in payload.items), Decimal("0"))

    # Resolve customer name: prefer form value, fall back to user profile
    customer_name = payload.customer_name
    if not customer_name and current_user:
        customer_name = f"{current_user.firstname} {current_user.lastname}".strip()

    order = Order(
        order_code=_generate_order_code(),
        contact_phone=payload.contact_phone,
        customer_name=customer_name,
        total_amount=total_amount,
        user_id=current_user.id if current_user else None,
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

    # Re-fetch with relationships for proper serialization
    stmt = select(Order).where(Order.id == order.id).options(selectinload(Order.items).selectinload(OrderItem.product))
    result = await db.execute(stmt)
    return result.scalar_one()


@router.get("/track", response_model=OrderRead)
async def track_order(
    db: DbSession,
    order_code: str = Query(..., min_length=5),
    contact_phone: str = Query(..., min_length=6),
) -> Order:
    stmt = (
        select(Order)
        .where(
            Order.order_code == order_code,
            Order.contact_phone == contact_phone,
            Order.is_active.is_(True),
        )
        .options(selectinload(Order.items).selectinload(OrderItem.product))
    )
    result = await db.execute(stmt)
    order = result.scalar_one_or_none()
    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    return order
