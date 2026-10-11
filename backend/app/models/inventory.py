"""Append-only inventory evidence; existing balances intentionally have no opening entries."""

from datetime import datetime
from uuid import UUID as _UUID

from app.models.base import Base
from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    ForeignKeyConstraint,
    Index,
    Integer,
    String,
    event,
    func,
    text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column


class InventoryMovement(Base):
    __tablename__ = "inventory_movements"

    id: Mapped[_UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    product_id: Mapped[_UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("products.id", ondelete="RESTRICT"), nullable=False
    )
    variant_id: Mapped[_UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("product_variants.id", ondelete="RESTRICT")
    )
    quantity_delta: Mapped[int] = mapped_column(Integer, nullable=False)
    resulting_balance: Mapped[int] = mapped_column(Integer, nullable=False)
    source_type: Mapped[str] = mapped_column(String(32), nullable=False)
    order_id: Mapped[_UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("orders.id", ondelete="RESTRICT"))
    admin_actor_id: Mapped[_UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT")
    )
    reason: Mapped[str] = mapped_column(String(1000), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.clock_timestamp()
    )

    __table_args__ = (
        ForeignKeyConstraint(
            ["variant_id", "product_id"],
            ["product_variants.id", "product_variants.product_id"],
            name="fk_inventory_variant_owner",
            ondelete="RESTRICT",
        ),
        Index("ix_inventory_movements_product_created", "product_id", "created_at"),
        Index("ix_inventory_movements_order_id", "order_id"),
        CheckConstraint("quantity_delta != 0", name="ck_inventory_delta_nonzero"),
        CheckConstraint("resulting_balance >= 0", name="ck_inventory_balance_nonnegative"),
        CheckConstraint("length(btrim(reason)) > 0", name="ck_inventory_reason_required"),
        CheckConstraint("source_type IN ('admin_adjustment', 'checkout', 'cancellation')", name="ck_inventory_source"),
        CheckConstraint(
            "(source_type = 'admin_adjustment' AND admin_actor_id IS NOT NULL AND order_id IS NULL) "
            "OR (source_type = 'checkout' AND order_id IS NOT NULL AND quantity_delta < 0) "
            "OR (source_type = 'cancellation' AND order_id IS NOT NULL AND quantity_delta > 0)",
            name="ck_inventory_source_context",
        ),
    )


@event.listens_for(InventoryMovement, "before_update")
@event.listens_for(InventoryMovement, "before_delete")
def reject_inventory_mutation(mapper, connection, target):
    raise ValueError("Inventory movements are append-only")
