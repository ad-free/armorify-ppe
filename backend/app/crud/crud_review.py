# app/crud/crud_review.py
from decimal import Decimal
from uuid import UUID

from app.crud.base import CRUDBase
from app.models.product import Product
from app.models.review import Review
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession


class CRUDReview(CRUDBase[Review]):
    async def approve(self, db: AsyncSession, id: UUID) -> Review | None:
        instance = await self.get(db, id)
        if instance is None:
            return None
        instance.is_approved = True
        db.add(instance)

        # Recalculate product rating stats
        product_id = instance.product_id
        stats_stmt = select(func.count(Review.id).label("count"), func.avg(Review.rating).label("avg")).where(
            Review.product_id == product_id, Review.is_approved.is_(True), Review.is_active.is_(True)
        )
        stats = (await db.execute(stats_stmt)).first()

        if stats:
            count = int(stats[0] or 0)
            average = Decimal(stats[1] or 0)
            product_stmt = select(Product).where(Product.id == product_id)
            product = (await db.execute(product_stmt)).scalar_one_or_none()
            if product:
                product.rating_count = count
                product.rating_avg = average
                db.add(product)

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
