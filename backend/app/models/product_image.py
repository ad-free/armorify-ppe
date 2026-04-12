# app/models/product_image.py
from __future__ import annotations

from typing import TYPE_CHECKING, Optional

from app.models.base import Base, BaseMixin
from sqlalchemy import ForeignKey, Index, Integer, String, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

if TYPE_CHECKING:
    from app.models.product import Product


class ProductImage(BaseMixin, Base):
    __tablename__ = "product_images"

    product_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("products.id", ondelete="CASCADE"),
        nullable=False,
    )
    url: Mapped[str] = mapped_column(String(512), nullable=False)
    alt_text: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    position: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("0"), default=0)
    product: Mapped[Product] = relationship(foreign_keys=[product_id])

    __table_args__ = (Index("ix_product_images_product_id_position", "product_id", "position"),)
