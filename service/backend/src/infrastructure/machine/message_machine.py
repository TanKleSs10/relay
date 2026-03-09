from __future__ import annotations

from typing import Final

from src.domain import MessageStatus

_ALLOWED_TRANSITIONS: Final[dict[MessageStatus, set[MessageStatus]]] = {
    MessageStatus.PENDING: {
        MessageStatus.PROCESSING,
        MessageStatus.FAILED,
    },
    MessageStatus.PROCESSING: {
        MessageStatus.SENT,
        MessageStatus.FAILED,
    },
    MessageStatus.SENT: set(),
    MessageStatus.FAILED: set(),
}


def can_transition(current: MessageStatus, target: MessageStatus) -> bool:
    if current == target:
        return True
    allowed = _ALLOWED_TRANSITIONS.get(current, set())
    return target in allowed
