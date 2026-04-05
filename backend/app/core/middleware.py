# app/core/middleware.py
import json

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
from starlette.types import ASGIApp


class SecurityMiddleware(BaseHTTPMiddleware):
    def __init__(self, app: ASGIApp) -> None:
        super().__init__(app)

    async def dispatch(self, request: Request, call_next):
        public_paths = {"/", "/openapi.json", "/docs", "/redoc"}
        public_prefixes = ("/catalog",)
        protected_prefixes = ("/cms", "/orders", "/quotes", "/users")

        if request.url.path in public_paths or any(
            request.url.path.startswith(prefix) for prefix in public_prefixes
        ):
            return await call_next(request)

        if not any(
            request.url.path.startswith(prefix) for prefix in protected_prefixes
        ):
            return await call_next(request)

        authorization = request.headers.get("authorization")
        if not authorization or not authorization.startswith("Bearer "):
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
        return await call_next(request)
