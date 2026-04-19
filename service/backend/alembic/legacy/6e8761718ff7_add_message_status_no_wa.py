"""add message_status no_wa

Revision ID: 6e8761718ff7
Revises: 0002_baseline_reset
Create Date: 2026-03-11 22:22:38.824433
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "6e8761718ff7"
down_revision = "0002_baseline_reset"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TYPE message_status ADD VALUE IF NOT EXISTS 'NO_WA'")


def downgrade() -> None:
    # Downgrading is not supported due to limitations in PostgreSQL.
    pass
