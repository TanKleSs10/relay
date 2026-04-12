"""add messages external_id

Revision ID: 0004_add_message_external_id
Revises: 0003_uuid_baseline
Create Date: 2026-04-07 00:00:00.000000
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa

revision = "0004_add_message_external_id"
down_revision = "0003_uuid_baseline"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("messages", sa.Column("external_id", sa.String(length=120)))
    op.create_index(
        "messages_campaign_external_id_idx",
        "messages",
        ["campaign_id", "external_id"],
    )


def downgrade() -> None:
    op.drop_index("messages_campaign_external_id_idx", table_name="messages")
    op.drop_column("messages", "external_id")
