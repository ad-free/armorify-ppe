# app/models/blog.py
from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING, Optional

from app.models.base import Base, BaseMixin
from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Index, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

if TYPE_CHECKING:
    from app.models.user import User


class BlogPost(BaseMixin, Base):
    __tablename__ = "blog_posts"

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), nullable=False)
    excerpt: Mapped[Optional[str]] = mapped_column(String(300), nullable=True)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    cover_image_url: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    author_id: Mapped[Optional[UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    published_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    seo_title: Mapped[Optional[str]] = mapped_column(String(160), nullable=True)
    seo_description: Mapped[Optional[str]] = mapped_column(String(320), nullable=True)
    author: Mapped[Optional[User]] = relationship(foreign_keys=[author_id])

    __table_args__ = (
        Index("ix_blog_posts_slug", "slug", unique=True),
        Index("ix_blog_posts_published_at", "published_at"),
        Index("ix_blog_posts_author_id", "author_id"),
        CheckConstraint(
            "slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'",
            name="ck_blog_posts_slug_format",
        ),
    )
