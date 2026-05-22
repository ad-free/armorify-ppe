# app/main.py
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text

from app.core.database import DbSession

from app.core.deps import get_current_user, require_admin, require_staff
from app.core.middleware import SecurityMiddleware
from app.core.settings import settings
from app.routers import (
    addresses_router,
    admin_blog_router,
    admin_brands_router,
    admin_catalog_router,
    admin_cms_router,
    admin_dashboard_router,
    admin_flash_sale_router,
    admin_orders_router,
    admin_product_images_router,
    admin_quotes_router,
    admin_reviews_router,
    admin_users_router,
    auth_router,
    cart_router,
    protected_orders_router,
    public_blog_router,
    public_catalog_router,
    public_cms_router,
    public_orders_router,
    users_router,
)
from app.routers.public.brands import router as public_brands_router
from app.routers.public.product_images import router as public_product_images_router
from app.routers.public.related import router as public_related_products_router
from app.routers.public.reviews import router as public_product_reviews_router
from app.scripts.initial_data import create_admin


@asynccontextmanager
async def lifespan(app: FastAPI):
    await create_admin()
    yield


app = FastAPI(
    title=settings.app_name,
    docs_url="/",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    swagger_ui_parameters={
        "persistAuthorization": True,
    },
    lifespan=lifespan,
)

static_dir = Path(__file__).resolve().parent.parent / "static"
app.mount("/static", StaticFiles(directory=static_dir), name="static")
app.add_middleware(SecurityMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)

# ── Public (no auth) ──────────────────────────────────────────────────────────
app.include_router(auth_router, prefix="/api/v1")
app.include_router(public_catalog_router, prefix="/api/v1")
app.include_router(public_brands_router)
app.include_router(public_product_images_router)
app.include_router(public_related_products_router)
app.include_router(public_product_reviews_router)
app.include_router(public_cms_router, prefix="/api/v1")
app.include_router(public_orders_router, prefix="/api/v1")
app.include_router(public_blog_router, prefix="/api/v1")

# ── Protected (any authenticated user) ───────────────────────────────────────
_auth = [Depends(get_current_user)]
app.include_router(cart_router, prefix="/api/v1", dependencies=_auth)
app.include_router(addresses_router, prefix="/api/v1", dependencies=_auth)
app.include_router(protected_orders_router, prefix="/api/v1", dependencies=_auth)
app.include_router(users_router, prefix="/api/v1", dependencies=_auth)

# ── Staff (staff + admin) ─────────────────────────────────────────────────────
_staff = [Depends(require_staff)]
app.include_router(admin_catalog_router, prefix="/api/v1", dependencies=_staff)
app.include_router(admin_brands_router, prefix="/api/v1", dependencies=_staff)
app.include_router(admin_cms_router, prefix="/api/v1", dependencies=_staff)
app.include_router(admin_product_images_router, prefix="/api/v1", dependencies=_staff)
app.include_router(admin_reviews_router, prefix="/api/v1", dependencies=_staff)
app.include_router(admin_flash_sale_router, prefix="/api/v1", dependencies=_staff)
app.include_router(admin_blog_router, prefix="/api/v1", dependencies=_staff)

# ── Admin only ────────────────────────────────────────────────────────────────
_admin = [Depends(require_admin)]
app.include_router(admin_orders_router, prefix="/api/v1", dependencies=_admin)
app.include_router(admin_quotes_router, prefix="/api/v1", dependencies=_admin)
app.include_router(admin_users_router, prefix="/api/v1", dependencies=_admin)
app.include_router(admin_dashboard_router, prefix="/api/v1", dependencies=_admin)


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


@app.get("/health", tags=["health"])
async def health(db: DbSession) -> dict[str, str]:
    try:
        await db.execute(text("SELECT 1"))
        db_status = "ok"
    except Exception:
        db_status = "error"
    return {"status": "ok", "db": db_status}
