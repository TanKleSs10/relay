from __future__ import annotations

from typing import Final

from src.domain import WorkerStatus

_ALLOWED_TRANSITIONS: Final[dict[WorkerStatus, set[WorkerStatus]]] = {
    WorkerStatus.IDLE: {WorkerStatus.RUNNING, WorkerStatus.ERROR},
    WorkerStatus.RUNNING: {WorkerStatus.IDLE, WorkerStatus.ERROR},
    WorkerStatus.ERROR: {WorkerStatus.IDLE},
}


def can_transition(current: WorkerStatus, target: WorkerStatus) -> bool:
    if current == target:
        return True
    allowed = _ALLOWED_TRANSITIONS.get(current, set())
    return target in allowed
