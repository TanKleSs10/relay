"""add media asset tables

Revision ID: 0009_add_media
Revises: 0008_sender_qr_states
Create Date: 2026-04-25 00:00:00.000000
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0009_add_media"
down_revision = "0008_sender_qr_states"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "media_assets",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column("provider", sa.String(length=50), nullable=False),
        sa.Column("resource_type", sa.String(length=20), nullable=False),
        sa.Column("public_id", sa.String(length=255), nullable=False),
        sa.Column("secure_url", sa.Text(), nullable=False),
        sa.Column("bytes", sa.Integer(), nullable=False),
        sa.Column("format", sa.String(length=20), nullable=False),
        sa.Column("width", sa.Integer(), nullable=True),
        sa.Column("height", sa.Integer(), nullable=True),
        sa.Column("original_filename", sa.String(length=255), nullable=True),
        sa.Column(
            "created_by_user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id"),
            nullable=True,
        ),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
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
        sa.UniqueConstraint("public_id", name="uq_media_assets_public_id"),
    )

    op.create_table(
        "campaign_media_assets",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column(
            "campaign_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("campaigns.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "media_asset_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("media_assets.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "sort_order",
            sa.Integer(),
            nullable=False,
            server_default=sa.text("0"),
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.UniqueConstraint(
            "campaign_id",
            "media_asset_id",
            name="uq_campaign_media_assets_campaign_asset",
        ),
    )

    op.create_index(
        "ix_campaign_media_assets_campaign_id",
        "campaign_media_assets",
        ["campaign_id"],
    )
    op.create_index(
        "ix_campaign_media_assets_media_asset_id",
        "campaign_media_assets",
        ["media_asset_id"],
    )


def downgrade() -> None:
    op.drop_index(
        "ix_campaign_media_assets_media_asset_id",
        table_name="campaign_media_assets",
    )
    op.drop_index(
        "ix_campaign_media_assets_campaign_id",
        table_name="campaign_media_assets",
    )
    op.drop_table("campaign_media_assets")
    op.drop_table("media_assets")
