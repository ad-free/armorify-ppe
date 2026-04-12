# app/routers/admin/users.py
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, status

from app.core.database import DbSession
from app.core.security import hash_password
from app.crud.base import CRUDBase
from app.models.user import User, UserStatus
from app.schemas.user import UserCreate, UserRead, UserUpdate

router = APIRouter(prefix="/admin/users", tags=["admin-users"])

user_crud = CRUDBase[User](User)


@router.get("", response_model=list[UserRead])
async def list_users(
    db: DbSession,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    include_inactive: bool = True,
) -> list[User]:
    """
    List all users with pagination. Admin can see inactive users by default.
    """
    return await user_crud.get_multi(db, skip=skip, limit=limit, include_inactive=include_inactive)


@router.post("", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def create_user(payload: UserCreate, db: DbSession) -> User:
    data = payload.model_dump()
    if data.get("password"):
        data["password_hash"] = hash_password(data.pop("password"))

    user = User(**data)
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@router.get("/{user_id}", response_model=UserRead)
async def get_user(user_id: UUID, db: DbSession) -> User:
    user = await db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


@router.put("/{user_id}", response_model=UserRead)
async def update_user(user_id: UUID, payload: UserUpdate, db: DbSession) -> User:
    user = await db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    update_data = payload.model_dump(exclude_unset=True)
    if "password" in update_data and update_data["password"]:
        update_data["password_hash"] = hash_password(update_data.pop("password"))
    elif "password" in update_data:
        update_data.pop("password")

    for field, value in update_data.items():
        if hasattr(user, field):
            setattr(user, field, value)

    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@router.delete("/{user_id}", response_model=UserRead)
async def delete_user(user_id: UUID, db: DbSession) -> User:
    user = await user_crud.soft_delete(db, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


@router.post("/{user_id}/restore", response_model=UserRead)
async def restore_user(user_id: UUID, db: DbSession) -> User:
    user = await db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    user.is_active = True
    user.status = UserStatus.ACTIVE
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user
