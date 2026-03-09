"""add idempotency key to messages

Revision ID: 7c0a1e2d3f11
Revises: 6b1c4d5e6f20
Create Date: 2026-02-25 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "7c0a1e2d3f11"
down_revision = "6b1c4d5e6f20"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("messages", sa.Column("idempotency_key", sa.String(length=64)))
    op.create_index(
        "messages_campaign_idempotency_idx",
        "messages",
        ["campaign_id", "idempotency_key"],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index("messages_campaign_idempotency_idx", table_name="messages")
    op.drop_column("messages", "idempotency_key")
