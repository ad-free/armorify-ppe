from app.core.deps import require_admin, require_staff
from .catalog import router as admin_catalog_router
from .cms import router as admin_cms_router
from .orders import router as admin_orders_router
from .quotes import router as admin_quotes_router

__all__ = [
    "admin_catalog_router",
    "admin_cms_router",
    "admin_orders_router",
    "admin_quotes_router",
    "require_staff",
    "require_admin",
]
