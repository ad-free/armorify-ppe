# app/schemas/user.py
from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.models.user import UserRole, UserStatus


class UserBase(BaseModel):
    firstname: str
    lastname: str
    phone: str
    email: str | None = None
    address: str | None = None
    birthday: date | None = None
    role: UserRole = UserRole.CUSTOMER


class UserCreate(UserBase):
    status: UserStatus = Field(UserStatus.ACTIVE, json_schema_extra={"x-ui-order": 6})
    password: str = Field(json_schema_extra={"x-ui-widget": "password", "x-ui-order": 20})


class UserUpdate(BaseModel):
    firstname: str | None = None
    lastname: str | None = None
    phone: str | None = None
    email: str | None = None
    address: str | None = None
    birthday: date | None = None
    role: UserRole | None = None
    status: UserStatus | None = None
    password: str | None = Field(None, json_schema_extra={"x-ui-widget": "password", "x-ui-order": 20})


class UserRead(UserBase):
    id: UUID = Field(json_schema_extra={"x-ui-priority": True, "x-ui-order": 0})
    firstname: str = Field(json_schema_extra={"x-ui-priority": True, "x-ui-order": 1})
    lastname: str = Field(json_schema_extra={"x-ui-priority": True, "x-ui-order": 2})
    phone: str = Field(json_schema_extra={"x-ui-priority": True, "x-ui-order": 3})
    email: str | None = Field(None, json_schema_extra={"x-ui-priority": True, "x-ui-order": 4})
    role: UserRole = Field(UserRole.CUSTOMER, json_schema_extra={"x-ui-priority": True, "x-ui-order": 5})
    status: UserStatus = Field(json_schema_extra={"x-ui-priority": True, "x-ui-order": 6})
    is_active: bool = Field(json_schema_extra={"x-ui-hidden": True})
    created_at: datetime = Field(json_schema_extra={"x-ui-order": 100})
    updated_at: datetime = Field(json_schema_extra={"x-ui-order": 101})

    model_config = {"from_attributes": True}


# ── Auth ──────────────────────────────────────────────────


class RegisterRequest(BaseModel):
    firstname: str
    lastname: str
    phone: str
    email: EmailStr | None = None
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
    label: str | None = None
    recipient_name: str
    phone: str
    address_line: str
    city: str
    province: str | None = None
    is_default: bool = False


class AddressCreate(AddressBase):
    pass


class AddressUpdate(BaseModel):
    label: str | None = None
    recipient_name: str | None = None
    phone: str | None = None
    address_line: str | None = None
    city: str | None = None
    province: str | None = None
    is_default: bool | None = None


class AddressRead(AddressBase):
    id: UUID
    user_id: UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
