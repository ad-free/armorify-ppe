from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.checkout import create_checkout, quote_checkout
from app.core.database import DbSession
from app.core.deps import get_current_user
from app.models.order import Order
from app.models.user import User
from app.schemas.order import CheckoutCreate, CheckoutQuote, CheckoutQuoteRequest, OrderRead

router = APIRouter(prefix="/orders", tags=["public-orders"])
_bearer = HTTPBearer(auto_error=False)


async def _try_get_user(
    db: DbSession,
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
) -> User | None:
    if credentials is None:
        return None
    # An explicitly supplied identity must be valid; never silently downgrade
    # an authenticated retry into a differently-owned guest order.
    try:
        return await get_current_user(db, credentials)
    except (ValueError, TypeError):
        raise HTTPException(status_code=401, detail="Invalid token") from None


@router.post("/quote", response_model=CheckoutQuote)
async def quote_order(payload: CheckoutQuoteRequest, db: DbSession) -> CheckoutQuote:
    return await quote_checkout(db, payload)


@router.post("/guest", response_model=OrderRead, status_code=status.HTTP_201_CREATED)
async def create_guest_order(
    payload: CheckoutCreate,
    db: DbSession,
    current_user: User | None = Depends(_try_get_user),
) -> Order:
    return await create_checkout(db, payload, current_user.id if current_user else None)


@router.get("/track", response_model=OrderRead)
async def track_order(
    db: DbSession,
    order_code: str = Query(..., min_length=5, max_length=64),
    contact_phone: str = Query(..., min_length=6, max_length=32),
) -> Order:
    result = await db.execute(
        select(Order)
        .where(Order.order_code == order_code.strip(), Order.contact_phone == contact_phone.strip(), Order.is_active.is_(True))
        .options(selectinload(Order.items))
    )
    order = result.scalar_one_or_none()
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    return order
