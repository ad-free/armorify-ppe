# app/schemas/flash_sale.py
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field
from typing import List, Optional

class FlashSaleItemBase(BaseModel):
    product_id: UUID
    discount_percent: float = 0.0
    sale_price: Optional[float] = None

class FlashSaleItemCreate(FlashSaleItemBase):
    pass

class FlashSaleItemRead(FlashSaleItemBase):
    id: UUID
    is_active: bool
    
    model_config = {"from_attributes": True}

class FlashSaleBase(BaseModel):
    name: str = Field(title="Name")
    start_at: datetime = Field(title="Start At")
    end_at: datetime = Field(title="End At")
    is_active: bool = Field(default=True, title="Is Active")

class FlashSaleCreate(FlashSaleBase):
    items: List[FlashSaleItemCreate] = Field(default_factory=list, title="Products")

class FlashSaleUpdate(BaseModel):
    name: Optional[str] = None
    start_at: Optional[datetime] = None
    end_at: Optional[datetime] = None
    is_active: Optional[bool] = None
    items: Optional[List[FlashSaleItemCreate]] = None

from app.schemas.product import ProductRead

class FlashSaleRead(FlashSaleBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    items: List[FlashSaleItemRead] = []
    
    model_config = {"from_attributes": True}

class FlashSalePublicRead(FlashSaleBase):
    id: UUID
    products: List[ProductRead] = []
    
    model_config = {"from_attributes": True}
