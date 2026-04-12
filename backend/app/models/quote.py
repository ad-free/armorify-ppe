# app/models/quote.py
from enum import Enum as PyEnum

from app.models.base import Base, BaseMixin
from sqlalchemy import Enum, ForeignKey, Index, Integer, String, Text, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

_enum_values = lambda enum: [e.value for e in enum]  # noqa: E731


class QuoteStatus(PyEnum):
    PENDING = "pending"
    IN_REVIEW = "in_review"
    QUOTED = "quoted"
    ACCEPTED = "accepted"
    REJECTED = "rejected"


class QuoteRequest(BaseMixin, Base):
    __tablename__ = "quote_requests"

    user_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
    )
    company_name: Mapped[str] = mapped_column(String(255), nullable=False)
    contact_phone: Mapped[str] = mapped_column(String(32), nullable=False)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[QuoteStatus] = mapped_column(
        Enum(
            QuoteStatus,
            name="quote_status",
            native_enum=True,
            values_callable=_enum_values,
        ),
        nullable=False,
        server_default=text("'pending'"),
    )
    items: Mapped[list["QuoteItem"]] = relationship(back_populates="quote")

    __table_args__ = (Index("ix_quote_requests_user_id", "user_id"),)


class QuoteItem(BaseMixin, Base):
    __tablename__ = "quote_items"

    quote_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("quote_requests.id", ondelete="CASCADE"),
        nullable=False,
    )
    product_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("products.id", ondelete="RESTRICT"),
        nullable=False,
    )
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    quote: Mapped[QuoteRequest] = relationship(back_populates="items")
