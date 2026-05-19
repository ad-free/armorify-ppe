# app/schemas/blog.py
from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class BlogPostBase(BaseModel):
    title: str
    slug: str
    excerpt: str | None = Field(default=None, max_length=300)
    body: str = Field(..., json_schema_extra={"x-ui-widget": "rich-text"})
    cover_image_url: str | None = None
    author_id: UUID | None = Field(None, json_schema_extra={"x-ui-hidden": True})
    published_at: Optional[datetime] = None
    seo_title: str | None = Field(default=None, max_length=160)
    seo_description: str | None = Field(default=None, max_length=320)


class BlogPostCreate(BlogPostBase):
    pass


class BlogPostUpdate(BaseModel):
    title: str | None = None
    slug: str | None = None
    excerpt: str | None = Field(default=None, max_length=300)
    body: str | None = Field(default=None, json_schema_extra={"x-ui-widget": "rich-text"})
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
    author_name: str | None = Field(None, json_schema_extra={"x-ui-priority": True})

    model_config = {"from_attributes": True}
