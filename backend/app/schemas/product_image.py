from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class ProductImageUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    alt_text: str | None = Field(default=None, max_length=255)
    position: int = Field(default=0, ge=0, le=10000, strict=True)
    is_active: bool = True
    is_cover: bool = False


class ProductImageRead(BaseModel):
    id: UUID
    product_id: UUID
    url: str
    alt_text: str | None = None
    position: int
    is_active: bool
    is_cover: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
