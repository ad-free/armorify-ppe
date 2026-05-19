# app/routers/admin/blog.py
from typing import cast
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import selectinload

from app.core.database import DbSession
from app.core.deps import CurrentUser, require_staff
from app.crud.crud_blog import blog_crud
from app.models.blog import BlogPost
from app.schemas.blog import BlogPostCreate, BlogPostRead, BlogPostUpdate
from app.schemas.common import PaginatedResponse

router = APIRouter(
    prefix="/admin/blog",
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
    base = select(BlogPost).options(selectinload(BlogPost.author))
    if not include_inactive:
        base = base.where(BlogPost.is_active.is_(True))
    total = (await db.execute(select(func.count()).select_from(base.subquery()))).scalar_one()
    rows = (await db.execute(base.order_by(BlogPost.created_at.desc()).offset(skip).limit(limit))).scalars().all()

    blog_post_read_response = []
    for row in rows:
        data = BlogPostRead.model_validate(row)
        if row.author:
            data.author_name = f"{row.author.lastname} {row.author.firstname}"
        else:
            data.author_name = "Quản trị viên"
        blog_post_read_response.append(data)

    return PaginatedResponse(items=blog_post_read_response, total=total, skip=skip, limit=limit)


@router.post("/posts", response_model=BlogPostRead, status_code=status.HTTP_201_CREATED)
async def create_post(payload: BlogPostCreate, db: DbSession, current_user: CurrentUser) -> BlogPostRead:
    if payload.published_at is None:
        from datetime import datetime, timezone

        payload.published_at = datetime.now(timezone.utc)
    payload.author_id = cast(UUID, current_user.id)
    post = await blog_crud.create(db, payload)

    data = BlogPostRead.model_validate(post)
    data.author_name = f"{current_user.lastname} {current_user.firstname}"
    return data


@router.put("/posts/{post_id}", response_model=BlogPostRead)
async def update_post(post_id: UUID, payload: BlogPostUpdate, db: DbSession) -> BlogPostRead:
    post = await blog_crud.update(db, post_id, payload)
    if post is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")

    stmt = select(BlogPost).options(selectinload(BlogPost.author)).where(BlogPost.id == post_id)
    post_loaded = (await db.execute(stmt)).scalar_one()

    data = BlogPostRead.model_validate(post_loaded)
    if post_loaded.author:
        data.author_name = f"{post_loaded.author.lastname} {post_loaded.author.firstname}"
    else:
        data.author_name = "Quản trị viên"
    return data


@router.delete("/posts/{post_id}", response_model=BlogPostRead)
async def delete_post(post_id: UUID, db: DbSession) -> BlogPostRead:
    post = await blog_crud.soft_delete(db, post_id)
    if post is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")

    stmt = select(BlogPost).options(selectinload(BlogPost.author)).where(BlogPost.id == post_id)
    post_loaded = (await db.execute(stmt)).scalar_one()

    data = BlogPostRead.model_validate(post_loaded)
    if post_loaded.author:
        data.author_name = f"{post_loaded.author.lastname} {post_loaded.author.firstname}"
    else:
        data.author_name = "Quản trị viên"
    return data
