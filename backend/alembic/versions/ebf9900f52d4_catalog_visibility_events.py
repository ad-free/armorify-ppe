"""Append-only catalog visibility events for variant hide/show toggles.

Revision ID: ebf9900f52d4
Revises: f6b20c202611
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "ebf9900f52d4"
down_revision = "f6b20c202611"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "catalog_visibility_events",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column(
            "product_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("products.id", ondelete="RESTRICT"),
            nullable=False,
        ),
        sa.Column(
            "variant_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("product_variants.id", ondelete="RESTRICT"),
            nullable=False,
        ),
        sa.Column("action", sa.String(16), nullable=False),
        sa.Column(
            "admin_actor_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="RESTRICT"),
            nullable=True,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.clock_timestamp(),
        ),
        sa.ForeignKeyConstraint(
            ["variant_id", "product_id"],
            ["product_variants.id", "product_variants.product_id"],
            name="fk_visibility_variant_owner",
            ondelete="RESTRICT",
        ),
        sa.CheckConstraint(
            "action IN ('variant_hidden', 'variant_shown')", name="ck_visibility_action"
        ),
    )
    op.create_index(
        "ix_visibility_events_product_created",
        "catalog_visibility_events",
        ["product_id", "created_at"],
    )
    op.execute("""
        CREATE FUNCTION reject_visibility_event_mutation() RETURNS trigger LANGUAGE plpgsql AS $$
        BEGIN
            RAISE EXCEPTION 'Visibility events are append-only';
        END; $$
    """)
    op.execute("""
        CREATE TRIGGER catalog_visibility_events_append_only BEFORE UPDATE OR DELETE ON catalog_visibility_events
        FOR EACH ROW EXECUTE FUNCTION reject_visibility_event_mutation()
    """)


def downgrade() -> None:
    op.execute(
        "DROP TRIGGER catalog_visibility_events_append_only ON catalog_visibility_events"
    )
    op.execute("DROP FUNCTION reject_visibility_event_mutation()")
    op.drop_index(
        "ix_visibility_events_product_created", table_name="catalog_visibility_events"
    )
    op.drop_table("catalog_visibility_events")
