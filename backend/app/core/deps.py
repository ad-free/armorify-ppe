# app/core/deps.py
from typing import Annotated

from app.models.user import User
from fastapi import Depends


def get_current_user() -> User:
    raise NotImplementedError

CurrentUser = Annotated[User, Depends(get_current_user)]
