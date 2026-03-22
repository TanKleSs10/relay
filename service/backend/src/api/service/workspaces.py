from __future__ import annotations

import os
from uuid import UUID

from sqlalchemy import text
from sqlalchemy.orm import Session

from src.application.errors import ConflictError


def get_default_workspace_id(db: Session) -> UUID:
    raw = os.getenv("DEFAULT_WORKSPACE_ID")
    if raw:
        return UUID(raw)
    result = db.execute(text("SELECT id FROM workspaces ORDER BY created_at ASC LIMIT 1"))
    row = result.first()
    if not row:
        raise ConflictError("Workspace not initialized")
    return row[0]
