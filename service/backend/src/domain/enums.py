from __future__ import annotations

from src.domain.models import (
    CampaignStatus,
    MessageStatus,
    SenderAccountStatus,
    SenderSessionHealth,
    SessionLogEvent,
    UserStatus,
    WorkerStatus,
    WorkerType,
    WorkspaceMembershipRole,
)

ENUM_REGISTRY = {
    "campaign_status": CampaignStatus,
    "message_status": MessageStatus,
    "sender_account_status": SenderAccountStatus,
    "sender_session_health": SenderSessionHealth,
    "session_log_event": SessionLogEvent,
    "user_status": UserStatus,
    "worker_status": WorkerStatus,
    "worker_type": WorkerType,
    "workspace_membership_role": WorkspaceMembershipRole,
}


def enum_values() -> dict[str, list[str]]:
    return {
        name: [member.value for member in enum_cls]
        for name, enum_cls in ENUM_REGISTRY.items()
    }
