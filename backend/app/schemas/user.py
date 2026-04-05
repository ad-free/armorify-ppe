# app/schemas/user.py
from datetime import date, datetime
from typing import Optional
from uuid import UUID

from app.models.user import UserRole, UserStatus
from pydantic import BaseModel


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
