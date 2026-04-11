# app/routers/protected/cart.py
from uuid import UUID

from app.core.database import DbSession
from app.core.deps import CurrentUser
from app.models.cart import Cart, CartItem
from app.schemas.cart import CartItemCreate, CartItemUpdate, CartRead
from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

router = APIRouter(prefix="/cart", tags=["cart"])


async def _get_or_create_cart(user_id: UUID, db: DbSession) -> Cart:
    result = await db.execute(select(Cart).where(Cart.user_id == user_id, Cart.is_active.is_(True)))
    cart = result.scalar_one_or_none()
    if cart is None:
        cart = Cart(user_id=user_id)
        db.add(cart)
        await db.commit()
        await db.refresh(cart)
    return cart


@router.get("/", response_model=CartRead)
async def get_cart(current_user: CurrentUser, db: DbSession) -> Cart:
    return await _get_or_create_cart(current_user.id, db)


@router.post("/items", response_model=CartRead, status_code=status.HTTP_201_CREATED)
async def add_item(payload: CartItemCreate, current_user: CurrentUser, db: DbSession) -> Cart:
    cart = await _get_or_create_cart(current_user.id, db)
    # If same product+variant already in cart, increment quantity
    result = await db.execute(
        select(CartItem).where(
            CartItem.cart_id == cart.id,
            CartItem.product_id == payload.product_id,
            CartItem.variant_id == payload.variant_id,
            CartItem.is_active.is_(True),
        )
    )
    existing = result.scalar_one_or_none()
    if existing:
        existing.quantity += payload.quantity
        db.add(existing)
    else:
        db.add(CartItem(**payload.model_dump(), cart_id=cart.id))
    await db.commit()
    await db.refresh(cart)
    return cart


@router.put("/items/{item_id}", response_model=CartRead)
async def update_item(item_id: UUID, payload: CartItemUpdate, current_user: CurrentUser, db: DbSession) -> Cart:
    cart = await _get_or_create_cart(current_user.id, db)
    item = await db.get(CartItem, item_id)
    if item is None or item.cart_id != cart.id or not item.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cart item not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(item, field, value)
    db.add(item)
    await db.commit()
    await db.refresh(cart)
    return cart


@router.delete("/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_item(item_id: UUID, current_user: CurrentUser, db: DbSession) -> None:
    cart = await _get_or_create_cart(current_user.id, db)
    item = await db.get(CartItem, item_id)
    if item is None or item.cart_id != cart.id or not item.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cart item not found")
    item.is_active = False
    db.add(item)
    await db.commit()


@router.delete("/", status_code=status.HTTP_204_NO_CONTENT)
async def clear_cart(current_user: CurrentUser, db: DbSession) -> None:
    cart = await _get_or_create_cart(current_user.id, db)
    result = await db.execute(
        select(CartItem).where(CartItem.cart_id == cart.id, CartItem.is_active.is_(True))
    )
    for item in result.scalars().all():
        item.is_active = False
        db.add(item)
    await db.commit()
