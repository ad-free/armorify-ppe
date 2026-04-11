from .addresses import router as addresses_router
from .cart import router as cart_router
from .orders import router as protected_orders_router

__all__ = ["addresses_router", "cart_router", "protected_orders_router"]
