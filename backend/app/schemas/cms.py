# app/schemas/cms.py
from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel


class BannerBase(BaseModel):
    title: str
    image_url: str
    link_url: Optional[str] = None
    position: int
    starts_at: Optional[datetime] = None
    ends_at: Optional[datetime] = None


class BannerCreate(BannerBase):
    pass


class BannerUpdate(BaseModel):
    title: Optional[str] = None
    image_url: Optional[str] = None
    link_url: Optional[str] = None
    position: Optional[int] = None
    starts_at: Optional[datetime] = None
    ends_at: Optional[datetime] = None


class BannerRead(BannerBase):
    id: UUID
    is_active: bool

    model_config = {"from_attributes": True}


class PageContentBase(BaseModel):
    slug: str
    title: str
    body: str


class PageContentCreate(PageContentBase):
    pass


class PageContentUpdate(BaseModel):
    slug: Optional[str] = None
    title: Optional[str] = None
    body: Optional[str] = None


class PageContentRead(PageContentBase):
    id: UUID
    is_active: bool

    model_config = {"from_attributes": True}
