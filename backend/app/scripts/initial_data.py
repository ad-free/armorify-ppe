# app/scripts/initial_data.py — bootstrap admin user only
import asyncio

import bcrypt
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from app.core.database import AsyncSessionLocal
from app.core.settings import settings
from app.models.user import User, UserRole, UserStatus


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


async def create_admin():
    async with AsyncSessionLocal() as db:
        # Check if admin already exists
        result = await db.execute(select(User).where(User.phone == settings.admin_username))
        admin = result.scalar_one_or_none()

        if admin:
            print(f"Admin user '{settings.admin_username}' already exists.")
            return

        print(f"Creating admin user '{settings.admin_username}'...")
        admin = User(
            firstname="System",
            lastname="Admin",
            phone=settings.admin_username,
            email="admin@armorify.com",
            role=UserRole.ADMIN,
            status=UserStatus.ACTIVE,
            password_hash=hash_password(settings.admin_password),
        )
        db.add(admin)
        try:
            await db.commit()
            print("Admin user created successfully.")
        except IntegrityError:
            await db.rollback()
            print(f"Admin user '{settings.admin_username}' was created by another process.")


if __name__ == "__main__":
    asyncio.run(create_admin())
