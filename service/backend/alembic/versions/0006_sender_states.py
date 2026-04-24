"""add sender account transitional states

Revision ID: 0006_sender_states
Revises: 0005_sender_cascade
Create Date: 2026-04-23 00:00:00.000000
"""

from __future__ import annotations

from alembic import op

revision = "0006_sender_states"
down_revision = "0005_sender_cascade"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        "ALTER TYPE sender_account_status ADD VALUE IF NOT EXISTS 'AUTHENTICATING'"
    )
    op.execute(
        "ALTER TYPE sender_account_status ADD VALUE IF NOT EXISTS 'CONNECTING'"
    )


def downgrade() -> None:
    # PostgreSQL does not support dropping enum values without recreating the type.
    pass
