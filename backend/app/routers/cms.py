# app/routers/cms.py
from typing import List
from uuid import UUID

from app.core.database import get_db
from app.models.cms import Banner, PageContent
from app.schemas.cms import (
    BannerCreate,
    BannerRead,
    BannerUpdate,
    PageContentCreate,
    PageContentRead,
    PageContentUpdate,
)
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/cms", tags=["cms"])


@router.get("/banners", response_model=List[BannerRead])
async def list_banners(db: AsyncSession = Depends(get_db)) -> List[Banner]:
    result = await db.execute(select(Banner).where(Banner.is_active.is_(True)))
    return result.scalars().all()


@router.post("/banners", response_model=BannerRead, status_code=status.HTTP_201_CREATED)
async def create_banner(banner_in: BannerCreate, db: AsyncSession = Depends(get_db)) -> Banner:
    banner = Banner(**banner_in.model_dump())
    db.add(banner)
    await db.commit()
    await db.refresh(banner)
    return banner


@router.put("/banners/{banner_id}", response_model=BannerRead)
async def update_banner(banner_id: UUID, banner_update: BannerUpdate, db: AsyncSession = Depends(get_db)) -> Banner:
    banner = await db.get(Banner, banner_id)
    if banner is None or not banner.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Banner not found")
    data = banner_update.model_dump(exclude_unset=True)
    for field, value in data.items():
        setattr(banner, field, value)
    db.add(banner)
    await db.commit()
    await db.refresh(banner)
    return banner


@router.delete("/banners/{banner_id}", response_model=BannerRead)
async def soft_delete_banner(banner_id: UUID, db: AsyncSession = Depends(get_db)) -> Banner:
    banner = await db.get(Banner, banner_id)
    if banner is None or not banner.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Banner not found")
    banner.is_active = False
    db.add(banner)
    await db.commit()
    await db.refresh(banner)
    return banner


@router.get("/pages", response_model=List[PageContentRead])
async def list_page_contents(db: AsyncSession = Depends(get_db)) -> List[PageContent]:
    result = await db.execute(select(PageContent).where(PageContent.is_active.is_(True)))
    return result.scalars().all()


@router.post("/pages", response_model=PageContentRead, status_code=status.HTTP_201_CREATED)
async def create_page_content(page_in: PageContentCreate, db: AsyncSession = Depends(get_db)) -> PageContent:
    page = PageContent(**page_in.model_dump())
    db.add(page)
    await db.commit()
    await db.refresh(page)
    return page


@router.put("/pages/{page_id}", response_model=PageContentRead)
async def update_page_content(
    page_id: UUID,
    page_update: PageContentUpdate,
    db: AsyncSession = Depends(get_db)
) -> PageContent:
    page = await db.get(PageContent, page_id)
    if page is None or not page.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Page content not found")
    data = page_update.model_dump(exclude_unset=True)
    for field, value in data.items():
        setattr(page, field, value)
    db.add(page)
    await db.commit()
    await db.refresh(page)
    return page


@router.delete("/pages/{page_id}", response_model=PageContentRead)
async def soft_delete_page_content(page_id: UUID, db: AsyncSession = Depends(get_db)) -> PageContent:
    page = await db.get(PageContent, page_id)
    if page is None or not page.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Page content not found")
    page.is_active = False
    db.add(page)
    await db.commit()
    await db.refresh(page)
    return page
