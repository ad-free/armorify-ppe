# app/main.py
from app.core.middleware import SecurityMiddleware
from app.core.settings import settings
from app.routers import (
    admin_catalog_router,
    admin_cms_router,
    admin_orders_router,
    admin_quotes_router,
    public_catalog_router,
    public_cms_router,
    public_orders_router,
    users_router,
)
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse

app = FastAPI(title=settings.app_name, docs_url="/")
app.add_middleware(SecurityMiddleware)
app.include_router(users_router, prefix="/api/v1")
app.include_router(public_catalog_router, prefix="/api/v1")
app.include_router(public_orders_router, prefix="/api/v1")
app.include_router(public_cms_router, prefix="/api/v1")
app.include_router(admin_catalog_router, prefix="/api/v1")
app.include_router(admin_orders_router, prefix="/api/v1")
app.include_router(admin_quotes_router, prefix="/api/v1")
app.include_router(admin_cms_router, prefix="/api/v1")


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
    )


@app.get("/")
async def health_check() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
