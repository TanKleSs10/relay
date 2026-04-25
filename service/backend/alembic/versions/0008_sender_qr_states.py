"""add explicit sender qr states

Revision ID: 0008_sender_qr_states
Revises: 0007_sender_idle
Create Date: 2026-04-25 00:00:00.000000
"""

from __future__ import annotations

from alembic import op

revision = "0008_sender_qr_states"
down_revision = "0007_sender_idle"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        "ALTER TYPE sender_account_status ADD VALUE IF NOT EXISTS 'QR_REQUESTED'"
    )
    op.execute(
        "ALTER TYPE sender_account_status ADD VALUE IF NOT EXISTS 'QR_INACTIVE'"
    )


def downgrade() -> None:
    # PostgreSQL does not support dropping enum values without recreating the type.
    pass
