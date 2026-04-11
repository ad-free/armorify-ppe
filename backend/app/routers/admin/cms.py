from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, status

from app.core.database import DbSession
from app.crud.base import CRUDBase
from app.models.cms import Banner, PageContent
from app.schemas.cms import (
    BannerCreate,
    BannerRead,
    BannerUpdate,
    PageContentCreate,
    PageContentRead,
    PageContentUpdate,
)

router = APIRouter(prefix="/admin/cms", tags=["admin-cms"])

banner_crud = CRUDBase[Banner](Banner)
page_crud = CRUDBase[PageContent](PageContent)


@router.get("/banners", response_model=list[BannerRead])
async def list_banners(
    db: DbSession,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    include_inactive: bool = False,
) -> list[Banner]:
    return await banner_crud.get_multi(db, skip=skip, limit=limit, include_inactive=include_inactive)


@router.post("/banners", response_model=BannerRead, status_code=status.HTTP_201_CREATED)
async def create_banner(payload: BannerCreate, db: DbSession) -> Banner:
    return await banner_crud.create(db, payload)


@router.put("/banners/{banner_id}", response_model=BannerRead)
async def update_banner(banner_id: UUID, payload: BannerUpdate, db: DbSession) -> Banner:
    banner = await banner_crud.update(db, banner_id, payload)
    if banner is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Banner not found")
    return banner


@router.delete("/banners/{banner_id}", response_model=BannerRead)
async def soft_delete_banner(banner_id: UUID, db: DbSession) -> Banner:
    banner = await banner_crud.soft_delete(db, banner_id)
    if banner is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Banner not found")
    return banner


@router.get("/pages", response_model=list[PageContentRead])
async def list_pages(
    db: DbSession,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    include_inactive: bool = False,
) -> list[PageContent]:
    return await page_crud.get_multi(db, skip=skip, limit=limit, include_inactive=include_inactive)


@router.post("/pages", response_model=PageContentRead, status_code=status.HTTP_201_CREATED)
async def create_page(payload: PageContentCreate, db: DbSession) -> PageContent:
    return await page_crud.create(db, payload)


@router.put("/pages/{page_id}", response_model=PageContentRead)
async def update_page(page_id: UUID, payload: PageContentUpdate, db: DbSession) -> PageContent:
    page = await page_crud.update(db, page_id, payload)
    if page is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Page content not found")
    return page


@router.delete("/pages/{page_id}", response_model=PageContentRead)
async def soft_delete_page(page_id: UUID, db: DbSession) -> PageContent:
    page = await page_crud.soft_delete(db, page_id)
    if page is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Page content not found")
    return page
