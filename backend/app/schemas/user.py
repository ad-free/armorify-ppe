# app/schemas/user.py
from datetime import date, datetime
from typing import Optional
from uuid import UUID

from app.models.user import UserRole, UserStatus
from pydantic import BaseModel, EmailStr, field_validator


class UserBase(BaseModel):
    firstname: str
    lastname: str
    phone: str
    email: Optional[str] = None
    address: Optional[str] = None
    birthday: Optional[date] = None
    role: UserRole = UserRole.CUSTOMER


class UserCreate(UserBase):
    pass


class UserUpdate(BaseModel):
    firstname: Optional[str] = None
    lastname: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    birthday: Optional[date] = None
    role: Optional[UserRole] = None


class UserRead(UserBase):
    id: UUID
    status: UserStatus
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ── Auth ──────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    firstname: str
    lastname: str
    phone: str
    email: Optional[EmailStr] = None
    password: str

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


class LoginRequest(BaseModel):
    phone: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


# ── Address ───────────────────────────────────────────────

class AddressBase(BaseModel):
    label: Optional[str] = None
    recipient_name: str
    phone: str
    address_line: str
    city: str
    province: Optional[str] = None
    is_default: bool = False


class AddressCreate(AddressBase):
    pass


class AddressUpdate(BaseModel):
    label: Optional[str] = None
    recipient_name: Optional[str] = None
    phone: Optional[str] = None
    address_line: Optional[str] = None
    city: Optional[str] = None
    province: Optional[str] = None
    is_default: Optional[bool] = None


class AddressRead(AddressBase):
    id: UUID
    user_id: UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
