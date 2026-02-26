from __future__ import annotations

from src.domain.models import (
    CampaignStatus,
    MessageStatus,
    Provider,
    SenderAccountStatus,
    WorkerStatus,
)

ENUM_REGISTRY = {
    "campaign_status": CampaignStatus,
    "message_status": MessageStatus,
    "provider": Provider,
    "sender_account_status": SenderAccountStatus,
    "worker_status": WorkerStatus,
}


def enum_values() -> dict[str, list[str]]:
    return {
        name: [member.value for member in enum_cls]
        for name, enum_cls in ENUM_REGISTRY.items()
    }
