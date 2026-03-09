from __future__ import annotations

from src.domain.models import (
    CampaignStatus,
    MessageStatus,
    SenderAccountStatus,
    WorkerStatus,
    WorkerType,
)

ENUM_REGISTRY = {
    "campaign_status": CampaignStatus,
    "message_status": MessageStatus,
    "sender_account_status": SenderAccountStatus,
    "worker_status": WorkerStatus,
    "worker_type": WorkerType,
}


def enum_values() -> dict[str, list[str]]:
    return {
        name: [member.value for member in enum_cls]
        for name, enum_cls in ENUM_REGISTRY.items()
    }
