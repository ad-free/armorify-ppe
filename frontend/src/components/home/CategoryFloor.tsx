// src/components/home/CategoryFloor.tsx
import React, { useMemo } from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ProductGrid } from '../catalog/ProductGrid';
import { ProductRead } from '@/types/api';

interface CategoryFloorProps {
  title: string;
  subtitle: string;
  bannerImage: string;
  categorySlug: string;
  products: ProductRead[];
  loading?: boolean;
}

export const CategoryFloor: React.FC<CategoryFloorProps> = ({ 
  title, 
  subtitle, 
  bannerImage, 
  categorySlug, 
  products, 
  loading 
}) => {
  // Take only top 8 products to fit the 4-column layout perfectly beside the sidebar on large screens
  const displayProducts = useMemo(() => products.slice(0, 8), [products]);

  return (
    <section className="py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Floor Header */}
        <div className="flex justify-between items-end mb-4 md:mb-6 border-b-2 border-primary pb-2 gap-4">
          <div className="flex-1">
            <h2 className="text-2xl md:text-3xl font-black text-gray-900 uppercase line-clamp-2 leading-tight">
              {title}
            </h2>
            <p className="text-sm md:text-base text-gray-500 mt-1 font-medium line-clamp-2">{subtitle}</p>
          </div>
          <Link 
            to={`/categories/${categorySlug}`}
            className="hidden sm:flex flex-shrink-0 items-center gap-1 text-primary hover:underline font-semibold"
          >
            Xem tất cả <ArrowRight size={18} />
          </Link>
        </div>

        {/* Floor Body - "Garan" style sidebar banner + grid */}
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
          {/* Categorical Sidebar Banner */}
          <div className="hidden lg:block w-56 xl:w-64 flex-shrink-0 relative rounded-xl overflow-hidden group">
            <img 
              src={bannerImage} 
              alt={title}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/40 to-transparent" />
            <div className="absolute bottom-5 left-4 right-4 xl:bottom-6 xl:left-6 xl:right-6">
              <h3 className="text-white font-bold text-base xl:text-lg mb-2 leading-snug drop-shadow-md line-clamp-2">{title}</h3>
              <ul className="text-gray-200 space-y-1 text-[11px] xl:text-xs font-medium">
                <li className="hover:text-primary transition-colors cursor-pointer">• Hàng mới về</li>
                <li className="hover:text-primary transition-colors cursor-pointer">• Thương hiệu nổi bật</li>
                <li className="hover:text-primary transition-colors cursor-pointer">• Khuyến mãi</li>
              </ul>
              <Link to={`/categories/${categorySlug}`} className="mt-4 xl:mt-5 inline-block bg-primary text-white text-[11px] xl:text-xs font-bold px-3 py-2 rounded-lg w-full text-center hover:bg-primary/90 transition-colors shadow-sm">
                MUA NGAY
              </Link>
            </div>
          </div>

          {/* Grid Area */}
          <div className="flex-1">
            <ProductGrid products={displayProducts} loading={loading} />
          </div>
        </div>
      </div>
    </section>
  );
};
