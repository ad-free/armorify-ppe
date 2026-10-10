from decimal import Decimal
from enum import Enum as PyEnum
from uuid import UUID as _UUID

from app.models.base import Base, BaseMixin
from app.models.product import Product
from sqlalchemy import Enum, ForeignKey, Index, Integer, Numeric, String, text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

_enum_values = lambda enum: [e.value for e in enum]  # noqa: E731


class OrderStatus(PyEnum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"


class Order(BaseMixin, Base):
    __tablename__ = "orders"

    user_id: Mapped[_UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=True,
    )
    order_code: Mapped[str] = mapped_column(String(64), nullable=False)
    contact_phone: Mapped[str] = mapped_column(String(32), nullable=False)
    customer_name: Mapped[str | None] = mapped_column(String(128), nullable=True)
    total_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    email: Mapped[str | None] = mapped_column(String(254), nullable=True)
    province: Mapped[str | None] = mapped_column(String(128), nullable=True)
    district: Mapped[str | None] = mapped_column(String(128), nullable=True)
    ward: Mapped[str | None] = mapped_column(String(128), nullable=True)
    address: Mapped[str | None] = mapped_column(String(512), nullable=True)
    delivery_note: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    shipping_method: Mapped[str | None] = mapped_column(String(32), nullable=True)
    payment_method: Mapped[str | None] = mapped_column(String(32), nullable=True)
    payment_status: Mapped[str | None] = mapped_column(String(32), nullable=True)
    fulfillment_status: Mapped[str | None] = mapped_column(String(32), nullable=True)
    subtotal: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    discount: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    shipping: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    idempotency_key: Mapped[_UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    checkout_payload_hash: Mapped[str | None] = mapped_column(String(64), nullable=True)
    status: Mapped[OrderStatus] = mapped_column(
        Enum(
            OrderStatus,
            name="order_status",
            native_enum=True,
            values_callable=_enum_values,
        ),
        nullable=False,
        server_default=text("'pending'"),
    )
    items: Mapped[list["OrderItem"]] = relationship(back_populates="order")

    __table_args__ = (
        Index("ix_orders_user_id", "user_id"),
        Index("ix_orders_order_code", "order_code", unique=True),
        Index("ix_orders_contact_phone", "contact_phone"),
        Index("ix_orders_idempotency_key", "idempotency_key", unique=True),
    )


class OrderItem(BaseMixin, Base):
    __tablename__ = "order_items"

    order_id: Mapped[_UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("orders.id", ondelete="CASCADE"),
        nullable=False,
    )
    product_id: Mapped[_UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("products.id", ondelete="RESTRICT"),
        nullable=False,
    )
    variant_id: Mapped[_UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("product_variants.id", ondelete="RESTRICT"),
        nullable=True,
    )
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    unit_price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    product_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    sku: Mapped[str | None] = mapped_column(String(128), nullable=True)
    attributes: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    order: Mapped[Order] = relationship(back_populates="items")
    product: Mapped[Product] = relationship()

    __table_args__ = (
        Index("ix_order_items_order_id", "order_id"),
        Index("ix_order_items_product_id", "product_id"),
    )
