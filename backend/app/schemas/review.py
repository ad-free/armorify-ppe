# app/schemas/review.py
from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class _ReviewBody(BaseModel):
    author_name: Optional[str] = None
    rating: int = Field(..., ge=1, le=5)
    body: str | None = None


class ReviewCreate(_ReviewBody):
    pass


class ReviewUpdate(BaseModel):
    author_name: str | None = None
    rating: Optional[int] = Field(default=None, ge=1, le=5)
    body: str | None = None
    is_approved: bool | None = None
    is_active: bool | None = None


class ReviewRead(_ReviewBody):
    id: UUID
    product_id: UUID
    product_name: Optional[str] = None
    product_image: Optional[str] = None
    author_avatar: Optional[str] = None
    user_id: UUID | None = None
    is_approved: bool
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
