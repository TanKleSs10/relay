"""baseline schema reset

Revision ID: 0002_baseline_reset
Revises:
Create Date: 2026-03-09 00:00:00.000000
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0002_baseline_reset"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        CREATE TYPE campaign_status AS ENUM (
            'CREATED',
            'ACTIVE',
            'PAUSED',
            'FINISHED'
        )
        """
    )
    op.execute(
        """
        CREATE TYPE message_status AS ENUM (
            'PENDING',
            'PROCESSING',
            'SENT',
            'FAILED'
        )
        """
    )
    op.execute(
        """
        CREATE TYPE sender_account_status AS ENUM (
            'CREATED',
            'INITIALIZING',
            'WAITING_QR',
            'CONNECTED',
            'SENDING',
            'COOLDOWN',
            'DISCONNECTED',
            'BLOCKED',
            'ERROR'
        )
        """
    )
    op.execute(
        """
        CREATE TYPE worker_status AS ENUM (
            'ONLINE',
            'OFFLINE'
        )
        """
    )
    op.execute(
        """
        CREATE TYPE worker_type AS ENUM (
            'qr',
            'session',
            'campaign'
        )
        """
    )

    op.create_table(
        "campaigns",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(length=255), nullable=False, unique=True),
        sa.Column(
            "status",
            postgresql.ENUM(
                "CREATED",
                "ACTIVE",
                "PAUSED",
                "FINISHED",
                name="campaign_status",
                create_type=False,
            ),
            nullable=False,
            server_default="CREATED",
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column("started_at", sa.DateTime(timezone=True)),
        sa.Column("finished_at", sa.DateTime(timezone=True)),
    )

    op.create_table(
        "sender_accounts",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("phone_number", sa.String(length=50)),
        sa.Column(
            "status",
            postgresql.ENUM(
                "CREATED",
                "INITIALIZING",
                "WAITING_QR",
                "CONNECTED",
                "SENDING",
                "COOLDOWN",
                "DISCONNECTED",
                "BLOCKED",
                "ERROR",
                name="sender_account_status",
                create_type=False,
            ),
            nullable=False,
            server_default="CREATED",
        ),
        sa.Column("qr_code", sa.Text()),
        sa.Column("qr_generated_at", sa.DateTime(timezone=True)),
        sa.Column("session_path", sa.String(length=255)),
        sa.Column("cooldown_until", sa.DateTime(timezone=True)),
        sa.Column("last_sent_at", sa.DateTime(timezone=True)),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )

    op.create_table(
        "workers",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("worker_name", sa.String(length=100), nullable=False),
        sa.Column(
            "worker_type",
            postgresql.ENUM(
                "qr",
                "session",
                "campaign",
                name="worker_type",
                create_type=False,
            ),
            nullable=False,
        ),
        sa.Column(
            "status",
            postgresql.ENUM(
                "ONLINE",
                "OFFLINE",
                name="worker_status",
                create_type=False,
            ),
            nullable=False,
            server_default="ONLINE",
        ),
        sa.Column("last_seen", sa.DateTime(timezone=True)),
        sa.Column("started_at", sa.DateTime(timezone=True)),
    )

    op.create_table(
        "messages",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("campaign_id", sa.Integer(), sa.ForeignKey("campaigns.id"), nullable=False),
        sa.Column("recipient", sa.String(length=50), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column(
            "status",
            postgresql.ENUM(
                "PENDING",
                "PROCESSING",
                "SENT",
                "FAILED",
                name="message_status",
                create_type=False,
            ),
            nullable=False,
            server_default="PENDING",
        ),
        sa.Column("idempotency_key", sa.String(length=64)),
        sa.Column("processing_by_worker", sa.Integer(), sa.ForeignKey("workers.id")),
        sa.Column("processing_sender_id", sa.Integer(), sa.ForeignKey("sender_accounts.id")),
        sa.Column("locked_at", sa.DateTime(timezone=True)),
        sa.Column("sent_at", sa.DateTime(timezone=True)),
        sa.Column("retry_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )

    op.create_table(
        "send_rules",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("messages_per_minute", sa.Integer(), nullable=False),
        sa.Column("delay_between_messages", sa.Integer(), nullable=False),
        sa.Column("active_senders", sa.Integer(), nullable=False),
        sa.Column("queue_size", sa.Integer(), nullable=False),
        sa.Column(
            "calculated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )

    op.create_table(
        "send_logs",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("message_id", sa.Integer(), sa.ForeignKey("messages.id"), nullable=False),
        sa.Column("sender_id", sa.Integer(), sa.ForeignKey("sender_accounts.id"), nullable=False),
        sa.Column("worker_id", sa.Integer(), sa.ForeignKey("workers.id"), nullable=False),
        sa.Column("status", sa.String(length=50), nullable=False),
        sa.Column("error_message", sa.Text()),
        sa.Column("provider_response", sa.Text()),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )

    op.create_index(
        "messages_status_campaign_idx",
        "messages",
        ["status", "campaign_id"],
    )
    op.create_index(
        "messages_locked_idx",
        "messages",
        ["locked_at"],
    )
    op.create_index(
        "sender_available_idx",
        "sender_accounts",
        ["status", "cooldown_until"],
    )
    op.create_index(
        "messages_campaign_idempotency_idx",
        "messages",
        ["campaign_id", "idempotency_key"],
        unique=True,
    )

    op.execute(
        "CREATE UNIQUE INDEX campaigns_active_unique ON campaigns (status) WHERE status = 'ACTIVE'"
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS campaigns_active_unique")
    op.drop_index("messages_campaign_idempotency_idx", table_name="messages")
    op.drop_index("sender_available_idx", table_name="sender_accounts")
    op.drop_index("messages_locked_idx", table_name="messages")
    op.drop_index("messages_status_campaign_idx", table_name="messages")
    op.drop_table("send_logs")
    op.drop_table("send_rules")
    op.drop_table("messages")
    op.drop_table("workers")
    op.drop_table("sender_accounts")
    op.drop_table("campaigns")
    op.execute("DROP TYPE IF EXISTS worker_type")
    op.execute("DROP TYPE IF EXISTS worker_status")
    op.execute("DROP TYPE IF EXISTS sender_account_status")
    op.execute("DROP TYPE IF EXISTS message_status")
    op.execute("DROP TYPE IF EXISTS campaign_status")
