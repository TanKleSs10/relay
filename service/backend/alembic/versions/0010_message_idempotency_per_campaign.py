"""scope message idempotency to campaign

Revision ID: 0010_msg_idempotency_campaign
Revises: 0009_add_media
Create Date: 2026-04-25 00:00:00.000000
"""

from __future__ import annotations

from alembic import op

revision = "0010_msg_idempotency_campaign"
down_revision = "0009_add_media"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.drop_constraint(
        "messages_idempotency_key_key",
        "messages",
        type_="unique",
    )
    op.create_unique_constraint(
        "uq_messages_campaign_idempotency_key",
        "messages",
        ["campaign_id", "idempotency_key"],
    )


def downgrade() -> None:
    op.drop_constraint(
        "uq_messages_campaign_idempotency_key",
        "messages",
        type_="unique",
    )
    op.create_unique_constraint(
        "messages_idempotency_key_key",
        "messages",
        ["idempotency_key"],
    )
