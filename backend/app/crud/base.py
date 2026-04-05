# app/crud/base.py
from typing import Any, Generic, Protocol, TypeVar
from uuid import UUID

from app.models.base import Base
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession


class HasModelDump(Protocol):
    def model_dump(self, **kwargs: Any) -> dict[str, Any]: ...


ModelType = TypeVar("ModelType", bound=Base)
CreateSchema = TypeVar("CreateSchema", bound=HasModelDump)
UpdateSchema = TypeVar("UpdateSchema", bound=HasModelDump)


class CRUDBase(Generic[ModelType, CreateSchema, UpdateSchema]):
    def __init__(self, model: type[ModelType]) -> None:
        self.model = model

    async def get(self, db: AsyncSession, id: UUID) -> ModelType | None:
        result = await db.get(self.model, id)
        return result

    async def get_multi(
        self,
        db: AsyncSession,
        include_inactive: bool = False,
    ) -> list[ModelType]:
        stmt = select(self.model)
        if not include_inactive:
            stmt = stmt.where(self.model.is_active.is_(True))
        result = await db.execute(stmt)
        return result.scalars().all()

    async def create(self, db: AsyncSession, schema: CreateSchema) -> ModelType:
        data = schema.model_dump()
        instance = self.model(**data)
        db.add(instance)
        await db.commit()
        await db.refresh(instance)
        return instance

    async def update(self, db: AsyncSession, id: UUID, schema: UpdateSchema) -> ModelType | None:
        instance = await self.get(db, id)
        if instance is None:
            return None
        data = schema.model_dump(exclude_unset=True)
        for field, value in data.items():
            if hasattr(instance, field):
                setattr(instance, field, value)
        db.add(instance)
        await db.commit()
        await db.refresh(instance)
        return instance

    async def soft_delete(self, db: AsyncSession, id: UUID) -> ModelType | None:
        instance = await self.get(db, id)
        if instance is None:
            return None
        instance.is_active = False
        if hasattr(instance, "status") and instance.status is not None:
            status_type = type(instance.status)
            if hasattr(status_type, "DEACTIVATED"):
                instance.status = status_type.DEACTIVATED
        db.add(instance)
        await db.commit()
        await db.refresh(instance)
        return instance
