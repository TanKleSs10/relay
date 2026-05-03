"""add workspace foundation

Revision ID: 0011_workspace_foundation
Revises: 0010_msg_idempotency_campaign
Create Date: 2026-05-02 00:00:00.000000
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0011_workspace_foundation"
down_revision = "0010_msg_idempotency_campaign"
branch_labels = None
depends_on = None

DEFAULT_WORKSPACE_NAME = "Default Workspace"
DEFAULT_WORKSPACE_SLUG = "default"


def upgrade() -> None:
    op.create_table(
        "workspaces",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("name", sa.String(length=150), nullable=False),
        sa.Column("slug", sa.String(length=150), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
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
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name"),
        sa.UniqueConstraint("slug"),
    )

    op.create_table(
        "workspace_memberships",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("workspace_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column(
            "role",
            sa.Enum(
                "WORKSPACE_ADMIN",
                "SUPERVISOR",
                "OPERATOR",
                name="workspace_membership_role",
            ),
            nullable=False,
            server_default="OPERATOR",
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["workspace_id"], ["workspaces.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "workspace_id",
            "user_id",
            name="uq_workspace_memberships_workspace_user",
        ),
    )
    op.create_index(
        "ix_workspace_memberships_workspace_id",
        "workspace_memberships",
        ["workspace_id"],
        unique=False,
    )
    op.create_index(
        "ix_workspace_memberships_user_id",
        "workspace_memberships",
        ["user_id"],
        unique=False,
    )

    op.add_column(
        "campaigns",
        sa.Column("workspace_id", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.add_column(
        "sender_accounts",
        sa.Column("workspace_id", postgresql.UUID(as_uuid=True), nullable=True),
    )

    conn = op.get_bind()
    workspace_id = conn.execute(
        sa.text(
            """
            INSERT INTO workspaces (name, slug, is_active)
            VALUES (:name, :slug, true)
            RETURNING id
            """
        ),
        {"name": DEFAULT_WORKSPACE_NAME, "slug": DEFAULT_WORKSPACE_SLUG},
    ).scalar_one()

    conn.execute(
        sa.text("UPDATE campaigns SET workspace_id = :workspace_id WHERE workspace_id IS NULL"),
        {"workspace_id": workspace_id},
    )
    conn.execute(
        sa.text(
            "UPDATE sender_accounts SET workspace_id = :workspace_id WHERE workspace_id IS NULL"
        ),
        {"workspace_id": workspace_id},
    )
    conn.execute(
        sa.text(
            """
            INSERT INTO workspace_memberships (workspace_id, user_id, role)
            SELECT :workspace_id, u.id, 'WORKSPACE_ADMIN'
            FROM users u
            WHERE NOT EXISTS (
              SELECT 1
              FROM workspace_memberships wm
              WHERE wm.workspace_id = :workspace_id AND wm.user_id = u.id
            )
            """
        ),
        {"workspace_id": workspace_id},
    )

    op.alter_column("campaigns", "workspace_id", nullable=False)
    op.alter_column("sender_accounts", "workspace_id", nullable=False)

    op.create_foreign_key(
        "fk_campaigns_workspace_id_workspaces",
        "campaigns",
        "workspaces",
        ["workspace_id"],
        ["id"],
    )
    op.create_foreign_key(
        "fk_sender_accounts_workspace_id_workspaces",
        "sender_accounts",
        "workspaces",
        ["workspace_id"],
        ["id"],
    )
    op.create_index("ix_campaigns_workspace_id", "campaigns", ["workspace_id"], unique=False)
    op.create_index(
        "ix_sender_accounts_workspace_id",
        "sender_accounts",
        ["workspace_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_sender_accounts_workspace_id", table_name="sender_accounts")
    op.drop_index("ix_campaigns_workspace_id", table_name="campaigns")
    op.drop_constraint(
        "fk_sender_accounts_workspace_id_workspaces",
        "sender_accounts",
        type_="foreignkey",
    )
    op.drop_constraint(
        "fk_campaigns_workspace_id_workspaces",
        "campaigns",
        type_="foreignkey",
    )
    op.drop_column("sender_accounts", "workspace_id")
    op.drop_column("campaigns", "workspace_id")
    op.drop_index("ix_workspace_memberships_user_id", table_name="workspace_memberships")
    op.drop_index("ix_workspace_memberships_workspace_id", table_name="workspace_memberships")
    op.drop_table("workspace_memberships")
    op.execute("DROP TYPE IF EXISTS workspace_membership_role")
    op.drop_table("workspaces")
