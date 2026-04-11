from app.core.database import DbSession
from app.models.cms import Banner, PageContent
from app.schemas.cms import BannerRead, PageContentRead
from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

router = APIRouter(prefix="/cms", tags=["public-cms"])


@router.get("/banners", response_model=list[BannerRead])
async def list_banners(db: DbSession) -> list[Banner]:
    stmt = select(Banner).where(Banner.is_active.is_(True))
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/pages/slug/{slug}", response_model=PageContentRead)
async def get_page_by_slug(slug: str, db: DbSession) -> PageContent:
    stmt = select(PageContent).where(PageContent.slug == slug, PageContent.is_active.is_(True))
    result = await db.execute(stmt)
    page = result.scalar_one_or_none()
    if page is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Page content not found")
    return page
