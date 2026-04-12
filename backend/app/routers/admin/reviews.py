# app/routers/admin/reviews.py
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select

from app.core.database import DbSession
from app.core.deps import require_staff
from app.crud.crud_review import review_crud
from app.models.review import Review
from app.schemas.common import PaginatedResponse
from app.schemas.review import ReviewRead

router = APIRouter(
    prefix="/api/v1/admin/reviews",
    tags=["admin-reviews"],
    dependencies=[Depends(require_staff)],
)


@router.get("/", response_model=PaginatedResponse[ReviewRead])
async def list_reviews(
    db: DbSession,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
    is_approved: Optional[bool] = None,
) -> PaginatedResponse[ReviewRead]:
    stmt = select(Review).order_by(Review.created_at.desc())
    if is_approved is not None:
        stmt = stmt.where(Review.is_approved.is_(is_approved))
    total = (await db.execute(select(func.count()).select_from(stmt.subquery()))).scalar_one()
    rows = (await db.execute(stmt.offset(skip).limit(limit))).scalars().all()
    review_read_response = [ReviewRead.model_validate(row) for row in rows]
    return PaginatedResponse(items=review_read_response, total=total, skip=skip, limit=limit)


@router.patch("/{review_id}/approve", response_model=ReviewRead)
async def approve_review(review_id: UUID, db: DbSession) -> Review:
    review = await review_crud.approve(db, review_id)
    if review is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found")
    return review


@router.delete("/{review_id}", response_model=ReviewRead)
async def delete_review(review_id: UUID, db: DbSession) -> Review:
    review = await review_crud.soft_delete(db, review_id)
    if review is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found")
    return review
