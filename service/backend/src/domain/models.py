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


class Provider(str, Enum):
    WHATSAPP_WEB = "whatsapp_web"


class CampaignStatus(str, Enum):
    CREATED = "CREATED"
    QUEUED = "QUEUED"
    PROCESSING = "PROCESSING"
    DONE = "DONE"
    FAILED = "FAILED"


class MessageStatus(str, Enum):
    QUEUED = "QUEUED"
    SENT = "SENT"
    FAILED = "FAILED"
    RETRY = "RETRY"


class SenderAccountStatus(str, Enum):
    QR_REQUIRED = "QR_REQUIRED"
    READY = "READY"
    BLOCKED = "BLOCKED"
    COOLDOWN = "COOLDOWN"


class WorkerStatus(str, Enum):
    IDLE = "IDLE"
    RUNNING = "RUNNING"
    ERROR = "ERROR"


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

    messages: Mapped[list[Message]] = relationship(
        "Message", back_populates="campaign", cascade="all, delete-orphan"
    )
    template_variables: Mapped[list[TemplateVariable]] = relationship(
        "TemplateVariable", back_populates="campaign", cascade="all, delete-orphan"
    )


class Message(Base):
    __tablename__ = "messages"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    campaign_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("campaigns.id"), nullable=False
    )
    recipient: Mapped[str] = mapped_column(String(50), nullable=False)
    payload: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[MessageStatus] = mapped_column(
        SAEnum(MessageStatus, name="message_status"),
        nullable=False,
        default=MessageStatus.QUEUED,
    )
    attempts: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    last_error: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    campaign: Mapped[Campaign] = relationship("Campaign", back_populates="messages")
    send_logs: Mapped[list[SendLog]] = relationship(
        "SendLog", back_populates="message", cascade="all, delete-orphan"
    )


class SenderAccount(Base):
    __tablename__ = "sender_accounts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    provider: Mapped[Provider] = mapped_column(
        SAEnum(Provider, name="provider"),
        nullable=False,
        default=Provider.WHATSAPP_WEB,
    )
    phone_number: Mapped[str] = mapped_column(String(50), nullable=False)
    status: Mapped[SenderAccountStatus] = mapped_column(
        SAEnum(SenderAccountStatus, name="sender_account_status"),
        nullable=False,
        default=SenderAccountStatus.QR_REQUIRED,
    )
    last_used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    send_logs: Mapped[list[SendLog]] = relationship(
        "SendLog", back_populates="sender_account", cascade="all, delete-orphan"
    )


class SendRule(Base):
    __tablename__ = "send_rules"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    provider: Mapped[Provider] = mapped_column(
        SAEnum(Provider, name="provider"),
        nullable=False,
        default=Provider.WHATSAPP_WEB,
    )
    min_delay_seconds: Mapped[int] = mapped_column(Integer, nullable=False)
    max_delay_seconds: Mapped[int] = mapped_column(Integer, nullable=False)
    max_messages_per_hour: Mapped[int] = mapped_column(Integer, nullable=False)
    max_messages_per_day: Mapped[int] = mapped_column(Integer, nullable=False)
    cooldown_minutes: Mapped[int] = mapped_column(Integer, nullable=False)
    active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )


class WorkerState(Base):
    __tablename__ = "worker_states"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    worker_name: Mapped[str] = mapped_column(String(100), nullable=False)
    status: Mapped[WorkerStatus] = mapped_column(
        SAEnum(WorkerStatus, name="worker_status"),
        nullable=False,
        default=WorkerStatus.IDLE,
    )
    current_campaign_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("campaigns.id")
    )
    last_heartbeat: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    current_campaign: Mapped[Campaign | None] = relationship("Campaign")


class SendLog(Base):
    __tablename__ = "send_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    message_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("messages.id"), nullable=False
    )
    sender_account_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("sender_accounts.id"), nullable=False
    )
    status: Mapped[str] = mapped_column(String(50), nullable=False)
    provider_response: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    message: Mapped[Message] = relationship("Message", back_populates="send_logs")
    sender_account: Mapped[SenderAccount] = relationship(
        "SenderAccount", back_populates="send_logs"
    )


class TemplateVariable(Base):
    __tablename__ = "template_variables"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    campaign_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("campaigns.id"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    required: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    campaign: Mapped[Campaign] = relationship(
        "Campaign", back_populates="template_variables"
    )
