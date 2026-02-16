from src.api.routes.campaigns import router as campaigns_router
from src.api.routes.health import router as health_router
from src.api.routes.messages import router as messages_router
from src.api.routes.sender_accounts import router as sender_accounts_router
from src.api.routes.view import router as view_router

__all__ = [
    "health_router",
    "view_router",
    "campaigns_router",
    "messages_router",
    "sender_accounts_router",
]
