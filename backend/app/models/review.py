# app/models/review.py
from __future__ import annotations

from typing import TYPE_CHECKING

from app.models.base import Base, BaseMixin
from sqlalchemy import Boolean, CheckConstraint, ForeignKey, Index, Integer, String, Text, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

if TYPE_CHECKING:
    from app.models.product import Product
    from app.models.user import User


class Review(BaseMixin, Base):
    __tablename__ = "reviews"

    product_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("products.id", ondelete="RESTRICT"),
        nullable=False,
    )
    user_id: Mapped[UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    author_name: Mapped[str] = mapped_column(String(255), nullable=False)
    rating: Mapped[int] = mapped_column(Integer, nullable=False)
    body: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_approved: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("false"), default=False)
    product: Mapped[Product] = relationship(foreign_keys=[product_id])
    user: Mapped[User | None] = relationship(foreign_keys=[user_id])

    __table_args__ = (
        CheckConstraint("rating BETWEEN 1 AND 5", name="ck_reviews_rating"),
        Index("ix_reviews_product_id_is_approved", "product_id", "is_approved"),
        Index("ix_reviews_user_id", "user_id"),
    )
