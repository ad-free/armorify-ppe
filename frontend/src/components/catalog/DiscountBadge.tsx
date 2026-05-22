// src/components/catalog/DiscountBadge.tsx
import React from 'react';

interface Props {
  price: string | number;
  compareAtPrice: string | number | null;
}

export const DiscountBadge: React.FC<Props> = ({ price, compareAtPrice }) => {
  if (!compareAtPrice) return null;

  const pct = Math.round((1 - Number(price) / Number(compareAtPrice)) * 100);
  if (pct <= 0) return null;

  return (
    <span className="bg-rose-600 text-white text-xs font-black px-2.5 py-1 rounded-full shadow-md tracking-wide">
      −{pct}%
    </span>
  );
};
