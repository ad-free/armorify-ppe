# app/routers/admin/reviews.py
from decimal import Decimal
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import selectinload

from app.core.database import DbSession
from app.core.deps import require_staff
from app.crud.crud_review import review_crud
from app.models.product import Product
from app.models.review import Review
from app.schemas.review import ReviewRead, ReviewUpdate

router = APIRouter(
    prefix="/admin/reviews",
    tags=["admin-reviews"],
    dependencies=[Depends(require_staff)],
)


@router.post("/sync-all-ratings")
async def sync_all_ratings(db: DbSession):
    # Get all product IDs that have reviews
    stmt = select(Review.product_id).distinct()
    result = await db.execute(stmt)
    product_ids = result.scalars().all()

    updated_count = 0
    for pid in product_ids:
        stats_stmt = select(func.count(Review.id).label("count"), func.avg(Review.rating).label("avg")).where(
            Review.product_id == pid, Review.is_approved.is_(True), Review.is_active.is_(True)
        )
        stats = (await db.execute(stats_stmt)).first()

        if stats:
            count = int(stats[0] or 0)
            average = Decimal(stats[1] or 0)
            product = (await db.execute(select(Product).where(Product.id == pid))).scalar_one_or_none()
            if product:
                product.rating_count = count
                product.rating_avg = average
                db.add(product)
                updated_count += 1

    await db.commit()
    return {"message": f"Successfully updated ratings for {updated_count} products"}


@router.get("/", response_model=list[ReviewRead])
async def list_reviews(
    db: DbSession,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    is_approved: Optional[bool] = None,
) -> list[ReviewRead]:
    stmt = select(Review).options(selectinload(Review.product)).order_by(Review.created_at.desc())
    if is_approved is not None:
        stmt = stmt.where(Review.is_approved.is_(is_approved))

    result = await db.execute(stmt.offset(skip).limit(limit))
    rows = result.scalars().all()

    # Map product info to the response
    results = []
    for row in rows:
        data = ReviewRead.model_validate(row)
        if row.product:
            data.product_name = row.product.name
            data.product_image = row.product.cover_image_url
        results.append(data)

    return results


@router.patch("/{review_id}/approve", response_model=ReviewRead)
async def approve_review(review_id: UUID, db: DbSession) -> Review:
    review = await review_crud.approve(db, review_id)
    if review is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found")
    return review


@router.put("/{review_id}", response_model=ReviewRead)
async def update_review(review_id: UUID, payload: ReviewUpdate, db: DbSession) -> Review:
    review = await review_crud.update(db, review_id, payload)
    if review is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found")
    return review


@router.delete("/{review_id}", response_model=ReviewRead)
async def delete_review(review_id: UUID, db: DbSession) -> Review:
    review = await review_crud.soft_delete(db, review_id)
    if review is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found")
    return review
