"""Add checkout snapshots and idempotency without inventing historical evidence.

Revision ID: c4a91f027b63
Revises: 80686a8da3e7
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "c4a91f027b63"
down_revision = "80686a8da3e7"
branch_labels = None
depends_on = None

ORDER_STRINGS = {
    "email": 254,
    "province": 128,
    "district": 128,
    "ward": 128,
    "address": 512,
    "delivery_note": 1000,
    "shipping_method": 32,
    "payment_method": 32,
    "payment_status": 32,
    "fulfillment_status": 32,
    "checkout_payload_hash": 64,
}


def upgrade() -> None:
    # No defaults/backfill: older orders did not record delivery or payment proof.
    for name, length in ORDER_STRINGS.items():
        op.add_column("orders", sa.Column(name, sa.String(length), nullable=True))
    for name in ("subtotal", "discount", "shipping"):
        op.add_column("orders", sa.Column(name, sa.Numeric(12, 2), nullable=True))
    op.add_column(
        "orders",
        sa.Column("idempotency_key", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.create_index(
        "ix_orders_idempotency_key", "orders", ["idempotency_key"], unique=True
    )
    op.add_column(
        "order_items", sa.Column("product_name", sa.String(255), nullable=True)
    )
    op.add_column("order_items", sa.Column("sku", sa.String(128), nullable=True))
    op.add_column(
        "order_items", sa.Column("attributes", postgresql.JSONB(), nullable=True)
    )


def downgrade() -> None:
    for name in ("attributes", "sku", "product_name"):
        op.drop_column("order_items", name)
    op.drop_index("ix_orders_idempotency_key", table_name="orders")
    for name in (
        "idempotency_key",
        "shipping",
        "discount",
        "subtotal",
        *reversed(ORDER_STRINGS),
    ):
        op.drop_column("orders", name)
