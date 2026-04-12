# app/crud/crud_review.py
from uuid import UUID

from app.crud.base import CRUDBase
from app.models.review import Review
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession


class CRUDReview(CRUDBase[Review]):
    async def approve(self, db: AsyncSession, id: UUID) -> Review | None:
        instance = await self.get(db, id)
        if instance is None:
            return None
        instance.is_approved = True
        db.add(instance)
        await db.commit()
        await db.refresh(instance)
        return instance

    async def get_approved(self, db: AsyncSession, product_id: UUID) -> list[Review]:
        stmt = select(Review).where(
            Review.product_id == product_id,
            Review.is_approved.is_(True),
            Review.is_active.is_(True),
        )
        result = await db.execute(stmt)
        return list(result.scalars().all())


review_crud = CRUDReview(Review)
