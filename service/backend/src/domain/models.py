from __future__ import annotations
from datetime import datetime
from uuid import UUID as PyUUID
from enum import Enum
from sqlalchemy import (
    Boolean,
    DateTime,
    Enum as SAEnum,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
    text,
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.infrastructure.db.base import Base


class UserStatus(str, Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"


class CampaignStatus(str, Enum):
    CREATED = "CREATED"
    ACTIVE = "ACTIVE"
    PAUSED = "PAUSED"
    FINISHED = "FINISHED"
    FAILED = "FAILED"


class MessageStatus(str, Enum):
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    SENT = "SENT"
    FAILED = "FAILED"
    NO_WA = "NO_WA"


class SenderAccountStatus(str, Enum):
    CREATED = "CREATED"
    IDLE = "IDLE"
    INITIALIZING = "INITIALIZING"
    QR_REQUESTED = "QR_REQUESTED"
    WAITING_QR = "WAITING_QR"
    QR_INACTIVE = "QR_INACTIVE"
    AUTHENTICATING = "AUTHENTICATING"
    CONNECTING = "CONNECTING"
    CONNECTED = "CONNECTED"
    SENDING = "SENDING"
    COOLDOWN = "COOLDOWN"
    DISCONNECTED = "DISCONNECTED"
    BLOCKED = "BLOCKED"
    ERROR = "ERROR"


class SenderSessionHealth(str, Enum):
    HEALTHY = "HEALTHY"
    DEGRADED = "DEGRADED"
    DEAD = "DEAD"


class SessionLogEvent(str, Enum):
    QR_GENERATED = "QR_GENERATED"
    READY = "READY"
    DISCONNECTED = "DISCONNECTED"
    AUTH_FAILURE = "AUTH_FAILURE"
    RESTARTED = "RESTARTED"
    DEAD = "DEAD"


class WorkerType(str, Enum):
    QR = "QR"
    SESSION = "SESSION"
    CAMPAIGN = "CAMPAIGN"


class WorkerStatus(str, Enum):
    ONLINE = "ONLINE"
    OFFLINE = "OFFLINE"
    BUSY = "BUSY"


class User(Base):
    __tablename__ = "users"

    id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")
    )
    username: Mapped[str] = mapped_column(String(80), nullable=False, unique=True)
    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    password_hash: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[UserStatus] = mapped_column(
        SAEnum(UserStatus, name="user_status"),
        nullable=False,
        default=UserStatus.ACTIVE,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    roles: Mapped[list["UserRole"]] = relationship(
        "UserRole", back_populates="user", cascade="all, delete-orphan"
    )


class Role(Base):
    __tablename__ = "roles"

    id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    permissions: Mapped[list["RolePermission"]] = relationship(
        "RolePermission", back_populates="role", cascade="all, delete-orphan"
    )
    users: Mapped[list["UserRole"]] = relationship(
        "UserRole", back_populates="role", cascade="all, delete-orphan"
    )


class Permission(Base):
    __tablename__ = "permissions"

    id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")
    )
    code: Mapped[str] = mapped_column(String(150), nullable=False, unique=True)
    description: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    roles: Mapped[list["RolePermission"]] = relationship(
        "RolePermission", back_populates="permission", cascade="all, delete-orphan"
    )


class RolePermission(Base):
    __tablename__ = "role_permissions"

    role_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("roles.id"), primary_key=True
    )
    permission_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("permissions.id"), primary_key=True
    )

    role: Mapped[Role] = relationship("Role", back_populates="permissions")
    permission: Mapped[Permission] = relationship("Permission", back_populates="roles")


class UserRole(Base):
    __tablename__ = "user_roles"

    id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")
    )
    user_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    role_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("roles.id"), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    user: Mapped[User] = relationship("User", back_populates="roles")
    role: Mapped[Role] = relationship("Role", back_populates="users")


class Campaign(Base):
    __tablename__ = "campaigns"

    id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[CampaignStatus] = mapped_column(
        SAEnum(CampaignStatus, name="campaign_status"),
        nullable=False,
        default=CampaignStatus.CREATED,
    )
    created_by_user_id: Mapped[PyUUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id")
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    total_messages: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    sent_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    failed_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    messages: Mapped[list[Message]] = relationship(
        "Message", back_populates="campaign", cascade="all, delete-orphan"
    )
    media_links: Mapped[list["CampaignMediaAsset"]] = relationship(
        "CampaignMediaAsset", back_populates="campaign", cascade="all, delete-orphan"
    )
    send_logs: Mapped[list["SendLog"]] = relationship(
        "SendLog", back_populates="campaign", cascade="all, delete-orphan"
    )


class Message(Base):
    __tablename__ = "messages"
    __table_args__ = (
        UniqueConstraint(
            "campaign_id",
            "idempotency_key",
            name="uq_messages_campaign_idempotency_key",
        ),
    )

    id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")
    )
    campaign_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("campaigns.id"), nullable=False
    )
    recipient: Mapped[str] = mapped_column(String(50), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    external_id: Mapped[str | None] = mapped_column(String(120))
    idempotency_key: Mapped[str] = mapped_column(String(64), nullable=False)
    status: Mapped[MessageStatus] = mapped_column(
        SAEnum(MessageStatus, name="message_status"),
        nullable=False,
        default=MessageStatus.PENDING,
    )
    processing_by_worker: Mapped[PyUUID | None] = mapped_column(
        "processing_by_worker_id", UUID(as_uuid=True), ForeignKey("workers.id")
    )
    processing_sender_id: Mapped[PyUUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("sender_accounts.id")
    )
    locked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    retry_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    max_retries: Mapped[int] = mapped_column(Integer, nullable=False, default=3)
    provider_message_id: Mapped[str | None] = mapped_column(String(255))
    last_error_code: Mapped[str | None] = mapped_column(String(100))
    last_error_message: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    campaign: Mapped[Campaign] = relationship("Campaign", back_populates="messages")
    send_logs: Mapped[list[SendLog]] = relationship(
        "SendLog", back_populates="message", cascade="all, delete-orphan"
    )


class SenderAccount(Base):
    __tablename__ = "sender_accounts"

    id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")
    )
    label: Mapped[str] = mapped_column(String(150), nullable=False)
    phone_number: Mapped[str | None] = mapped_column(String(50))
    status: Mapped[SenderAccountStatus] = mapped_column(
        SAEnum(SenderAccountStatus, name="sender_account_status"),
        nullable=False,
        default=SenderAccountStatus.CREATED,
    )
    cooldown_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    last_sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    last_seen_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_by_user_id: Mapped[PyUUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id")
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    send_logs: Mapped[list[SendLog]] = relationship(
        "SendLog", back_populates="sender", cascade="all, delete-orphan"
    )
    session: Mapped["SenderSession"] = relationship(
        "SenderSession",
        back_populates="sender",
        uselist=False,
        cascade="all, delete-orphan",
        single_parent=True,
        passive_deletes=True,
    )


class SenderSession(Base):
    __tablename__ = "sender_sessions"

    id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")
    )
    sender_account_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("sender_accounts.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )
    session_key: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    auth_dir: Mapped[str | None] = mapped_column(Text)
    browser_pid: Mapped[int | None] = mapped_column(Integer)
    websocket_state: Mapped[str | None] = mapped_column(String(50))
    qr_code: Mapped[str | None] = mapped_column(Text)
    qr_generated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    last_ready_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    last_disconnect_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    disconnect_reason: Mapped[str | None] = mapped_column(Text)
    restart_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    health_status: Mapped[SenderSessionHealth] = mapped_column(
        SAEnum(SenderSessionHealth, name="sender_session_health"),
        nullable=False,
        default=SenderSessionHealth.HEALTHY,
    )
    last_heartbeat_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    sender: Mapped[SenderAccount] = relationship(
        "SenderAccount", back_populates="session"
    )
    logs: Mapped[list["SessionLog"]] = relationship(
        "SessionLog", back_populates="sender_session", cascade="all, delete-orphan"
    )


class SessionLog(Base):
    __tablename__ = "session_logs"

    id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")
    )
    sender_account_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("sender_accounts.id", ondelete="CASCADE"),
        nullable=False,
    )
    sender_session_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("sender_sessions.id", ondelete="CASCADE"),
        nullable=False,
    )
    event_type: Mapped[SessionLogEvent] = mapped_column(
        SAEnum(SessionLogEvent, name="session_log_event"),
        nullable=False,
    )
    reason: Mapped[str | None] = mapped_column(Text)
    metadata_: Mapped[dict | None] = mapped_column("metadata", JSONB)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    sender_session: Mapped[SenderSession] = relationship(
        "SenderSession", back_populates="logs"
    )


class SendRule(Base):
    __tablename__ = "send_rules"

    id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")
    )
    max_messages_per_minute: Mapped[int] = mapped_column(Integer, nullable=False)
    cooldown_seconds: Mapped[int] = mapped_column(Integer, nullable=False)
    random_delay_min_ms: Mapped[int] = mapped_column(Integer, nullable=False)
    random_delay_max_ms: Mapped[int] = mapped_column(Integer, nullable=False)
    max_retries: Mapped[int] = mapped_column(Integer, nullable=False, default=3)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )


class MediaAsset(Base):
    __tablename__ = "media_assets"

    id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")
    )
    provider: Mapped[str] = mapped_column(String(50), nullable=False)
    resource_type: Mapped[str] = mapped_column(String(20), nullable=False)
    public_id: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    secure_url: Mapped[str] = mapped_column(Text, nullable=False)
    bytes: Mapped[int] = mapped_column(Integer, nullable=False)
    format: Mapped[str] = mapped_column(String(20), nullable=False)
    width: Mapped[int | None] = mapped_column(Integer)
    height: Mapped[int | None] = mapped_column(Integer)
    original_filename: Mapped[str | None] = mapped_column(String(255))
    created_by_user_id: Mapped[PyUUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id")
    )
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    campaign_links: Mapped[list["CampaignMediaAsset"]] = relationship(
        "CampaignMediaAsset", back_populates="media_asset", cascade="all, delete-orphan"
    )


class CampaignMediaAsset(Base):
    __tablename__ = "campaign_media_assets"

    id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")
    )
    campaign_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("campaigns.id", ondelete="CASCADE"),
        nullable=False,
    )
    media_asset_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("media_assets.id", ondelete="CASCADE"),
        nullable=False,
    )
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    campaign: Mapped[Campaign] = relationship("Campaign", back_populates="media_links")
    media_asset: Mapped[MediaAsset] = relationship(
        "MediaAsset", back_populates="campaign_links"
    )


class Worker(Base):
    __tablename__ = "workers"

    id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")
    )
    worker_name: Mapped[str] = mapped_column(String(150), nullable=False, unique=True)
    worker_type: Mapped[WorkerType] = mapped_column(
        SAEnum(WorkerType, name="worker_type"),
        nullable=False,
    )
    status: Mapped[WorkerStatus] = mapped_column(
        SAEnum(WorkerStatus, name="worker_status"),
        nullable=False,
        default=WorkerStatus.ONLINE,
    )
    last_seen: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    send_logs: Mapped[list["SendLog"]] = relationship(
        "SendLog", back_populates="worker", cascade="all, delete-orphan"
    )


class SendLog(Base):
    __tablename__ = "send_logs"

    id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")
    )
    message_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("messages.id"), nullable=False
    )
    campaign_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("campaigns.id"), nullable=False
    )
    sender_id: Mapped[PyUUID] = mapped_column(
        "sender_account_id",
        UUID(as_uuid=True),
        ForeignKey("sender_accounts.id"),
        nullable=False,
    )
    worker_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("workers.id"), nullable=False
    )
    status: Mapped[str] = mapped_column(String(50), nullable=False)
    error_code: Mapped[str | None] = mapped_column(String(100))
    error_message: Mapped[str | None] = mapped_column(Text)
    provider_response: Mapped[dict | None] = mapped_column(JSONB)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    message: Mapped[Message] = relationship("Message", back_populates="send_logs")
    campaign: Mapped[Campaign] = relationship("Campaign", back_populates="send_logs")
    sender: Mapped[SenderAccount] = relationship(
        "SenderAccount", back_populates="send_logs"
    )
    worker: Mapped[Worker] = relationship("Worker", back_populates="send_logs")
