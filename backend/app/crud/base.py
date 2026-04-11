# app/crud/base.py
from typing import Any, Generic, Protocol, TypeVar
from uuid import UUID

from app.models.base import Base
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.inspection import inspect


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
        skip: int = 0,
        limit: int = 100,
        include_inactive: bool = False,
    ) -> list[ModelType]:
        stmt = select(self.model)
        if not include_inactive:
            stmt = stmt.where(self.model.is_active.is_(True))
        stmt = stmt.offset(skip).limit(limit)
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
        if hasattr(instance, "status"):
            current_status = getattr(instance, "status", None)
            if current_status is not None:
                status_type = type(current_status)
                if hasattr(status_type, "DEACTIVATED"):
                    setattr(instance, "status", status_type.DEACTIVATED)
            else:
                status_column = inspect(self.model).columns.get("status")
                if status_column is not None:
                    status_enum = getattr(status_column.type, "enum_class", None)
                    if status_enum is not None and hasattr(status_enum, "DEACTIVATED"):
                        setattr(instance, "status", status_enum.DEACTIVATED)
        db.add(instance)
        await db.commit()
        await db.refresh(instance)
        return instance
