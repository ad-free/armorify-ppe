"""Authoritative inventory movements without invented opening or historical entries.

Revision ID: f6a10c202611
Revises: e5b72c19a406
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "f6a10c202611"
down_revision = "e5b72c19a406"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("products", sa.Column("version", sa.Integer(), nullable=False, server_default="1"))
    op.create_check_constraint("ck_products_version_positive", "products", "version >= 1")
    op.create_unique_constraint("uq_variants_id_product", "product_variants", ["id", "product_id"])
    op.create_table(
        "inventory_movements",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("product_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("products.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("variant_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("product_variants.id", ondelete="RESTRICT"), nullable=True),
        sa.Column("quantity_delta", sa.Integer(), nullable=False),
        sa.Column("resulting_balance", sa.Integer(), nullable=False),
        sa.Column("source_type", sa.String(32), nullable=False),
        sa.Column("order_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("orders.id", ondelete="RESTRICT"), nullable=True),
        sa.Column("admin_actor_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="RESTRICT"), nullable=True),
        sa.Column("reason", sa.String(1000), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.clock_timestamp()),
        sa.ForeignKeyConstraint(
            ["variant_id", "product_id"], ["product_variants.id", "product_variants.product_id"],
            name="fk_inventory_variant_owner", ondelete="RESTRICT",
        ),
        sa.CheckConstraint("quantity_delta != 0", name="ck_inventory_delta_nonzero"),
        sa.CheckConstraint("resulting_balance >= 0", name="ck_inventory_balance_nonnegative"),
        sa.CheckConstraint("length(btrim(reason)) > 0", name="ck_inventory_reason_required"),
        sa.CheckConstraint("source_type IN ('admin_adjustment', 'checkout', 'cancellation')", name="ck_inventory_source"),
        sa.CheckConstraint("(source_type = 'admin_adjustment' AND admin_actor_id IS NOT NULL AND order_id IS NULL) OR (source_type = 'checkout' AND order_id IS NOT NULL AND quantity_delta < 0) OR (source_type = 'cancellation' AND order_id IS NOT NULL AND quantity_delta > 0)", name="ck_inventory_source_context"),
    )
    op.create_index("ix_inventory_movements_product_created", "inventory_movements", ["product_id", "created_at"])
    op.create_index("ix_inventory_movements_order_id", "inventory_movements", ["order_id"])
    op.execute("""
        CREATE FUNCTION reject_inventory_movement_mutation() RETURNS trigger LANGUAGE plpgsql AS $$
        BEGIN
            RAISE EXCEPTION 'Inventory movements are append-only';
        END; $$
    """)
    op.execute("""
        CREATE TRIGGER inventory_movements_append_only BEFORE UPDATE OR DELETE ON inventory_movements
        FOR EACH ROW EXECUTE FUNCTION reject_inventory_movement_mutation()
    """)


def downgrade() -> None:
    op.execute("DROP TRIGGER inventory_movements_append_only ON inventory_movements")
    op.execute("DROP FUNCTION reject_inventory_movement_mutation()")
    op.drop_index("ix_inventory_movements_order_id", table_name="inventory_movements")
    op.drop_index("ix_inventory_movements_product_created", table_name="inventory_movements")
    op.drop_table("inventory_movements")
    op.drop_constraint("uq_variants_id_product", "product_variants", type_="unique")
    op.drop_constraint("ck_products_version_positive", "products", type_="check")
    op.drop_column("products", "version")
