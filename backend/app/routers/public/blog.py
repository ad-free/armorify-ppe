# app/routers/public/blog.py
from app.core.database import DbSession
from app.crud.crud_blog import blog_crud
from app.models.blog import BlogPost
from app.schemas.blog import BlogPostRead
from app.schemas.common import PaginatedResponse
from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import func, select

router = APIRouter(prefix="/api/v1/blog", tags=["public-blog"])


@router.get("/posts", response_model=PaginatedResponse[BlogPostRead])
async def list_posts(
    db: DbSession,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=12, ge=1, le=100),
) -> PaginatedResponse[BlogPostRead]:
    rows, total = await blog_crud.get_published(db, skip=skip, limit=limit)
    return PaginatedResponse(items=rows, total=total, skip=skip, limit=limit)


@router.get("/posts/{slug}", response_model=BlogPostRead)
async def get_post(slug: str, db: DbSession) -> BlogPost:
    stmt = select(BlogPost).where(
        BlogPost.slug == slug,
        BlogPost.published_at.is_not(None),
        BlogPost.published_at <= func.now(),
        BlogPost.is_active.is_(True),
    )
    post = (await db.execute(stmt)).scalar_one_or_none()
    if post is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    return post
