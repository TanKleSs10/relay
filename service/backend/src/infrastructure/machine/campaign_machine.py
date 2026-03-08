from __future__ import annotations

from typing import Final

from src.domain import CampaignStatus

_ALLOWED_TRANSITIONS: Final[dict[CampaignStatus, set[CampaignStatus]]] = {
    CampaignStatus.CREATED: {CampaignStatus.ACTIVE, CampaignStatus.PAUSED},
    CampaignStatus.ACTIVE: {CampaignStatus.PAUSED, CampaignStatus.FINISHED},
    CampaignStatus.PAUSED: {CampaignStatus.ACTIVE, CampaignStatus.FINISHED},
    CampaignStatus.FINISHED: set(),
}


def can_transition(
    current: CampaignStatus, target: CampaignStatus
) -> bool:
    if current == target:
        return True
    allowed = _ALLOWED_TRANSITIONS.get(current, set())
    return target in allowed
