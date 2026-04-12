# app/routers/admin/blog.py
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select

from app.core.database import DbSession
from app.core.deps import require_staff
from app.crud.crud_blog import blog_crud
from app.models.blog import BlogPost
from app.schemas.blog import BlogPostCreate, BlogPostRead, BlogPostUpdate
from app.schemas.common import PaginatedResponse

router = APIRouter(
    prefix="/api/v1/admin/blog",
    tags=["admin-blog"],
    dependencies=[Depends(require_staff)],
)


@router.get("/posts", response_model=PaginatedResponse[BlogPostRead])
async def list_posts(
    db: DbSession,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
    include_inactive: bool = False,
) -> PaginatedResponse[BlogPostRead]:
    base = select(BlogPost)
    if not include_inactive:
        base = base.where(BlogPost.is_active.is_(True))
    total = (await db.execute(select(func.count()).select_from(base.subquery()))).scalar_one()
    rows = (await db.execute(base.order_by(BlogPost.created_at.desc()).offset(skip).limit(limit))).scalars().all()
    blog_post_read_response = [BlogPostRead.model_validate(row) for row in rows]
    return PaginatedResponse(items=blog_post_read_response, total=total, skip=skip, limit=limit)


@router.post("/posts", response_model=BlogPostRead, status_code=status.HTTP_201_CREATED)
async def create_post(payload: BlogPostCreate, db: DbSession) -> BlogPost:
    return await blog_crud.create(db, payload)


@router.put("/posts/{post_id}", response_model=BlogPostRead)
async def update_post(post_id: UUID, payload: BlogPostUpdate, db: DbSession) -> BlogPost:
    post = await blog_crud.update(db, post_id, payload)
    if post is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    return post


@router.delete("/posts/{post_id}", response_model=BlogPostRead)
async def delete_post(post_id: UUID, db: DbSession) -> BlogPost:
    post = await blog_crud.soft_delete(db, post_id)
    if post is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    return post
