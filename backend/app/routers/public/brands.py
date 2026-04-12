# app/routers/public/brands.py
from uuid import UUID

from app.core.database import DbSession
from app.crud.crud_brand import brand_crud
from app.models.brand import Brand
from app.schemas.brand import BrandRead
from fastapi import APIRouter, HTTPException, status

router = APIRouter(prefix="/api/v1/catalog/brands", tags=["public-brands"])


@router.get("/", response_model=list[BrandRead])
async def list_brands(db: DbSession) -> list[Brand]:
    return await brand_crud.get_multi(db, limit=500)


@router.get("/{brand_id}", response_model=BrandRead)
async def get_brand(brand_id: UUID, db: DbSession) -> Brand:
    brand = await brand_crud.get(db, brand_id)
    if brand is None or not brand.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Brand not found")
    return brand
