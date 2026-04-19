from __future__ import annotations

from datetime import datetime

from pydantic import ConfigDict, UUID4

from src.api.schemas.base import APIModel
from src.domain import SenderSessionHealth, SessionLogEvent


class SenderSessionRead(APIModel):
    id: UUID4
    sender_account_id: UUID4
    session_key: str
    websocket_state: str | None = None
    qr_generated_at: datetime | None = None
    last_ready_at: datetime | None = None
    last_disconnect_at: datetime | None = None
    disconnect_reason: str | None = None
    restart_count: int
    health_status: SenderSessionHealth
    last_heartbeat_at: datetime | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
        extra="forbid",
        str_strip_whitespace=True,
        validate_assignment=True,
    )


class SenderQrRead(APIModel):
    sender_account_id: UUID4
    qr_code: str | None = None
    qr_generated_at: datetime | None = None

    model_config = ConfigDict(
        from_attributes=True,
        extra="forbid",
        str_strip_whitespace=True,
        validate_assignment=True,
    )


class SessionLogRead(APIModel):
    id: UUID4
    sender_account_id: UUID4
    sender_session_id: UUID4
    event_type: SessionLogEvent
    reason: str | None = None
    metadata_: dict | None = None
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
        extra="forbid",
        str_strip_whitespace=True,
        validate_assignment=True,
    )
