from datetime import date, datetime, time, timezone
from typing import Annotated, Literal
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, or_, select
from sqlalchemy.sql.elements import ColumnElement

from app.core.checkout import checkout_error
from app.core.database import DbSession
from app.core.deps import require_admin
from app.core.order_workflow import apply_order_action, load_order, order_detail
from app.models.order import Order, OrderStatus
from app.models.user import User
from app.schemas.admin_order import AdminOrderAction, AdminOrderListItem, AdminOrderPage, AdminOrderRead

AdminUser = Annotated[User, Depends(require_admin)]
router = APIRouter(prefix="/admin/orders", tags=["admin-orders"], dependencies=[Depends(require_admin)])


@router.get("", response_model=AdminOrderPage)
async def list_orders(
    db: DbSession,
    search: str | None = Query(default=None, max_length=128),
    status: OrderStatus | None = None,
    payment_status: Literal["unpaid", "paid", "cancelled", "unknown"] | None = None,
    fulfillment_status: Literal["unfulfilled", "processing", "shipped", "delivered", "cancelled", "unknown"]
    | None = None,
    from_date: date | None = None,
    to_date: date | None = None,
    sort_by: Literal["created_at", "order_code", "total_amount"] = "created_at",
    sort_order: Literal["asc", "desc"] = "desc",
    page: int = Query(default=1, ge=1, le=1_000_000),
    page_size: int = Query(default=20, ge=1, le=100),
) -> AdminOrderPage:
    if from_date and to_date and from_date > to_date:
        raise checkout_error(422, "to_date", "End date must not precede start date.", "invalid_date_range")
    conditions: list[ColumnElement[bool]] = [Order.is_active.is_(True)]
    if search and search.strip():
        term = "%" + search.strip().replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%"
        conditions.append(
            or_(
                *(
                    column.ilike(term, escape="\\")
                    for column in (Order.order_code, Order.customer_name, Order.contact_phone)
                )
            )
        )
    if status is not None:
        conditions.append(Order.status == status)
    for column, value in ((Order.payment_status, payment_status), (Order.fulfillment_status, fulfillment_status)):
        if value is not None:
            conditions.append(column.is_(None) if value == "unknown" else column == value)
    if from_date:
        conditions.append(Order.created_at >= datetime.combine(from_date, time.min, timezone.utc))
    if to_date:
        conditions.append(Order.created_at <= datetime.combine(to_date, time.max, timezone.utc))
    total = await db.scalar(select(func.count()).select_from(Order).where(*conditions))
    columns = [
        Order.id,
        Order.order_code,
        Order.customer_name,
        Order.contact_phone,
        Order.total_amount,
        Order.status,
        Order.payment_status,
        Order.fulfillment_status,
        Order.created_at,
    ]
    sort = getattr(Order, sort_by)
    ordering = [sort.asc(), Order.id.asc()] if sort_order == "asc" else [sort.desc(), Order.id.desc()]
    rows = (
        (
            await db.execute(
                select(*columns).where(*conditions).order_by(*ordering).offset((page - 1) * page_size).limit(page_size)
            )
        )
        .mappings()
        .all()
    )
    return AdminOrderPage(
        items=[AdminOrderListItem.model_validate(row) for row in rows], total=total or 0, page=page, page_size=page_size
    )


@router.get("/{order_id}", response_model=AdminOrderRead)
async def get_order(order_id: UUID, db: DbSession) -> AdminOrderRead:
    return order_detail(await load_order(db, order_id))


@router.post("/{order_id}/actions", response_model=AdminOrderRead)
async def order_action(order_id: UUID, payload: AdminOrderAction, db: DbSession, actor: AdminUser) -> AdminOrderRead:
    return order_detail(await apply_order_action(db, order_id, payload, actor.id))
