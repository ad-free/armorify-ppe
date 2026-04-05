"""Initial migration

Revision ID: 96a9bb49965d
Revises:
Create Date: 2026-04-05 10:20:46.163981

"""
from typing import Sequence, Union

# revision identifiers, used by Alembic.
revision: str = '96a9bb49965d'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
