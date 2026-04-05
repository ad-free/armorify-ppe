# app/routers/quotes.py
from typing import List
from uuid import UUID

from app.core.database import get_db
from app.models.quote import QuoteItem, QuoteRequest
from app.schemas.quote import (
    QuoteItemCreate,
    QuoteItemRead,
    QuoteItemUpdate,
    QuoteRequestCreate,
    QuoteRequestRead,
    QuoteRequestUpdate,
)
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/quotes", tags=["quotes"])


@router.get("/requests", response_model=List[QuoteRequestRead])
async def list_quote_requests(db: AsyncSession = Depends(get_db)) -> List[QuoteRequest]:
    result = await db.execute(select(QuoteRequest).where(QuoteRequest.is_active.is_(True)))
    return result.scalars().all()


@router.post("/requests", response_model=QuoteRequestRead, status_code=status.HTTP_201_CREATED)
async def create_quote_request(request_in: QuoteRequestCreate, db: AsyncSession = Depends(get_db)) -> QuoteRequest:
    quote_request = QuoteRequest(**request_in.model_dump())
    db.add(quote_request)
    await db.commit()
    await db.refresh(quote_request)
    return quote_request


@router.get("/requests/{request_id}", response_model=QuoteRequestRead)
async def get_quote_request(request_id: UUID, db: AsyncSession = Depends(get_db)) -> QuoteRequest:
    quote_request = await db.get(QuoteRequest, request_id)
    if quote_request is None or not quote_request.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quote request not found")
    return quote_request


@router.put("/requests/{request_id}", response_model=QuoteRequestRead)
async def update_quote_request(
    request_id: UUID,
    request_update: QuoteRequestUpdate,
    db: AsyncSession = Depends(get_db)
) -> QuoteRequest:
    quote_request = await db.get(QuoteRequest, request_id)
    if quote_request is None or not quote_request.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quote request not found")
    data = request_update.model_dump(exclude_unset=True)
    for field, value in data.items():
        setattr(quote_request, field, value)
    db.add(quote_request)
    await db.commit()
    await db.refresh(quote_request)
    return quote_request


@router.delete("/requests/{request_id}", response_model=QuoteRequestRead)
async def soft_delete_quote_request(request_id: UUID, db: AsyncSession = Depends(get_db)) -> QuoteRequest:
    quote_request = await db.get(QuoteRequest, request_id)
    if quote_request is None or not quote_request.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quote request not found")
    quote_request.is_active = False
    db.add(quote_request)
    await db.commit()
    await db.refresh(quote_request)
    return quote_request


@router.get("/items", response_model=List[QuoteItemRead])
async def list_quote_items(db: AsyncSession = Depends(get_db)) -> List[QuoteItem]:
    result = await db.execute(select(QuoteItem).where(QuoteItem.is_active.is_(True)))
    return result.scalars().all()


@router.post("/items", response_model=QuoteItemRead, status_code=status.HTTP_201_CREATED)
async def create_quote_item(item_in: QuoteItemCreate, db: AsyncSession = Depends(get_db)) -> QuoteItem:
    item = QuoteItem(**item_in.model_dump())
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return item


@router.put("/items/{item_id}", response_model=QuoteItemRead)
async def update_quote_item(
    item_id: UUID,
    item_update: QuoteItemUpdate,
    db: AsyncSession = Depends(get_db)
) -> QuoteItem:
    item = await db.get(QuoteItem, item_id)
    if item is None or not item.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quote item not found")
    data = item_update.model_dump(exclude_unset=True)
    for field, value in data.items():
        setattr(item, field, value)
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return item


@router.delete("/items/{item_id}", response_model=QuoteItemRead)
async def soft_delete_quote_item(item_id: UUID, db: AsyncSession = Depends(get_db)) -> QuoteItem:
    item = await db.get(QuoteItem, item_id)
    if item is None or not item.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quote item not found")
    item.is_active = False
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return item
