# app/crud/crud_product_image.py
from app.crud.base import CRUDBase
from app.models.product_image import ProductImage

product_image_crud = CRUDBase[ProductImage](ProductImage)
