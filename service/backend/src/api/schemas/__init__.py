from src.api.schemas.campaigns import (
    CampaignCreate,
    CampaignRead,
    CampaignUpdate,
)
from src.api.schemas.sender_accounts import (
    SenderAccountCreate,
    SenderAccountRead,
    SenderAccountUpdate,
)

from src.api.schemas.users import (
    UserCreate,
    UserRead,
    UserLogin,
    UserStatusUpdate,
)
from src.api.schemas.roles import (
    RoleRead,
    PermissionRead,
)

__all__ = [
    "CampaignCreate",
    "CampaignRead",
    "CampaignUpdate",
    "SenderAccountCreate",
    "SenderAccountRead",
    "SenderAccountUpdate",
    "UserCreate",
    "UserRead",
    "UserLogin",
    "UserStatusUpdate",
    "RoleRead",
    "PermissionRead",
]
