from __future__ import annotations

from datetime import datetime
from enum import Enum

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum as SAEnum,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.infrastructure.db.base import Base


class CampaignStatus(str, Enum):
    CREATED = "CREATED"
    ACTIVE = "ACTIVE"
    PAUSED = "PAUSED"
    FINISHED = "FINISHED"


class MessageStatus(str, Enum):
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    SENT = "SENT"
    FAILED = "FAILED"
    NO_WA = "NO_WA"


class SenderAccountStatus(str, Enum):
    CREATED = "CREATED"
    INITIALIZING = "INITIALIZING"
    WAITING_QR = "WAITING_QR"
    CONNECTED = "CONNECTED"
    SENDING = "SENDING"
    COOLDOWN = "COOLDOWN"
    DISCONNECTED = "DISCONNECTED"
    BLOCKED = "BLOCKED"
    ERROR = "ERROR"

class WorkerType(str, Enum):
    QR = "qr"
    SESSION = "session"
    CAMPAIGN = "campaign"


class WorkerStatus(str, Enum):
    ONLINE = "ONLINE"
    OFFLINE = "OFFLINE"


class Campaign(Base):
    __tablename__ = "campaigns"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    status: Mapped[CampaignStatus] = mapped_column(
        SAEnum(CampaignStatus, name="campaign_status"),
        nullable=False,
        default=CampaignStatus.CREATED,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    messages: Mapped[list[Message]] = relationship(
        "Message", back_populates="campaign", cascade="all, delete-orphan"
    )


class Message(Base):
    __tablename__ = "messages"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    campaign_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("campaigns.id"), nullable=False
    )
    recipient: Mapped[str] = mapped_column(String(50), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    idempotency_key: Mapped[str | None] = mapped_column(String(64))
    status: Mapped[MessageStatus] = mapped_column(
        SAEnum(MessageStatus, name="message_status"),
        nullable=False,
        default=MessageStatus.PENDING,
    )
    processing_by_worker: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("workers.id")
    )
    processing_sender_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("sender_accounts.id")
    )
    locked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    retry_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
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

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    phone_number: Mapped[str | None] = mapped_column(String(50))
    status: Mapped[SenderAccountStatus] = mapped_column(
        SAEnum(SenderAccountStatus, name="sender_account_status"),
        nullable=False,
        default=SenderAccountStatus.CREATED,
    )
    qr_code: Mapped[str | None] = mapped_column(Text)
    qr_generated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    session_path: Mapped[str | None] = mapped_column(String(255))
    cooldown_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    last_sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
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


class SendRule(Base):
    __tablename__ = "send_rules"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    messages_per_minute: Mapped[int] = mapped_column(Integer, nullable=False)
    delay_between_messages: Mapped[int] = mapped_column(Integer, nullable=False)
    active_senders: Mapped[int] = mapped_column(Integer, nullable=False)
    queue_size: Mapped[int] = mapped_column(Integer, nullable=False)
    calculated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )


class Worker(Base):
    __tablename__ = "workers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    worker_name: Mapped[str] = mapped_column(String(100), nullable=False)
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

    send_logs: Mapped[list["SendLog"]] = relationship(
        "SendLog", back_populates="worker", cascade="all, delete-orphan"
    )


class SendLog(Base):
    __tablename__ = "send_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    message_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("messages.id"), nullable=False
    )
    sender_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("sender_accounts.id"), nullable=False
    )
    worker_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("workers.id"), nullable=False
    )
    status: Mapped[str] = mapped_column(String(50), nullable=False)
    error_message: Mapped[str | None] = mapped_column(Text)
    provider_response: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    message: Mapped[Message] = relationship("Message", back_populates="send_logs")
    sender: Mapped[SenderAccount] = relationship(
        "SenderAccount", back_populates="send_logs"
    )
    worker: Mapped[Worker] = relationship("Worker", back_populates="send_logs")
