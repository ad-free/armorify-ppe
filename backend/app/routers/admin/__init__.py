from app.core.deps import require_admin, require_staff

from .brands import router as admin_brands_router
from .catalog import router as admin_catalog_router
from .cms import router as admin_cms_router
from .orders import router as admin_orders_router
from .product_images import router as admin_product_images_router
from .quotes import router as admin_quotes_router
from .users import router as admin_users_router

__all__ = [
    "admin_catalog_router",
    "admin_brands_router",
    "admin_cms_router",
    "admin_orders_router",
    "admin_product_images_router",
    "admin_quotes_router",
    "admin_users_router",
    "require_staff",
    "require_admin",
]
