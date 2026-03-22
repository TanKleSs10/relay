"""uuid baseline schema

Revision ID: 0003_uuid_baseline
Revises:
Create Date: 2026-03-12 00:00:00.000000
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0003_uuid_baseline"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS pgcrypto")

    op.execute(
        """
        CREATE TYPE user_status AS ENUM ('ACTIVE', 'INACTIVE')
        """
    )
    op.execute(
        """
        CREATE TYPE workspace_status AS ENUM ('ACTIVE', 'ARCHIVED')
        """
    )
    op.execute(
        """
        CREATE TYPE workspace_member_role AS ENUM ('OWNER', 'OPERATOR')
        """
    )
    op.execute(
        """
        CREATE TYPE workspace_member_status AS ENUM ('ACTIVE', 'INACTIVE')
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
        CREATE TYPE sender_session_health AS ENUM ('HEALTHY', 'DEGRADED', 'DEAD')
        """
    )
    op.execute(
        """
        CREATE TYPE campaign_status AS ENUM ('CREATED', 'ACTIVE', 'PAUSED', 'FINISHED', 'FAILED')
        """
    )
    op.execute(
        """
        CREATE TYPE message_status AS ENUM ('PENDING', 'PROCESSING', 'SENT', 'FAILED', 'NO_WA')
        """
    )
    op.execute(
        """
        CREATE TYPE worker_status AS ENUM ('ONLINE', 'OFFLINE', 'BUSY')
        """
    )
    op.execute(
        """
        CREATE TYPE worker_type AS ENUM ('QR', 'SESSION', 'CAMPAIGN')
        """
    )
    op.execute(
        """
        CREATE TYPE session_log_event AS ENUM (
            'QR_GENERATED',
            'READY',
            'DISCONNECTED',
            'AUTH_FAILURE',
            'RESTARTED',
            'DEAD'
        )
        """
    )

    op.create_table(
        "users",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column("email", sa.String(length=255), nullable=False, unique=True),
        sa.Column("password_hash", sa.Text(), nullable=False),
        sa.Column(
            "status",
            postgresql.ENUM("ACTIVE", "INACTIVE", name="user_status", create_type=False),
            nullable=False,
            server_default="ACTIVE",
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )

    op.create_table(
        "roles",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column("name", sa.String(length=100), nullable=False, unique=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )

    op.create_table(
        "permissions",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column("code", sa.String(length=150), nullable=False, unique=True),
        sa.Column("description", sa.Text()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )

    op.create_table(
        "role_permissions",
        sa.Column("role_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("roles.id"), nullable=False),
        sa.Column("permission_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("permissions.id"), nullable=False),
        sa.PrimaryKeyConstraint("role_id", "permission_id"),
    )

    op.create_table(
        "user_roles",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("role_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("roles.id"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )

    op.create_table(
        "workspaces",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("slug", sa.String(length=150), nullable=False, unique=True),
        sa.Column(
            "status",
            postgresql.ENUM("ACTIVE", "ARCHIVED", name="workspace_status", create_type=False),
            nullable=False,
            server_default="ACTIVE",
        ),
        sa.Column("created_by_user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )

    op.create_table(
        "workspace_members",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column("workspace_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("workspaces.id"), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column(
            "member_role",
            postgresql.ENUM("OWNER", "OPERATOR", name="workspace_member_role", create_type=False),
            nullable=False,
        ),
        sa.Column(
            "status",
            postgresql.ENUM("ACTIVE", "INACTIVE", name="workspace_member_status", create_type=False),
            nullable=False,
            server_default="ACTIVE",
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.UniqueConstraint("workspace_id", "user_id", name="workspace_members_unique"),
    )

    op.create_table(
        "sender_accounts",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column("workspace_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("workspaces.id"), nullable=False),
        sa.Column("label", sa.String(length=150), nullable=False),
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
        sa.Column("cooldown_until", sa.DateTime(timezone=True)),
        sa.Column("last_sent_at", sa.DateTime(timezone=True)),
        sa.Column("last_seen_at", sa.DateTime(timezone=True)),
        sa.Column("created_by_user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )

    op.create_table(
        "sender_sessions",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column("sender_account_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("sender_accounts.id"), nullable=False, unique=True),
        sa.Column("workspace_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("workspaces.id"), nullable=False),
        sa.Column("session_key", sa.String(length=255), nullable=False, unique=True),
        sa.Column("auth_dir", sa.Text()),
        sa.Column("browser_pid", sa.Integer()),
        sa.Column("websocket_state", sa.String(length=50)),
        sa.Column("qr_code", sa.Text()),
        sa.Column("qr_generated_at", sa.DateTime(timezone=True)),
        sa.Column("last_ready_at", sa.DateTime(timezone=True)),
        sa.Column("last_disconnect_at", sa.DateTime(timezone=True)),
        sa.Column("disconnect_reason", sa.Text()),
        sa.Column("restart_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column(
            "health_status",
            postgresql.ENUM("HEALTHY", "DEGRADED", "DEAD", name="sender_session_health", create_type=False),
            nullable=False,
            server_default="HEALTHY",
        ),
        sa.Column("last_heartbeat_at", sa.DateTime(timezone=True)),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )

    op.create_table(
        "session_logs",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column("workspace_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("workspaces.id"), nullable=False),
        sa.Column("sender_account_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("sender_accounts.id"), nullable=False),
        sa.Column("sender_session_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("sender_sessions.id"), nullable=False),
        sa.Column(
            "event_type",
            postgresql.ENUM(
                "QR_GENERATED",
                "READY",
                "DISCONNECTED",
                "AUTH_FAILURE",
                "RESTARTED",
                "DEAD",
                name="session_log_event",
                create_type=False,
            ),
            nullable=False,
        ),
        sa.Column("reason", sa.Text()),
        sa.Column("metadata", postgresql.JSONB()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )

    op.create_table(
        "campaigns",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column("workspace_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("workspaces.id"), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column(
            "status",
            postgresql.ENUM(
                "CREATED",
                "ACTIVE",
                "PAUSED",
                "FINISHED",
                "FAILED",
                name="campaign_status",
                create_type=False,
            ),
            nullable=False,
            server_default="CREATED",
        ),
        sa.Column("created_by_user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id")),
        sa.Column("started_at", sa.DateTime(timezone=True)),
        sa.Column("finished_at", sa.DateTime(timezone=True)),
        sa.Column("total_messages", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("sent_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("failed_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )

    op.create_table(
        "messages",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column("workspace_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("workspaces.id"), nullable=False),
        sa.Column("campaign_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("campaigns.id"), nullable=False),
        sa.Column("recipient", sa.String(length=50), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column(
            "status",
            postgresql.ENUM(
                "PENDING",
                "PROCESSING",
                "SENT",
                "FAILED",
                "NO_WA",
                name="message_status",
                create_type=False,
            ),
            nullable=False,
            server_default="PENDING",
        ),
        sa.Column("processing_by_worker_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("workers.id")),
        sa.Column("processing_sender_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("sender_accounts.id")),
        sa.Column("locked_at", sa.DateTime(timezone=True)),
        sa.Column("sent_at", sa.DateTime(timezone=True)),
        sa.Column("retry_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("max_retries", sa.Integer(), nullable=False, server_default="3"),
        sa.Column("idempotency_key", sa.String(length=64), nullable=False, unique=True),
        sa.Column("provider_message_id", sa.String(length=255)),
        sa.Column("last_error_code", sa.String(length=100)),
        sa.Column("last_error_message", sa.Text()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )

    op.create_table(
        "send_rules",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column("workspace_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("workspaces.id"), nullable=False, unique=True),
        sa.Column("max_messages_per_minute", sa.Integer(), nullable=False),
        sa.Column("cooldown_seconds", sa.Integer(), nullable=False),
        sa.Column("random_delay_min_ms", sa.Integer(), nullable=False),
        sa.Column("random_delay_max_ms", sa.Integer(), nullable=False),
        sa.Column("max_retries", sa.Integer(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )

    op.create_table(
        "workers",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column("workspace_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("workspaces.id")),
        sa.Column("worker_name", sa.String(length=150), nullable=False, unique=True),
        sa.Column(
            "worker_type",
            postgresql.ENUM(
                "QR",
                "SESSION",
                "CAMPAIGN",
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
                "BUSY",
                name="worker_status",
                create_type=False,
            ),
            nullable=False,
            server_default="ONLINE",
        ),
        sa.Column("last_seen", sa.DateTime(timezone=True)),
        sa.Column("started_at", sa.DateTime(timezone=True)),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )

    op.create_table(
        "send_logs",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column("workspace_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("workspaces.id"), nullable=False),
        sa.Column("message_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("messages.id"), nullable=False),
        sa.Column("campaign_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("campaigns.id"), nullable=False),
        sa.Column("sender_account_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("sender_accounts.id"), nullable=False),
        sa.Column("worker_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("workers.id"), nullable=False),
        sa.Column("status", sa.String(length=50), nullable=False),
        sa.Column("error_code", sa.String(length=100)),
        sa.Column("error_message", sa.Text()),
        sa.Column("provider_response", postgresql.JSONB()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )

    op.create_index("workspace_members_workspace_idx", "workspace_members", ["workspace_id"])
    op.create_index("workspace_members_user_idx", "workspace_members", ["user_id"])
    op.create_index("sender_accounts_workspace_status_idx", "sender_accounts", ["workspace_id", "status"])
    op.create_index("sender_sessions_health_idx", "sender_sessions", ["health_status"])
    op.create_index("sender_sessions_disconnect_idx", "sender_sessions", ["last_disconnect_at"])
    op.create_index("sender_sessions_heartbeat_idx", "sender_sessions", ["last_heartbeat_at"])
    op.create_index("campaigns_workspace_status_idx", "campaigns", ["workspace_id", "status"])
    op.create_index("messages_workspace_status_idx", "messages", ["workspace_id", "status"])
    op.create_index("messages_campaign_status_idx", "messages", ["campaign_id", "status"])
    op.create_index("messages_locked_idx", "messages", ["locked_at"])
    op.create_index("send_logs_workspace_created_idx", "send_logs", ["workspace_id", "created_at"])
    op.create_index("session_logs_sender_created_idx", "session_logs", ["sender_account_id", "created_at"])


def downgrade() -> None:
    op.drop_index("session_logs_sender_created_idx", table_name="session_logs")
    op.drop_index("send_logs_workspace_created_idx", table_name="send_logs")
    op.drop_index("messages_locked_idx", table_name="messages")
    op.drop_index("messages_campaign_status_idx", table_name="messages")
    op.drop_index("messages_workspace_status_idx", table_name="messages")
    op.drop_index("campaigns_workspace_status_idx", table_name="campaigns")
    op.drop_index("sender_sessions_heartbeat_idx", table_name="sender_sessions")
    op.drop_index("sender_sessions_disconnect_idx", table_name="sender_sessions")
    op.drop_index("sender_sessions_health_idx", table_name="sender_sessions")
    op.drop_index("sender_accounts_workspace_status_idx", table_name="sender_accounts")
    op.drop_index("workspace_members_user_idx", table_name="workspace_members")
    op.drop_index("workspace_members_workspace_idx", table_name="workspace_members")
    op.drop_table("send_logs")
    op.drop_table("workers")
    op.drop_table("send_rules")
    op.drop_table("messages")
    op.drop_table("campaigns")
    op.drop_table("session_logs")
    op.drop_table("sender_sessions")
    op.drop_table("sender_accounts")
    op.drop_table("workspace_members")
    op.drop_table("workspaces")
    op.drop_table("user_roles")
    op.drop_table("role_permissions")
    op.drop_table("permissions")
    op.drop_table("roles")
    op.drop_table("users")

    op.execute("DROP TYPE IF EXISTS session_log_event")
    op.execute("DROP TYPE IF EXISTS worker_type")
    op.execute("DROP TYPE IF EXISTS worker_status")
    op.execute("DROP TYPE IF EXISTS message_status")
    op.execute("DROP TYPE IF EXISTS campaign_status")
    op.execute("DROP TYPE IF EXISTS sender_session_health")
    op.execute("DROP TYPE IF EXISTS sender_account_status")
    op.execute("DROP TYPE IF EXISTS workspace_member_status")
    op.execute("DROP TYPE IF EXISTS workspace_member_role")
    op.execute("DROP TYPE IF EXISTS workspace_status")
    op.execute("DROP TYPE IF EXISTS user_status")
