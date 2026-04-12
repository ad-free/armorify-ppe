# app/schemas/blog.py
from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class BlogPostBase(BaseModel):
    title: str
    slug: str
    excerpt: str | None = Field(default=None, max_length=300)
    body: str
    cover_image_url: str | None = None
    author_id: UUID | None = None
    published_at: Optional[datetime] = None
    seo_title: str | None = Field(default=None, max_length=160)
    seo_description: str | None = Field(default=None, max_length=320)


class BlogPostCreate(BlogPostBase):
    pass


class BlogPostUpdate(BaseModel):
    title: str | None = None
    slug: str | None = None
    excerpt: str | None = Field(default=None, max_length=300)
    body: str | None = None
    cover_image_url: str | None = None
    author_id: UUID | None = None
    published_at: Optional[datetime] = None
    seo_title: str | None = Field(default=None, max_length=160)
    seo_description: str | None = Field(default=None, max_length=320)


class BlogPostRead(BlogPostBase):
    id: UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
