"""Versioned shipment workflow and append-only internal order audit.

Revision ID: e5b72c19a406
Revises: c4a91f027b63
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "e5b72c19a406"
down_revision = "c4a91f027b63"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Only the concurrency counter has a default; do not invent historical shipment evidence.
    for name, length in (("carrier_name", 120), ("tracking_number", 160)):
        op.add_column("orders", sa.Column(name, sa.String(length), nullable=True))
    for name in ("shipped_at", "delivered_at"):
        op.add_column("orders", sa.Column(name, sa.DateTime(timezone=True), nullable=True))
    op.add_column("orders", sa.Column("version", sa.Integer(), nullable=False, server_default="1"))
    op.create_check_constraint("ck_orders_version_positive", "orders", "version >= 1")
    op.create_table(
        "order_events",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("order_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("orders.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("actor_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("event_type", sa.String(32), nullable=False),
        sa.Column("previous_state", postgresql.JSONB(), nullable=False),
        sa.Column("new_state", postgresql.JSONB(), nullable=False),
        sa.Column("metadata", postgresql.JSONB(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.clock_timestamp()),
    )
    op.create_index("ix_order_events_order_created", "order_events", ["order_id", "created_at"])
    op.execute("""
        CREATE FUNCTION reject_order_event_mutation() RETURNS trigger LANGUAGE plpgsql AS $$
        BEGIN
            RAISE EXCEPTION 'Order events are append-only';
        END; $$
    """)
    op.execute("""
        CREATE TRIGGER order_events_append_only BEFORE UPDATE OR DELETE ON order_events
        FOR EACH ROW EXECUTE FUNCTION reject_order_event_mutation()
    """)


def downgrade() -> None:
    op.execute("DROP TRIGGER order_events_append_only ON order_events")
    op.execute("DROP FUNCTION reject_order_event_mutation()")
    op.drop_index("ix_order_events_order_created", table_name="order_events")
    op.drop_table("order_events")
    op.drop_constraint("ck_orders_version_positive", "orders", type_="check")
    for name in ("version", "delivered_at", "shipped_at", "tracking_number", "carrier_name"):
        op.drop_column("orders", name)
