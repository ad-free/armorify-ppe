# app/routers/public/reviews.py
from uuid import UUID

from fastapi import APIRouter, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import selectinload

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
        (
            await db.execute(
                select(Review)
                .where(*where)
                .options(selectinload(Review.user))
                .order_by(Review.created_at.desc())
                .offset(skip)
                .limit(limit)
            )
        )
        .scalars()
        .all()
    )

    reviews_read_response = []
    for row in rows:
        data = ReviewRead.model_validate(row)
        # Add placeholder avatar based on name
        data.author_avatar = f"https://ui-avatars.com/api/?name={row.author_name}&background=random&color=fff&size=128"
        reviews_read_response.append(data)

    # Calculate distribution
    dist_stmt = select(Review.rating, func.count(Review.id)).where(*where).group_by(Review.rating)
    dist_result = await db.execute(dist_stmt)
    distribution = {str(r): 0 for r in range(1, 6)}
    for r, count in dist_result.all():
        distribution[str(r)] = count

    return PaginatedResponse(
        items=reviews_read_response, total=total, skip=skip, limit=limit, extra={"distribution": distribution}
    )


@router.post("/{product_id}/reviews", response_model=ReviewRead, status_code=status.HTTP_201_CREATED)
async def create_review(
    product_id: UUID,
    payload: ReviewCreate,
    db: DbSession,
    current_user: CurrentUser,
) -> Review:
    # Use current user's name if author_name is not provided or always use it for consistency
    author_name = f"{current_user.firstname} {current_user.lastname}"

    instance = Review(
        **payload.model_dump(exclude={"author_name"}),
        author_name=author_name,
        product_id=product_id,
        user_id=current_user.id,
        is_approved=False,
    )
    db.add(instance)
    await db.commit()
    await db.refresh(instance)
    return instance
