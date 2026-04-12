# app/schemas/blog.py
from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class BlogPostBase(BaseModel):
    title: str
    slug: str
    excerpt: Optional[str] = Field(default=None, max_length=300)
    body: str
    cover_image_url: Optional[str] = None
    author_id: Optional[UUID] = None
    published_at: Optional[datetime] = None
    seo_title: Optional[str] = Field(default=None, max_length=160)
    seo_description: Optional[str] = Field(default=None, max_length=320)


class BlogPostCreate(BlogPostBase):
    pass


class BlogPostUpdate(BaseModel):
    title: Optional[str] = None
    slug: Optional[str] = None
    excerpt: Optional[str] = Field(default=None, max_length=300)
    body: Optional[str] = None
    cover_image_url: Optional[str] = None
    author_id: Optional[UUID] = None
    published_at: Optional[datetime] = None
    seo_title: Optional[str] = Field(default=None, max_length=160)
    seo_description: Optional[str] = Field(default=None, max_length=320)


class BlogPostRead(BlogPostBase):
    id: UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
