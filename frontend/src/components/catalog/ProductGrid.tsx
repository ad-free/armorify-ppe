// src/components/catalog/ProductGrid.tsx
import React from 'react';
import { ProductRead } from '@/types/api';
import { ProductCard } from './ProductCard';
import { Package } from 'lucide-react';

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
      <div className={`grid ${gridClass} gap-4 md:gap-5`}>
        {[...Array(columns * 2)].map((_, i) => (
          <div key={i} className="animate-pulse bg-white rounded-2xl overflow-hidden border border-gray-100">
            {/* Image skeleton */}
            <div className="aspect-[4/5] bg-gradient-to-br from-gray-100 to-gray-50 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
            </div>
            {/* Content skeleton */}
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="h-3 bg-gray-100 rounded-full w-16" />
                <div className="h-5 bg-gray-100 rounded-full w-20" />
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-100 rounded-full w-full" />
                <div className="h-4 bg-gray-100 rounded-full w-2/3" />
              </div>
              <div className="pt-2">
                <div className="h-6 bg-gray-100 rounded-full w-28" />
              </div>
              <div className="pt-3">
                <div className="h-11 bg-gray-100 rounded-xl w-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="py-24 text-center bg-white rounded-2xl border border-dashed border-gray-200">
        <div className="w-20 h-20 mx-auto mb-6 bg-gray-50 rounded-2xl flex items-center justify-center">
          <Package className="w-10 h-10 text-gray-300" />
        </div>
        <h3 className="text-lg font-bold text-gray-700 mb-2">Không tìm thấy sản phẩm</h3>
        <p className="text-sm text-gray-400 max-w-sm mx-auto">
          Hãy thử thay đổi bộ lọc hoặc từ khóa tìm kiếm để tìm sản phẩm phù hợp.
        </p>
      </div>
    );
  }

  return (
    <div className={`grid ${gridClass} gap-4 md:gap-5`}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
};
