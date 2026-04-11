# app/models/user.py
from datetime import date
from enum import Enum as PyEnum
from typing import Optional

from app.models.base import Base, BaseMixin
from sqlalchemy import CheckConstraint, Date, Enum, Index, String, Text, text
from sqlalchemy.orm import Mapped, mapped_column

_enum_values = lambda enum: [e.value for e in enum]  # noqa: E731


class UserRole(PyEnum):
    CUSTOMER = "customer"
    DEALER = "dealer"
    ADMIN = "admin"


class UserStatus(PyEnum):
    ACTIVE = "active"
    DEACTIVATED = "deactivated"


class User(BaseMixin, Base):
    __tablename__ = "users"

    firstname: Mapped[str] = mapped_column(String(128), nullable=False)
    lastname: Mapped[str] = mapped_column(String(128), nullable=False)
    phone: Mapped[str] = mapped_column(String(32), nullable=False)
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    birthday: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    role: Mapped[UserRole] = mapped_column(
        Enum(
            UserRole,
            name="user_role",
            native_enum=True,
            values_callable=_enum_values,
        ),
        nullable=False,
        server_default=text("'customer'"),
    )
    status: Mapped[UserStatus] = mapped_column(
        Enum(
            UserStatus,
            name="user_status",
            native_enum=True,
            values_callable=_enum_values,
        ),
        nullable=False,
        server_default=text("'active'"),
    )

    __table_args__ = (
        Index("ix_users_phone", "phone", unique=True),
        CheckConstraint("status IN ('active', 'deactivated')", name="ck_users_status_valid"),
    )
