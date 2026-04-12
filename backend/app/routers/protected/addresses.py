# app/routers/protected/addresses.py
from uuid import UUID

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select, update

from app.core.database import DbSession
from app.core.deps import CurrentUser
from app.models.user import Address
from app.schemas.user import AddressCreate, AddressRead, AddressUpdate

router = APIRouter(prefix="/me/addresses", tags=["addresses"])


@router.get("/", response_model=list[AddressRead])
async def list_addresses(current_user: CurrentUser, db: DbSession) -> list[Address]:
    result = await db.execute(select(Address).where(Address.user_id == current_user.id, Address.is_active.is_(True)))
    return list(result.scalars().all())


@router.post("/", response_model=AddressRead, status_code=status.HTTP_201_CREATED)
async def create_address(payload: AddressCreate, current_user: CurrentUser, db: DbSession) -> Address:
    if payload.is_default:
        await db.execute(update(Address).where(Address.user_id == current_user.id).values(is_default=False))
    address = Address(**payload.model_dump(), user_id=current_user.id)
    db.add(address)
    await db.commit()
    await db.refresh(address)
    return address


@router.put("/{address_id}", response_model=AddressRead)
async def update_address(address_id: UUID, payload: AddressUpdate, current_user: CurrentUser, db: DbSession) -> Address:
    address = await db.get(Address, address_id)
    if address is None or address.user_id != current_user.id or not address.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Address not found")
    if payload.is_default:
        await db.execute(update(Address).where(Address.user_id == current_user.id).values(is_default=False))
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(address, field, value)
    db.add(address)
    await db.commit()
    await db.refresh(address)
    return address


@router.delete("/{address_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_address(address_id: UUID, current_user: CurrentUser, db: DbSession) -> None:
    address = await db.get(Address, address_id)
    if address is None or address.user_id != current_user.id or not address.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Address not found")
    address.is_active = False
    db.add(address)
    await db.commit()
