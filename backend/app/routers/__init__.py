# app/routers/__init__.py
from .admin import (
    admin_catalog_router,
    admin_cms_router,
    admin_orders_router,
    admin_quotes_router,
)
from .auth import router as auth_router
from .protected import addresses_router, cart_router, protected_orders_router
from .public import public_catalog_router, public_cms_router, public_orders_router
from .users import router as users_router

__all__ = [
    "auth_router",
    "public_catalog_router",
    "public_cms_router",
    "public_orders_router",
    "protected_orders_router",
    "cart_router",
    "addresses_router",
    "admin_catalog_router",
    "admin_cms_router",
    "admin_orders_router",
    "admin_quotes_router",
    "users_router",
]
