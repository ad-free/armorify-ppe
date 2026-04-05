# app/routers/__init__.py
from .catalog import router as catalog_router
from .cms import router as cms_router
from .orders import router as orders_router
from .quotes import router as quotes_router
from .users import router as users_router

__all__ = [
    "catalog_router",
    "cms_router", 
    "orders_router",
    "quotes_router",
    "users_router",
]
