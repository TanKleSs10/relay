"""add sender session delete cascade

Revision ID: 0005_sender_session_delete_cascade
Revises: 0004_add_message_external_id
Create Date: 2026-04-22 00:00:00.000000
"""

from __future__ import annotations

from alembic import op

revision = "0005_sender_session_delete_cascade"
down_revision = "0004_add_message_external_id"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.drop_constraint(
        "sender_sessions_sender_account_id_fkey",
        "sender_sessions",
        type_="foreignkey",
    )
    op.create_foreign_key(
        "sender_sessions_sender_account_id_fkey",
        "sender_sessions",
        "sender_accounts",
        ["sender_account_id"],
        ["id"],
        ondelete="CASCADE",
    )

    op.drop_constraint(
        "session_logs_sender_account_id_fkey",
        "session_logs",
        type_="foreignkey",
    )
    op.create_foreign_key(
        "session_logs_sender_account_id_fkey",
        "session_logs",
        "sender_accounts",
        ["sender_account_id"],
        ["id"],
        ondelete="CASCADE",
    )

    op.drop_constraint(
        "session_logs_sender_session_id_fkey",
        "session_logs",
        type_="foreignkey",
    )
    op.create_foreign_key(
        "session_logs_sender_session_id_fkey",
        "session_logs",
        "sender_sessions",
        ["sender_session_id"],
        ["id"],
        ondelete="CASCADE",
    )


def downgrade() -> None:
    op.drop_constraint(
        "session_logs_sender_session_id_fkey",
        "session_logs",
        type_="foreignkey",
    )
    op.create_foreign_key(
        "session_logs_sender_session_id_fkey",
        "session_logs",
        "sender_sessions",
        ["sender_session_id"],
        ["id"],
    )

    op.drop_constraint(
        "session_logs_sender_account_id_fkey",
        "session_logs",
        type_="foreignkey",
    )
    op.create_foreign_key(
        "session_logs_sender_account_id_fkey",
        "session_logs",
        "sender_accounts",
        ["sender_account_id"],
        ["id"],
    )

    op.drop_constraint(
        "sender_sessions_sender_account_id_fkey",
        "sender_sessions",
        type_="foreignkey",
    )
    op.create_foreign_key(
        "sender_sessions_sender_account_id_fkey",
        "sender_sessions",
        "sender_accounts",
        ["sender_account_id"],
        ["id"],
    )
