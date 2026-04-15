# app/routers/admin/brands.py
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.database import DbSession
from app.core.deps import require_staff
from app.crud.crud_brand import brand_crud
from app.models.brand import Brand
from app.schemas.brand import BrandCreate, BrandRead, BrandUpdate

router = APIRouter(
    prefix="/admin/catalog/brands",
    tags=["admin-brands"],
    dependencies=[Depends(require_staff)],
)


@router.get("/", response_model=list[BrandRead])
async def list_brands(
    db: DbSession,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    include_inactive: bool = False,
) -> list[Brand]:
    return await brand_crud.get_multi(db, skip=skip, limit=limit, include_inactive=include_inactive)


@router.post("/", response_model=BrandRead, status_code=status.HTTP_201_CREATED)
async def create_brand(payload: BrandCreate, db: DbSession) -> Brand:
    return await brand_crud.create(db, payload)


@router.put("/{brand_id}", response_model=BrandRead)
async def update_brand(brand_id: UUID, payload: BrandUpdate, db: DbSession) -> Brand:
    brand = await brand_crud.update(db, brand_id, payload)
    if brand is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Brand not found")
    return brand


@router.delete("/{brand_id}", response_model=BrandRead)
async def delete_brand(brand_id: UUID, db: DbSession) -> Brand:
    brand = await brand_crud.soft_delete(db, brand_id)
    if brand is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Brand not found")
    return brand
