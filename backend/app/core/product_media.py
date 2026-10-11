"""Managed image storage; the product row serializes all cover selections."""

import io
import warnings
from pathlib import Path
from uuid import UUID, uuid4

from app.core.settings import settings
from app.models.product import Product
from app.models.product_image import ProductImage
from fastapi import HTTPException, UploadFile
from PIL import Image, UnidentifiedImageError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.concurrency import run_in_threadpool

_FORMATS = {"JPEG": ({".jpg", ".jpeg"}, ".jpg"), "PNG": ({".png"}, ".png"), "WEBP": ({".webp"}, ".webp")}


def encode_image(data: bytes, filename: str) -> tuple[bytes, str]:
    """Decode completely and copy pixels into a metadata-free single-frame image."""
    try:
        if len(data) > settings.product_image_max_bytes:
            raise ValueError("Image exceeds byte limit")
        with warnings.catch_warnings():
            warnings.simplefilter("error", Image.DecompressionBombWarning)
            with Image.open(io.BytesIO(data)) as source:
                fmt = source.format
                if fmt not in _FORMATS or Path(filename).suffix.lower() not in _FORMATS[fmt][0]:
                    raise ValueError("Unsupported image or mismatched extension")
                if source.width * source.height > settings.product_image_max_pixels:
                    raise ValueError("Image exceeds pixel limit")
                if getattr(source, "n_frames", 1) != 1:
                    raise ValueError("Animated images are not supported")
                # Refuse appended payloads; re-encoding also removes embedded metadata.
                if (
                    (fmt == "JPEG" and not data.endswith(b"\xff\xd9"))
                    or (fmt == "PNG" and not data.endswith(b"\x00\x00\x00\x00IEND\xaeB`\x82"))
                    or (fmt == "WEBP" and (data[:4] != b"RIFF" or int.from_bytes(data[4:8], "little") + 8 != len(data)))
                ):
                    raise ValueError("Invalid image container")
                source.verify()
            with Image.open(io.BytesIO(data)) as source:
                source.load()
                mode = "RGB" if fmt == "JPEG" else "RGBA"
                converted = source.convert(mode)
                clean = Image.frombytes(mode, converted.size, converted.tobytes())
                output = io.BytesIO()
                clean.save(output, format=fmt)
                encoded = output.getvalue()
                if len(encoded) > settings.product_image_max_bytes:
                    raise ValueError("Encoded image exceeds byte limit")
                return encoded, _FORMATS[fmt][1]
    except (
        ValueError,
        OSError,
        SyntaxError,
        UnidentifiedImageError,
        Image.DecompressionBombError,
        Image.DecompressionBombWarning,
    ) as exc:
        raise HTTPException(
            422, "Invalid image: use a valid single-frame JPEG, PNG or WebP within upload limits"
        ) from exc


async def locked_product(db: AsyncSession, product_id: UUID) -> Product:
    product = await db.scalar(
        select(Product)
        .where(Product.id == product_id)
        .with_for_update(of=Product)
        .execution_options(populate_existing=True)
    )
    if product is None:
        raise HTTPException(404, "Product not found")
    return product


async def sync_cover(db: AsyncSession, product: Product, selected: ProductImage | None = None) -> None:
    images = list(
        (
            await db.scalars(
                select(ProductImage)
                .where(ProductImage.product_id == product.id)
                .order_by(ProductImage.position, ProductImage.created_at, ProductImage.id)
            )
        ).all()
    )
    active = [image for image in images if image.is_active]
    cover = (
        selected
        if selected is not None and selected.is_active
        else next((image for image in active if image.is_cover), active[0] if active else None)
    )
    # Clear the previous cover before selecting its replacement (partial unique index).
    for image in images:
        image.is_cover = False
    await db.flush()
    if cover is not None:
        cover.is_cover = True
    product.cover_image_url = cover.url if cover else None
    product.version += 1
    await db.flush()


async def store_image_file(file: UploadFile) -> tuple[str, Path]:
    data = bytearray()
    try:
        while chunk := await file.read(64 * 1024):
            data.extend(chunk)
            if len(data) > settings.product_image_max_bytes:
                raise HTTPException(413, "Image exceeds byte limit")
    finally:
        await file.close()
    encoded, extension = await run_in_threadpool(encode_image, bytes(data), file.filename or "")
    name = uuid4().hex + extension
    path = settings.product_media_dir / name
    created = False
    try:
        settings.product_media_dir.mkdir(parents=True, exist_ok=True)
        with path.open("xb") as destination:
            created = True
            destination.write(encoded)
    except OSError as exc:
        if created:
            path.unlink(missing_ok=True)
        raise HTTPException(500, "Unable to store image") from exc
    return f"/static/product-images/{name}", path


async def upload_image(
    db: AsyncSession, product_id: UUID, file: UploadFile, alt_text: str | None, position: int, is_cover: bool
) -> ProductImage:
    product = await locked_product(db, product_id)
    url, path = await store_image_file(file)
    image = ProductImage(
        product_id=product_id,
        url=url,
        alt_text=alt_text,
        position=position,
        is_cover=False,
    )
    try:
        db.add(image)
        await db.flush()
        await sync_cover(db, product, image if is_cover else None)
        await db.commit()
    except Exception as exc:
        try:
            await db.rollback()
        finally:
            path.unlink(missing_ok=True)
        raise HTTPException(500, "Unable to save product image") from exc
    return image


async def update_image(db: AsyncSession, image_id: UUID, changes: dict) -> ProductImage:
    product_id = await db.scalar(select(ProductImage.product_id).where(ProductImage.id == image_id))
    if product_id is None:
        raise HTTPException(404, "Image not found")
    product = await locked_product(db, product_id)
    image = await db.get(ProductImage, image_id, populate_existing=True)
    if changes.get("is_cover") and not changes.get("is_active", image.is_active):
        raise HTTPException(422, "A cover image must be active")
    select_cover = changes.pop("is_cover", None)
    for key, value in changes.items():
        setattr(image, key, value)
    if not image.is_active or select_cover is False:
        image.is_cover = False
    await db.flush()
    await sync_cover(db, product, image if select_cover else None)
    await db.commit()
    return image
