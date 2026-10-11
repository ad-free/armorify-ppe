// src/components/catalog/ProductImageGallery.tsx
import React, { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, ImageOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ProductImageRead } from '@/types/api';
import { getMediaUrl } from '@/lib/api';

interface Props {
  images: ProductImageRead[];
  productName: string;
}

export const ProductImageGallery: React.FC<Props> = ({ images, productName }) => {
  const { t } = useTranslation();
  const [activeImageId, setActiveImageId] = useState<string | null>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const [failedImages, setFailedImages] = useState<Set<string>>(() => new Set());
  const selectedIndex = images.findIndex(image => image.id === activeImageId);
  const currentIndex = selectedIndex >= 0 ? selectedIndex : Math.max(0, images.findIndex(image => image.is_cover));
  const mainImage = images[currentIndex];
  const mainUrl = mainImage ? getMediaUrl(mainImage.url) : '';
  const mainFailed = !mainUrl || failedImages.has(mainUrl);

  const navigate = (direction: number) => {
    if (images.length > 1) {
      setActiveImageId(images[(currentIndex + direction + images.length) % images.length].id);
    }
  };

  const markFailed = (url: string) => {
    setFailedImages((previous) => new Set(previous).add(url));
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (images.length < 2) return;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      navigate(event.key === 'ArrowRight' ? 1 : -1);
    }
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    const start = touchStart.current;
    touchStart.current = null;
    const end = event.changedTouches[0];
    if (!start || !end) return;
    const deltaX = start.x - end.clientX;
    const deltaY = start.y - end.clientY;
    if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY)) {
      navigate(deltaX > 0 ? 1 : -1);
    }
  };

  const unavailableLabel = t('productDetail.galleryImageFailed', {
    defaultValue: 'Image unavailable',
  });

  if (images.length === 0) {
    return (
      <div className="flex aspect-square w-full min-w-0 flex-col items-center justify-center gap-3 rounded-lg border border-border bg-muted p-6 text-center text-muted-foreground">
        <ImageOff aria-hidden="true" className="h-12 w-12" />
        <p className="text-sm font-semibold">{t('productDetail.galleryNoImages')}</p>
      </div>
    );
  }

  return (
    <div
      role="region"
      aria-label={t('productDetail.galleryLabel', { defaultValue: '{{name}} images', name: productName })}
      className="min-w-0 space-y-4"
      onKeyDown={handleKeyDown}
    >
      <div
        className="relative aspect-square w-full min-w-0 overflow-hidden rounded-lg border border-border bg-surface"
        onTouchStart={(event) => {
          const touch = event.touches[0];
          touchStart.current = touch ? { x: touch.clientX, y: touch.clientY } : null;
        }}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={() => { touchStart.current = null; }}
      >
        {mainFailed ? (
          <div role="status" className="flex h-full flex-col items-center justify-center gap-3 bg-muted p-6 text-center text-muted-foreground">
            <ImageOff aria-hidden="true" className="h-12 w-12" />
            <p className="text-sm font-semibold">{unavailableLabel}</p>
          </div>
        ) : (
          <img
            key={mainUrl}
            src={mainUrl}
            alt={mainImage.alt_text?.trim() || productName}
            onError={() => markFailed(mainUrl)}
            className="h-full w-full object-contain p-4 sm:p-6"
          />
        )}
      </div>

      {images.length > 1 && (
        <>
          <div className="flex min-w-0 items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => navigate(-1)}
              aria-label={t('productDetail.galleryPrevious', { defaultValue: 'Previous image' })}
              className="btn btn-secondary h-11 w-11 shrink-0 !p-0"
            >
              <ChevronLeft aria-hidden="true" className="h-5 w-5" />
            </button>
            <p aria-live="polite" aria-atomic="true" className="min-w-0 text-center text-sm font-medium text-muted-foreground">
              {t('productDetail.galleryPosition', {
                defaultValue: 'Image {{current}} of {{total}}',
                current: currentIndex + 1,
                total: images.length,
              })}
            </p>
            <button
              type="button"
              onClick={() => navigate(1)}
              aria-label={t('productDetail.galleryNext', { defaultValue: 'Next image' })}
              className="btn btn-secondary h-11 w-11 shrink-0 !p-0"
            >
              <ChevronRight aria-hidden="true" className="h-5 w-5" />
            </button>
          </div>
          <div className="grid min-w-0 grid-cols-[repeat(auto-fill,minmax(56px,1fr))] gap-2">
            {images.map((image, index) => {
              const url = getMediaUrl(image.url);
              const failed = !url || failedImages.has(url);
              return (
                <button
                  key={`${image.id}-${index}`}
                  type="button"
                  aria-label={t('productDetail.gallerySelect', {
                    defaultValue: 'Show image {{number}} of {{name}}',
                    number: index + 1,
                    name: productName,
                  })}
                  aria-pressed={currentIndex === index}
                  onClick={() => setActiveImageId(image.id)}
                  className={`flex aspect-square min-h-11 min-w-11 items-center justify-center overflow-hidden rounded-md border-2 bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                    currentIndex === index ? 'border-primary' : 'border-border hover:border-primary'
                  }`}
                >
                  {failed ? (
                    <>
                      <ImageOff aria-hidden="true" className="h-5 w-5 text-muted-foreground" />
                      <span className="sr-only">{unavailableLabel}</span>
                    </>
                  ) : (
                    <img
                      src={url}
                      alt=""
                      loading="lazy"
                      onError={() => markFailed(url)}
                      className="h-full w-full object-contain p-1"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
