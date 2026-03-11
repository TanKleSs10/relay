"""update sender account status enum

Revision ID: 5b3f2a1e4c91
Revises: ee92b9e4e79f
Create Date: 2025-03-01 00:00:00.000000
"""

from alembic import op

revision = "5b3f2a1e4c91"
down_revision = "ee92b9e4e79f"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        CREATE TYPE sender_account_status_new AS ENUM (
            'CREATED',
            'INITIALIZING',
            'WAITING_QR',
            'CONNECTED',
            'SENDING',
            'DISCONNECTED',
            'BLOCKED',
            'ERROR'
        )
        """
    )
    op.execute(
        """
        ALTER TABLE sender_accounts
        ALTER COLUMN status TYPE sender_account_status_new
        USING (
            CASE status
                WHEN 'QR_REQUIRED' THEN 'WAITING_QR'
                WHEN 'READY' THEN 'CONNECTED'
                WHEN 'COOLDOWN' THEN 'DISCONNECTED'
                WHEN 'BLOCKED' THEN 'BLOCKED'
                ELSE 'CREATED'
            END
        )::sender_account_status_new
        """
    )
    op.execute("ALTER TABLE sender_accounts ALTER COLUMN status SET DEFAULT 'CREATED'")
    op.execute("DROP TYPE sender_account_status")
    op.execute("ALTER TYPE sender_account_status_new RENAME TO sender_account_status")


def downgrade() -> None:
    op.execute(
        """
        CREATE TYPE sender_account_status_old AS ENUM (
            'QR_REQUIRED',
            'READY',
            'COOLDOWN',
            'BLOCKED'
        )
        """
    )
    op.execute(
        """
        ALTER TABLE sender_accounts
        ALTER COLUMN status TYPE sender_account_status_old
        USING (
            CASE status
                WHEN 'WAITING_QR' THEN 'QR_REQUIRED'
                WHEN 'CONNECTED' THEN 'READY'
                WHEN 'SENDING' THEN 'READY'
                WHEN 'DISCONNECTED' THEN 'COOLDOWN'
                WHEN 'BLOCKED' THEN 'BLOCKED'
                ELSE 'QR_REQUIRED'
            END
        )::sender_account_status_old
        """
    )
    op.execute("ALTER TABLE sender_accounts ALTER COLUMN status SET DEFAULT 'QR_REQUIRED'")
    op.execute("DROP TYPE sender_account_status")
    op.execute("ALTER TYPE sender_account_status_old RENAME TO sender_account_status")
