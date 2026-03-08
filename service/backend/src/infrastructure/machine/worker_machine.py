from __future__ import annotations

from typing import Final

from src.domain import WorkerStatus

_ALLOWED_TRANSITIONS: Final[dict[WorkerStatus, set[WorkerStatus]]] = {
    WorkerStatus.ONLINE: {WorkerStatus.OFFLINE},
    WorkerStatus.OFFLINE: {WorkerStatus.ONLINE},
}


def can_transition(current: WorkerStatus, target: WorkerStatus) -> bool:
    if current == target:
        return True
    allowed = _ALLOWED_TRANSITIONS.get(current, set())
    return target in allowed
