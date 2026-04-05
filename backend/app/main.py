# app/main.py
from app.core.middleware import SecurityMiddleware
from app.core.settings import settings
from app.routers import (
    catalog_router,
    cms_router,
    orders_router,
    quotes_router,
    users_router,
)
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse

app = FastAPI(title=settings.app_name, docs_url="/")
app.add_middleware(SecurityMiddleware)
app.include_router(users_router)
app.include_router(catalog_router)
app.include_router(orders_router)
app.include_router(quotes_router)
app.include_router(cms_router)


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
