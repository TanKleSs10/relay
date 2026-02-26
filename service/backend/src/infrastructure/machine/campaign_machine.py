from __future__ import annotations

from typing import Final

from src.domain import CampaignStatus

_ALLOWED_TRANSITIONS: Final[dict[CampaignStatus, set[CampaignStatus]]] = {
    CampaignStatus.CREATED: {CampaignStatus.QUEUED, CampaignStatus.PROCESSING},
    CampaignStatus.QUEUED: {CampaignStatus.PROCESSING, CampaignStatus.FAILED},
    CampaignStatus.PROCESSING: {CampaignStatus.DONE, CampaignStatus.FAILED},
    CampaignStatus.DONE: set(),
    CampaignStatus.FAILED: set(),
}


def can_transition(
    current: CampaignStatus, target: CampaignStatus
) -> bool:
    if current == target:
        return True
    allowed = _ALLOWED_TRANSITIONS.get(current, set())
    return target in allowed
