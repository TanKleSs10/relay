"""add sender account idle state

Revision ID: 0007_sender_idle
Revises: 0006_sender_states
Create Date: 2026-04-23 00:00:00.000000
"""

from __future__ import annotations

from alembic import op

revision = "0007_sender_idle"
down_revision = "0006_sender_states"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        "ALTER TYPE sender_account_status ADD VALUE IF NOT EXISTS 'IDLE'"
    )


def downgrade() -> None:
    # PostgreSQL does not support dropping enum values without recreating the type.
    pass
