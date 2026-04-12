# app/routers/auth.py
from datetime import timedelta

from fastapi import APIRouter, HTTPException, status
from jose import JWTError, jwt
from sqlalchemy import select

from app.core.database import DbSession
from app.core.deps import CurrentUser
from app.core.security import create_access_token, hash_password, verify_password
from app.core.settings import settings
from app.models.user import User, UserRole, UserStatus
from app.schemas.user import (
    LoginRequest,
    RefreshRequest,
    RegisterRequest,
    TokenResponse,
    UserRead,
)

router = APIRouter(prefix="/auth", tags=["auth"])


def _make_token_pair(user: User) -> TokenResponse:
    base = {"sub": str(user.id), "role": user.role.value}
    access = create_access_token(base, timedelta(minutes=settings.access_token_expire_minutes))
    refresh = create_access_token({**base, "type": "refresh"}, timedelta(days=settings.refresh_token_expire_days))
    return TokenResponse(access_token=access, refresh_token=refresh)


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(payload: RegisterRequest, db: DbSession) -> TokenResponse:
    existing = await db.execute(select(User).where(User.phone == payload.phone))
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Phone number already registered")

    user = User(
        firstname=payload.firstname,
        lastname=payload.lastname,
        phone=payload.phone,
        email=payload.email,
        role=UserRole.CUSTOMER,
        status=UserStatus.ACTIVE,
        password_hash=hash_password(payload.password),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return _make_token_pair(user)


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, db: DbSession) -> TokenResponse:
    result = await db.execute(select(User).where(User.phone == payload.phone, User.is_active.is_(True)))
    user = result.scalar_one_or_none()
    if user is None or not user.password_hash or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    if user.status == UserStatus.DEACTIVATED:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account deactivated")
    return _make_token_pair(user)


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(payload: RefreshRequest, db: DbSession) -> TokenResponse:
    try:
        data = jwt.decode(payload.refresh_token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
        if data.get("type") != "refresh":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")
        user_id: str = data["sub"]
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    user = await db.get(User, user_id)
    if user is None or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return _make_token_pair(user)


@router.get("/me", response_model=UserRead)
async def me(current_user: CurrentUser) -> User:
    return current_user
