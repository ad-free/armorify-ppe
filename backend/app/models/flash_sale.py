# app/models/flash_sale.py
from datetime import datetime
from uuid import UUID as _UUID

from app.models.base import Base, BaseMixin
from app.models.product import Product
from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    String,
    text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship


class FlashSale(BaseMixin, Base):
    __tablename__ = "flash_sales"

    name: Mapped[str] = mapped_column(String(255))
    start_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    end_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, server_default=text("true"))

    items: Mapped[list["FlashSaleItem"]] = relationship(back_populates="flash_sale", cascade="all, delete-orphan")


class FlashSaleItem(BaseMixin, Base):
    __tablename__ = "flash_sale_items"

    flash_sale_id: Mapped[_UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("flash_sales.id", ondelete="CASCADE"))
    product_id: Mapped[_UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"))

    discount_percent: Mapped[float] = mapped_column(default=0.0, server_default=text("0.0"))
    sale_price: Mapped[float | None] = mapped_column(nullable=True)

    flash_sale: Mapped["FlashSale"] = relationship(back_populates="items")
    product: Mapped["Product"] = relationship()
