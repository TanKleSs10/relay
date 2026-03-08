"""reset schema drop legacy tables

Revision ID: 6a0b3e7c2b10
Revises: 5b3f2a1e4c91
Create Date: 2025-03-01 00:30:00.000000
"""

from alembic import op

revision = "6a0b3e7c2b10"
down_revision = "5b3f2a1e4c91"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("DROP TABLE IF EXISTS send_logs CASCADE")
    op.execute("DROP TABLE IF EXISTS messages CASCADE")
    op.execute("DROP TABLE IF EXISTS sender_accounts CASCADE")
    op.execute("DROP TABLE IF EXISTS send_rules CASCADE")
    op.execute("DROP TABLE IF EXISTS worker_states CASCADE")
    op.execute("DROP TABLE IF EXISTS workers CASCADE")
    op.execute("DROP TABLE IF EXISTS template_variables CASCADE")
    op.execute("DROP TABLE IF EXISTS campaigns CASCADE")

    op.execute("DROP TYPE IF EXISTS campaign_status CASCADE")
    op.execute("DROP TYPE IF EXISTS message_status CASCADE")
    op.execute("DROP TYPE IF EXISTS sender_account_status CASCADE")
    op.execute("DROP TYPE IF EXISTS worker_status CASCADE")
    op.execute("DROP TYPE IF EXISTS worker_type CASCADE")
    op.execute("DROP TYPE IF EXISTS provider CASCADE")


def downgrade() -> None:
    # No downgrade for reset drop migration.
    pass
