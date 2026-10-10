// src/components/catalog/ProductGrid.tsx
import React from 'react';
import { ProductRead } from '@/types/api';
import { ProductCard } from './ProductCard';
import { FeedbackState, Skeleton } from '@/components/ui/Primitives';

interface ProductGridProps {
  products: ProductRead[];
  loading?: boolean;
  columns?: 3 | 4 | 5;
}

export const ProductGrid: React.FC<ProductGridProps> = ({ products, loading = false, columns = 4 }) => {
  const gridClass = {
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-3 xl:grid-cols-4',
    5: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5',
  }[columns];

  if (loading) {
    return (
      <div role="status" aria-label="Đang tải sản phẩm" className={`grid ${gridClass} gap-4 md:gap-6`}>
        {[...Array(columns * 2)].map((_, i) => (
          <div key={i} className="card overflow-hidden">
            <Skeleton className="aspect-[4/5] rounded-none" />
            <div className="p-4 space-y-3">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-11 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <FeedbackState
        title="Không tìm thấy sản phẩm"
        description="Hãy thử thay đổi bộ lọc hoặc từ khóa tìm kiếm để tìm sản phẩm phù hợp."
      />
    );
  }

  return (
    <div className={`grid ${gridClass} gap-4 md:gap-6`}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
};
