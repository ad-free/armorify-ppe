// src/components/catalog/DiscountBadge.tsx
import React from 'react';

interface Props {
  price: string;
  compareAtPrice: string | null;
}

export const DiscountBadge: React.FC<Props> = ({ price, compareAtPrice }) => {
  if (!compareAtPrice) return null;

  const pct = Math.round((1 - Number(price) / Number(compareAtPrice)) * 100);
  if (pct <= 0) return null;

  return (
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground line-through text-sm">
        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(compareAtPrice))}
      </span>
      <span className="bg-amber-100 text-amber-800 text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap">
        -{pct}%
      </span>
    </div>
  );
};
