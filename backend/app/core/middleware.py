# app/core/middleware.py
import json

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
from starlette.types import ASGIApp

_PUBLIC_PATHS = {"/", "/health", "/openapi.json", "/docs", "/redoc"}
_PUBLIC_PREFIXES = (
    "/api/v1/catalog",
    "/api/v1/cms",
    "/api/v1/auth",
)
_PROTECTED_PREFIXES = (
    "/api/v1/cart",
    "/api/v1/me",
    "/api/v1/orders",
    "/api/v1/users",
    "/api/v1/admin",
    "/api/v1/quotes",
)


class SecurityMiddleware(BaseHTTPMiddleware):
    def __init__(self, app: ASGIApp) -> None:
        super().__init__(app)

    async def dispatch(self, request: Request, call_next: object) -> Response:
        path = request.url.path

        if path in _PUBLIC_PATHS or any(path.startswith(p) for p in _PUBLIC_PREFIXES):
            return await call_next(request)  # type: ignore[arg-type]

        if not any(path.startswith(p) for p in _PROTECTED_PREFIXES):
            return await call_next(request)  # type: ignore[arg-type]

        authorization = request.headers.get("authorization", "")
        if not authorization.startswith("Bearer "):
            return Response(
                content=json.dumps({"detail": "Bearer token required"}),
                status_code=401,
                media_type="application/json",
            )
        token = authorization.removeprefix("Bearer ").strip()
        if not token:
            return Response(
                content=json.dumps({"detail": "Bearer token required"}),
                status_code=401,
                media_type="application/json",
            )
        request.state.token = token
        return await call_next(request)  # type: ignore[arg-type]
