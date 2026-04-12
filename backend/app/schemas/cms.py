# app/schemas/cms.py
from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel


class BannerBase(BaseModel):
    title: str
    image_url: str
    link_url: str | None = None
    position: int
    starts_at: Optional[datetime] = None
    ends_at: Optional[datetime] = None


class BannerCreate(BannerBase):
    pass


class BannerUpdate(BaseModel):
    title: str | None = None
    image_url: str | None = None
    link_url: str | None = None
    position: Optional[int] = None
    starts_at: Optional[datetime] = None
    ends_at: Optional[datetime] = None


class BannerRead(BannerBase):
    id: UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PageContentBase(BaseModel):
    slug: str
    title: str
    body: str


class PageContentCreate(PageContentBase):
    pass


class PageContentUpdate(BaseModel):
    slug: str | None = None
    title: str | None = None
    body: str | None = None


class PageContentRead(PageContentBase):
    id: UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
