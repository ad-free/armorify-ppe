"""Managed product images and one active cover per product.

Revision ID: f6b20c202611
Revises: f6a10c202611
"""
from alembic import op
import sqlalchemy as sa

revision = "f6b20c202611"
down_revision = "f6a10c202611"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("product_images", sa.Column("is_cover", sa.Boolean(), nullable=False, server_default=sa.false()))
    op.execute("UPDATE product_images SET position = LEAST(10000, GREATEST(0, position))")
    op.execute("""
        WITH ranked AS (
            SELECT id, row_number() OVER (PARTITION BY product_id ORDER BY position, created_at, id) AS rank
            FROM product_images WHERE is_active
        )
        UPDATE product_images SET is_cover = true FROM ranked
        WHERE product_images.id = ranked.id AND ranked.rank = 1
    """)
    op.execute("""
        UPDATE products SET cover_image_url = (
            SELECT url FROM product_images WHERE product_id = products.id AND is_cover AND is_active
        ) WHERE EXISTS (SELECT 1 FROM product_images WHERE product_id = products.id)
    """)
    op.create_check_constraint("ck_product_images_position", "product_images", "position BETWEEN 0 AND 10000")
    op.create_check_constraint("ck_product_images_active_cover", "product_images", "NOT is_cover OR is_active")
    op.create_index("uq_product_images_active_cover", "product_images", ["product_id"], unique=True,
                    postgresql_where=sa.text("is_active AND is_cover"))


def downgrade() -> None:
    op.drop_index("uq_product_images_active_cover", table_name="product_images")
    op.drop_constraint("ck_product_images_active_cover", "product_images", type_="check")
    op.drop_constraint("ck_product_images_position", "product_images", type_="check")
    op.drop_column("product_images", "is_cover")
