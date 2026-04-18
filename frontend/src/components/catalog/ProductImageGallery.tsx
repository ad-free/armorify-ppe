// src/components/catalog/ProductImageGallery.tsx
import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ProductImageRead } from '@/types/api';

interface Props {
  images: ProductImageRead[];
  productName: string;
}

export const ProductImageGallery: React.FC<Props> = ({ images, productName }) => {
  const { t } = useTranslation();
  const [activeIndex, setActiveIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const mainImage = images.length > 0 ? images[activeIndex] : null;

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const touchEnd = e.changedTouches[0].clientX;
    const deltaX = touchStart - touchEnd;

    if (deltaX > 50) {
      // Swipe left -> next
      setActiveIndex((prev) => (prev + 1) % images.length);
    } else if (deltaX < -50) {
      // Swipe right -> prev
      setActiveIndex((prev) => (prev - 1 + images.length) % images.length);
    }
    setTouchStart(null);
  };

  if (images.length === 0) {
    return (
      <div className="w-full aspect-square bg-gradient-to-br from-slate-100 to-slate-50 rounded-2xl flex flex-col items-center justify-center text-slate-400 border border-slate-200/80">
        <Shield className="w-16 h-16 mb-3 opacity-60" />
        <span className="text-sm font-medium">{t('productDetail.galleryNoImages')}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 lg:gap-5">
      {/* Thumbnails — vertical on large screens (reference storefront style) */}
      <div className="flex lg:flex-col flex-row lg:order-1 order-2 gap-2 lg:max-h-[520px] lg:overflow-y-auto lg:pr-1 hide-scrollbar lg:w-20 flex-shrink-0">
        {images.map((img, idx) => (
          <button
            key={img.id}
            type="button"
            onClick={() => setActiveIndex(idx)}
            className={`flex-shrink-0 w-16 h-16 lg:w-full lg:aspect-square rounded-xl overflow-hidden border-2 transition-all duration-200 ring-offset-2 ${
              activeIndex === idx
                ? 'border-primary ring-2 ring-primary/30 shadow-md scale-[1.02]'
                : 'border-transparent hover:border-slate-300 opacity-90 hover:opacity-100'
            }`}
          >
            <img
              src={img.url}
              alt={img.alt_text ?? productName}
              loading="lazy"
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>

      {/* Main Image */}
      <div
        className="relative w-full flex-1 aspect-square rounded-2xl overflow-hidden bg-white border border-slate-200/80 shadow-sm order-1 lg:order-2"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <AnimatePresence mode="wait">
          <motion.img
            key={activeIndex}
            src={mainImage?.url}
            alt={mainImage?.alt_text ?? productName}
            loading="lazy"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="w-full h-full object-contain lg:object-cover"
          />
        </AnimatePresence>
      </div>
    </div>
  );
};
