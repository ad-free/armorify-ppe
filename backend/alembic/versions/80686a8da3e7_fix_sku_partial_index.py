"""fix_sku_partial_index

Revision ID: 80686a8da3e7
Revises: 823625331a2f
Create Date: 2026-05-10 02:41:24.339233+00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '80686a8da3e7'
down_revision: Union[str, Sequence[str], None] = '823625331a2f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Drop existing index
    op.drop_index("ix_variants_sku", table_name="product_variants")
    # Create partial index
    op.create_index(
        "ix_variants_sku",
        "product_variants",
        ["sku"],
        unique=True,
        postgresql_where=sa.text("is_active = true"),
    )


def downgrade() -> None:
    """Downgrade schema."""
    # Drop partial index
    op.drop_index(
        "ix_variants_sku",
        table_name="product_variants",
        postgresql_where=sa.text("is_active = true"),
    )
    # Re-create full index
    op.create_index("ix_variants_sku", "product_variants", ["sku"], unique=True)
