from uuid import UUID

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select

from app.core.database import DbSession
from app.models.quote import QuoteRequest, QuoteStatus
from app.schemas.quote import QuoteRequestRead

router = APIRouter(prefix="/admin/quotes", tags=["admin-quotes"])


class QuoteStatusUpdate(BaseModel):
    status: QuoteStatus


@router.get("/requests", response_model=list[QuoteRequestRead])
async def list_quote_requests(db: DbSession) -> list[QuoteRequest]:
    stmt = select(QuoteRequest).where(QuoteRequest.is_active.is_(True))
    result = await db.execute(stmt)
    return list(result.scalars().all())


@router.patch("/requests/{request_id}/status", response_model=QuoteRequestRead)
async def update_quote_status(request_id: UUID, payload: QuoteStatusUpdate, db: DbSession) -> QuoteRequest:
    request = await db.get(QuoteRequest, request_id)
    if request is None or not request.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quote request not found")
    request.status = payload.status
    db.add(request)
    await db.commit()
    await db.refresh(request)
    return request
