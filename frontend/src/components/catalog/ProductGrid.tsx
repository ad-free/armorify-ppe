// src/components/catalog/ProductGrid.tsx
import React from 'react';
import { ProductRead } from '@/types/api';
import { ProductCard } from './ProductCard';

interface ProductGridProps {
  products: ProductRead[];
  loading?: boolean;
}

export const ProductGrid: React.FC<ProductGridProps> = ({ products, loading = false }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="animate-pulse bg-white border border-gray-100 rounded-xl overflow-hidden aspect-[3/4]">
            <div className="w-full h-[60%] bg-gray-200"></div>
            <div className="p-4 space-y-3">
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-6 bg-gray-200 rounded w-1/2 mt-4"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="py-20 text-center text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
        <p className="text-lg">Không tìm thấy sản phẩm nào phù hợp.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
};
