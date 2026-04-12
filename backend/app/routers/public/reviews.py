# app/routers/public/reviews.py
from uuid import UUID

from fastapi import APIRouter, Query, status
from sqlalchemy import func, select

from app.core.database import DbSession
from app.core.deps import CurrentUser
from app.models.review import Review
from app.schemas.common import PaginatedResponse
from app.schemas.review import ReviewCreate, ReviewRead

router = APIRouter(prefix="/api/v1/catalog/products", tags=["public-reviews"])


@router.get("/{product_id}/reviews", response_model=PaginatedResponse[ReviewRead])
async def list_reviews(
    product_id: UUID,
    db: DbSession,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=10, ge=1, le=100),
) -> PaginatedResponse[ReviewRead]:
    where = [
        Review.product_id == product_id,
        Review.is_approved.is_(True),
        Review.is_active.is_(True),
    ]
    total = (await db.execute(select(func.count()).select_from(select(Review).where(*where).subquery()))).scalar_one()
    rows = (
        (await db.execute(select(Review).where(*where).order_by(Review.created_at.desc()).offset(skip).limit(limit)))
        .scalars()
        .all()
    )
    reviews_read_response = [ReviewRead.model_validate(row) for row in rows]
    return PaginatedResponse(items=reviews_read_response, total=total, skip=skip, limit=limit)


@router.post("/{product_id}/reviews", response_model=ReviewRead, status_code=status.HTTP_201_CREATED)
async def create_review(
    product_id: UUID,
    payload: ReviewCreate,
    db: DbSession,
    current_user: CurrentUser,
) -> Review:
    instance = Review(
        **payload.model_dump(),
        product_id=product_id,
        user_id=current_user.id,
        is_approved=False,
    )
    db.add(instance)
    await db.commit()
    await db.refresh(instance)
    return instance
