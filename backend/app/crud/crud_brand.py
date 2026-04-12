# app/crud/crud_brand.py
from app.crud.base import CRUDBase
from app.models.brand import Brand

brand_crud = CRUDBase[Brand](Brand)
