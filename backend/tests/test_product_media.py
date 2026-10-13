"""Managed media regressions; files only in tmp_path, DB only in guarded checkout fixture."""

import asyncio
import io
import re
from uuid import uuid4

import pytest
from app.core.product_media import encode_image
from app.core.settings import settings
from app.models.product import Product
from app.models.product_image import ProductImage
from app.models.user import User, UserRole
from app.routers.admin.catalog import router as catalog_router
from app.routers.admin.product_images import router
from fastapi import HTTPException
from PIL import Image
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

pytestmark = pytest.mark.anyio
BASE = "/api/v1/admin/catalog/product-images"


def pixels(fmt="PNG", size=(8, 8)):
    output = io.BytesIO()
    Image.new("RGB", size, "red").save(output, format=fmt)
    return output.getvalue()


@pytest.fixture
async def media(checkout_db, tmp_path, monkeypatch):
    monkeypatch.setattr(settings, "product_media_dir", tmp_path)
    checkout_db.app.include_router(router, prefix="/api/v1")
    checkout_db.app.include_router(catalog_router, prefix="/api/v1")
    await checkout_db.change(User, checkout_db.user_id, role=UserRole.STAFF)
    checkout_db.client.headers.update(checkout_db.auth())
    return checkout_db


async def upload(db, data=None, filename="test.png", product_id=None, **fields):
    return await db.client.post(
        f"{BASE}/products/{product_id or db.product_id}/upload",
        files={"file": (filename, pixels() if data is None else data, "application/octet-stream")},
        data=fields,
    )


@pytest.mark.parametrize("fmt,extension", [("JPEG", "jpg"), ("PNG", "png"), ("WEBP", "webp")])
async def test_validated_format_canonical_filename_and_metadata_removal(media, tmp_path, fmt, extension):
    response = await upload(media, pixels(fmt), f"../../danger.{extension.upper()}", alt_text="Helmet", position="3")
    assert response.status_code == 201, response.text
    image = response.json()
    assert re.fullmatch(rf"/static/product-images/[a-f0-9]{{32}}\.{extension}", image["url"])
    assert image["alt_text"] == "Helmet" and image["position"] == 3 and image["is_cover"]
    path = tmp_path / image["url"].rsplit("/", 1)[1]
    with Image.open(path) as decoded:
        decoded.load()
        assert decoded.format == fmt and decoded.size == (8, 8)
        assert not decoded.getexif() and "comment" not in decoded.info
    assert str(tmp_path) not in response.text


@pytest.mark.parametrize(
    "data,filename",
    [
        (b"<svg xmlns='http://www.w3.org/2000/svg'/>", "x.svg"),
        (b"MZ executable", "x.png"),
        (b"not an image", "x.jpg"),
        (pixels("PNG"), "x.jpg"),
        (pixels("JPEG"), "x.png"),
        (pixels(), "x.exe"),
        (pixels(), "x"),
        (pixels()[:-8], "x.png"),
        (pixels() + b"<script>payload</script>", "x.png"),
        (pixels("JPEG") + b"MZ", "x.jpg"),
        (pixels("WEBP") + b"MZ", "x.webp"),
    ],
)
async def test_invalid_payloads_create_neither_rows_nor_files(media, tmp_path, data, filename):
    response = await upload(media, data, filename)
    assert response.status_code == 422, response.text
    assert not list(tmp_path.iterdir())
    async with media.sessions() as session:
        assert not (await session.scalars(select(ProductImage))).all()


async def test_byte_pixel_bounds_and_animation(media, tmp_path, monkeypatch):
    monkeypatch.setattr(settings, "product_image_max_bytes", 32)
    assert (await upload(media)).status_code == 413
    monkeypatch.setattr(settings, "product_image_max_bytes", 8 * 1024 * 1024)
    monkeypatch.setattr(settings, "product_image_max_pixels", 63)
    assert (await upload(media)).status_code == 422
    monkeypatch.setattr(settings, "product_image_max_pixels", 64)
    assert (await upload(media)).status_code == 201
    output = io.BytesIO()
    Image.new("RGB", (2, 2), "red").save(
        output, format="WEBP", save_all=True, append_images=[Image.new("RGB", (2, 2), "blue")], duration=100
    )
    assert (await upload(media, output.getvalue(), "animated.webp")).status_code == 422
    assert len(list(tmp_path.iterdir())) == 1


@pytest.mark.parametrize("fields", [{"position": "-1"}, {"position": "10001"}, {"alt_text": "x" * 256}])
async def test_upload_metadata_bounds(media, tmp_path, fields):
    assert (await upload(media, **fields)).status_code == 422
    assert not list(tmp_path.iterdir())


async def test_cover_selection_order_deactivation_reactivation_and_legacy_fallback(media):
    await media.change(Product, media.product_id, cover_image_url="https://example.com/legacy.jpg")
    first = (await upload(media, position="5")).json()
    second = (await upload(media, position="0", is_cover="true")).json()
    async with media.sessions() as session:
        product = await session.get(Product, media.product_id)
        assert product.cover_image_url == second["url"]
        assert product.version == 3
        assert len((await session.scalars(select(ProductImage).where(ProductImage.is_cover))).all()) == 1
    response = await media.client.put(
        f"{BASE}/{first['id']}", json={"is_cover": True, "alt_text": "new", "position": 1}
    )
    assert response.status_code == 200 and response.json()["is_cover"]
    response = await media.client.delete(f"{BASE}/{first['id']}")
    assert response.status_code == 200 and not response.json()["is_active"] and not response.json()["is_cover"]
    await media.client.delete(f"{BASE}/{second['id']}")
    async with media.sessions() as session:
        assert (await session.get(Product, media.product_id)).cover_image_url is None
        assert len((await session.scalars(select(ProductImage))).all()) == 2
    response = await media.client.put(f"{BASE}/{first['id']}", json={"is_active": True})
    assert response.status_code == 200 and response.json()["is_cover"]
    assert (await media.client.put(f"{BASE}/{second['id']}", json={"is_cover": True})).status_code == 422
    assert (await media.client.put(f"{BASE}/{first['id']}", json={"position": -1})).status_code == 422
    assert (await media.client.put(f"{BASE}/{first['id']}", json={"url": "https://evil.test/x.png"})).status_code == 422
    assert (await media.client.post(BASE, json={"product_id": str(media.product_id), "url": "x"})).status_code == 405
    assert (await media.client.post(f"{BASE}/products/{media.product_id}", json={"url": "x"})).status_code == 404


async def test_missing_product_and_image_and_staff_auth(media, tmp_path):
    assert (await upload(media, product_id=uuid4())).status_code == 404
    assert (await media.client.put(f"{BASE}/{uuid4()}", json={})).status_code == 404
    assert (await media.client.delete(f"{BASE}/{uuid4()}")).status_code == 404
    media.client.headers.pop("Authorization")
    assert (await upload(media)).status_code == 401
    await media.change(User, media.user_id, role=UserRole.CUSTOMER)
    assert (await upload_authenticated_customer(media)).status_code == 403
    assert not list(tmp_path.iterdir())


async def upload_authenticated_customer(db):
    return await db.client.post(
        f"{BASE}/products/{db.product_id}/upload", headers=db.auth(), files={"file": ("x.png", pixels(), "image/png")}
    )


async def test_persistence_failure_removes_file_and_rolls_back(media, tmp_path, monkeypatch):
    async def fail_commit(self):
        raise RuntimeError("sensitive filesystem/database details")

    with monkeypatch.context() as patch:
        patch.setattr(AsyncSession, "commit", fail_commit)
        response = await upload(media)
    assert response.status_code == 500 and "sensitive" not in response.text and str(tmp_path) not in response.text
    assert not list(tmp_path.iterdir())
    async with media.sessions() as session:
        assert not (await session.scalars(select(ProductImage))).all()
        assert (await session.get(Product, media.product_id)).version == 1


async def test_concurrent_cover_selection_is_serialized(media):
    responses = await asyncio.gather(upload(media, is_cover="true"), upload(media, is_cover="true"))
    assert all(response.status_code == 201 for response in responses)
    async with media.sessions() as session:
        covers = (await session.scalars(select(ProductImage).where(ProductImage.is_cover))).all()
        assert len(covers) == 1
        product = await session.get(Product, media.product_id)
        assert product.cover_image_url == covers[0].url and product.version == 3


async def test_reencoder_removes_exif():
    image = Image.new("RGB", (8, 8))
    exif = Image.Exif()
    exif[270] = "untrusted embedded payload"
    output = io.BytesIO()
    image.save(output, format="JPEG", exif=exif)
    result, suffix = encode_image(output.getvalue(), "photo.jpeg")
    assert suffix == ".jpg"
    with Image.open(io.BytesIO(result)) as decoded:
        assert not decoded.getexif()
    with pytest.raises(HTTPException):
        encode_image(pixels("GIF"), "x.gif")


async def test_filesystem_failure_has_no_path_disclosure(media, tmp_path, monkeypatch):
    blocker = tmp_path / "not-a-directory"
    blocker.write_text("occupied")
    monkeypatch.setattr(settings, "product_media_dir", blocker)
    response = await upload(media)
    assert response.status_code == 500 and str(tmp_path) not in response.text
    assert blocker.read_text() == "occupied"
    async with media.sessions() as session:
        assert not (await session.scalars(select(ProductImage))).all()


async def test_database_cover_and_position_constraints(media):
    from sqlalchemy.exc import IntegrityError

    first = (await upload(media)).json()
    async with media.sessions() as session:
        session.add(ProductImage(product_id=media.product_id, url=first["url"], is_cover=True))
        with pytest.raises(IntegrityError):
            await session.flush()
        await session.rollback()
    for values in [{"position": -1}, {"position": 10001}, {"is_cover": True, "is_active": False}]:
        async with media.sessions() as session:
            session.add(ProductImage(product_id=media.other_id, url=first["url"], **values))
            with pytest.raises(IntegrityError):
                await session.flush()
            await session.rollback()


async def test_soft_deletion_retains_managed_file_and_all_rows(media, tmp_path):
    image = (await upload(media)).json()
    response = await media.client.delete(f"{BASE}/{image['id']}")
    assert response.status_code == 200 and not response.json()["is_cover"]
    assert (tmp_path / image["url"].rsplit("/", 1)[1]).is_file()
    active = await media.client.get(BASE)
    all_rows = await media.client.get(BASE, params={"include_inactive": "true"})
    assert active.status_code == 200 and active.json() == []
    assert all_rows.status_code == 200 and len(all_rows.json()) == 1


@pytest.mark.parametrize("data,filename", [(pixels(), "valid.png"), (b"MZ executable", "x.png"), (pixels(), "x.svg")])
async def test_existing_generic_upload_uses_safe_raster_storage(media, tmp_path, data, filename):
    response = await media.client.post(
        "/api/v1/admin/catalog/uploads/images",
        files={"file": (filename, data, "image/png")},
    )
    if filename != "valid.png":
        assert response.status_code == 422
        assert not list(tmp_path.iterdir())
        return
    assert response.status_code == 200, response.text
    assert re.fullmatch(r"/static/product-images/[a-f0-9]{32}\.png", response.json()["url"])
    with Image.open(tmp_path / response.json()["url"].rsplit("/", 1)[1]) as image:
        image.load()
        assert image.size == (8, 8) and image.format == "PNG"
    assert str(tmp_path) not in response.text


async def test_generic_upload_preserves_staff_boundary_and_byte_cap(media, monkeypatch):
    media.client.headers.clear()
    endpoint = "/api/v1/admin/catalog/uploads/images"
    files = {"file": ("test.png", pixels(), "image/png")}
    assert (await media.client.post(endpoint, files=files)).status_code == 401
    await media.change(User, media.user_id, role=UserRole.CUSTOMER)
    assert (await media.client.post(endpoint, files=files, headers=media.auth())).status_code == 403
    await media.change(User, media.user_id, role=UserRole.STAFF)
    monkeypatch.setattr(settings, "product_image_max_bytes", 32)
    assert (await media.client.post(endpoint, files=files, headers=media.auth())).status_code == 413
