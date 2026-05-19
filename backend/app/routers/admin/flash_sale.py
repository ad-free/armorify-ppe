# app/routers/admin/flash_sale.py
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import delete, select
from sqlalchemy.orm import selectinload

from app.core.database import DbSession
from app.core.deps import require_admin
from app.models.flash_sale import FlashSale, FlashSaleItem
from app.schemas.flash_sale import FlashSaleCreate, FlashSaleRead, FlashSaleUpdate

router = APIRouter(prefix="/admin/flash-sales", tags=["admin-flash-sales"], dependencies=[Depends(require_admin)])


@router.get("", response_model=list[FlashSaleRead])
async def list_flash_sales(db: DbSession):
    stmt = select(FlashSale).options(selectinload(FlashSale.items)).order_by(FlashSale.created_at.desc())
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post("", response_model=FlashSaleRead)
async def create_flash_sale(payload: FlashSaleCreate, db: DbSession):
    if payload.is_active:
        overlap_stmt = select(FlashSale).where(
            FlashSale.is_active.is_(True), FlashSale.start_at < payload.end_at, FlashSale.end_at > payload.start_at
        )
        overlap_result = await db.execute(overlap_stmt)
        if overlap_result.first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="A Flash Sale already exists in this time frame."
            )

    flash_sale = FlashSale(
        name=payload.name, start_at=payload.start_at, end_at=payload.end_at, is_active=payload.is_active
    )
    db.add(flash_sale)
    await db.flush()  # Get ID

    for item_data in payload.items:
        item = FlashSaleItem(
            flash_sale_id=flash_sale.id,
            product_id=item_data.product_id,
            discount_percent=item_data.discount_percent,
            sale_price=item_data.sale_price,
        )
        db.add(item)

    await db.commit()

    # Re-fetch with relationship loaded to avoid lazy-load errors during serialization
    stmt = select(FlashSale).where(FlashSale.id == flash_sale.id).options(selectinload(FlashSale.items))
    result = await db.execute(stmt)
    return result.scalar_one()


@router.get("/{sale_id}", response_model=FlashSaleRead)
async def get_flash_sale(sale_id: UUID, db: DbSession):
    stmt = select(FlashSale).where(FlashSale.id == sale_id).options(selectinload(FlashSale.items))
    result = await db.execute(stmt)
    sale = result.scalar_one_or_none()
    if not sale:
        raise HTTPException(status_code=404, detail="Flash sale not found")
    return sale


@router.put("/{sale_id}", response_model=FlashSaleRead)
async def update_flash_sale(sale_id: UUID, payload: FlashSaleUpdate, db: DbSession):
    stmt = select(FlashSale).where(FlashSale.id == sale_id).options(selectinload(FlashSale.items))
    result = await db.execute(stmt)
    sale = result.scalar_one_or_none()
    if not sale:
        raise HTTPException(status_code=404, detail="Flash sale not found")

    data = payload.model_dump(exclude_unset=True)
    items_data = data.pop("items", None)

    new_start = data.get("start_at", sale.start_at)
    new_end = data.get("end_at", sale.end_at)
    new_is_active = data.get("is_active", sale.is_active)

    if new_is_active:
        overlap_stmt = select(FlashSale).where(
            FlashSale.id != sale_id,
            FlashSale.is_active.is_(True),
            FlashSale.start_at < new_end,
            FlashSale.end_at > new_start,
        )
        overlap_result = await db.execute(overlap_stmt)
        if overlap_result.first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="A Flash Sale already exists in this time frame."
            )

    for field, value in data.items():
        setattr(sale, field, value)

    if items_data is not None:
        # Simple sync: delete old, add new
        await db.execute(delete(FlashSaleItem).where(FlashSaleItem.flash_sale_id == sale_id))
        for item_data in items_data:
            item = FlashSaleItem(
                flash_sale_id=sale_id,
                product_id=item_data["product_id"],
                discount_percent=item_data["discount_percent"],
                sale_price=item_data.get("sale_price"),
            )
            db.add(item)

    await db.commit()

    # Re-fetch with relationship loaded to avoid lazy-load errors during serialization
    stmt = select(FlashSale).where(FlashSale.id == sale_id).options(selectinload(FlashSale.items))
    result = await db.execute(stmt)
    return result.scalar_one()


@router.delete("/{sale_id}")
async def delete_flash_sale(sale_id: UUID, db: DbSession):
    await db.execute(delete(FlashSale).where(FlashSale.id == sale_id))
    await db.commit()
    return {"status": "success"}
