// src/components/catalog/ProductImageGallery.tsx
import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Shield } from 'lucide-react';
import type { ProductImageRead } from '@/types/api';

interface Props {
  images: ProductImageRead[];
  productName: string;
}

export const ProductImageGallery: React.FC<Props> = ({ images, productName }) => {
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
      <div className="w-full aspect-square bg-gray-100 rounded-lg flex flex-col items-center justify-center text-gray-400">
        <Shield className="w-16 h-16 mb-4" />
        <span>Chưa có hình ảnh</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Main Image */}
      <div
        className="relative w-full aspect-square rounded-lg overflow-hidden bg-gray-50"
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
            className="w-full h-full object-cover"
          />
        </AnimatePresence>
      </div>

      {/* Thumbnail Strip */}
      <div className="flex flex-row overflow-x-auto gap-2 pb-2 hide-scrollbar">
        {images.map((img, idx) => (
          <button
            key={img.id}
            onClick={() => setActiveIndex(idx)}
            className={`flex-shrink-0 w-16 h-16 rounded overflow-hidden border-2 transition-colors ${activeIndex === idx ? 'border-primary' : 'border-transparent'}`}
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
    </div>
  );
};
