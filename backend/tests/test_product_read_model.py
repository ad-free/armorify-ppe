"""Read-model invariants: variant ownership and authoritative balances across every active mix."""

from uuid import uuid4

import pytest
from app.models.product import Product, ProductVariant

pytestmark = pytest.mark.anyio

STOCKS = (0, 5, 12)


def stock_status(balance):
    return "out_of_stock" if balance == 0 else "low_stock" if balance < 10 else "in_stock"


async def test_balances_follow_active_mixes_exhaustively(checkout_db):
    db = checkout_db
    async with db.sessions() as session:
        base = await session.get(Product, db.product_id)
        assert (base.has_variants, base.available_stock, base.stock_status) == (
            False,
            10,
            "in_stock",
        )
    identities = [uuid4() for _ in range(len(STOCKS))]
    async with db.sessions.begin() as session:
        for identity, stock, size in zip(identities, STOCKS, ("S", "M", "L")):
            session.add(
                ProductVariant(
                    id=identity,
                    product_id=db.product_id,
                    sku=f"PROP-{size}",
                    size=size,
                    stock=stock,
                )
            )
    for mask in range(2 ** len(STOCKS)):
        for position, identity in enumerate(identities):
            await db.change(ProductVariant, identity, is_active=bool(mask & (1 << position)))
        async with db.sessions() as session:
            product = await session.get(Product, db.product_id)
            expected = sum(stock for position, stock in enumerate(STOCKS) if mask & (1 << position))
            assert product.has_variants is True
            assert product.available_stock == expected
            assert product.stock_status == stock_status(expected)
