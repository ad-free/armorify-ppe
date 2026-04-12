# app/crud/crud_blog.py
from app.crud.base import CRUDBase
from app.models.blog import BlogPost
from app.schemas.blog import BlogPostCreate, BlogPostUpdate
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession


class CRUDBlog(CRUDBase[BlogPost]):
    async def get_published(
        self, db: AsyncSession, skip: int = 0, limit: int = 12
    ) -> tuple[list[BlogPost], int]:
        base = select(BlogPost).where(
            BlogPost.published_at.is_not(None),
            BlogPost.published_at <= func.now(),
            BlogPost.is_active.is_(True),
        )
        total = (await db.execute(select(func.count()).select_from(base.subquery()))).scalar_one()
        rows = (await db.execute(base.order_by(BlogPost.published_at.desc()).offset(skip).limit(limit))).scalars().all()
        return list(rows), total


blog_crud = CRUDBlog(BlogPost)
