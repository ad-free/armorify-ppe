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
  subtitle: _subtitle, 
  bannerImage, 
  categorySlug, 
  products, 
  loading 
}) => {
  // Take only top 8 products to fit the 4-column layout perfectly beside the sidebar on large screens
  const displayProducts = useMemo(() => products.slice(0, 8), [products]);

  return (
    <section className="py-2">
      <div className="container mx-auto">
        {/* Floor Header */}
        <div className="flex justify-between items-end mb-8 gap-4">
          <div className="flex-1">
            <h2 className="text-2xl md:text-[28px] font-black text-gray-900 tracking-tight leading-tight uppercase">
              {title}
            </h2>
            <div className="h-1 w-20 bg-primary rounded-full mt-3" />
          </div>
          <Link 
            to={`/categories/${categorySlug}`}
            className="group flex flex-shrink-0 items-center gap-2 text-gray-400 hover:text-primary transition-colors font-black text-xs tracking-widest"
          >
            XEM TẤT CẢ <ArrowRight size={18} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Floor Body - "FastKart" style sidebar banner + grid */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Categorical Sidebar Banner */}
          <div className="hidden lg:block w-72 flex-shrink-0 relative rounded-[2rem] overflow-hidden group min-h-[500px]">
             <img 
              src={bannerImage} 
              alt={title}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/20 to-transparent opacity-80" />
            <div className="absolute bottom-8 left-8 right-8">
              <span className="text-primary font-black text-[10px] tracking-[0.2em] uppercase mb-2 block">Premium Collection</span>
              <h3 className="text-white font-black text-2xl mb-6 leading-tight drop-shadow-lg">{title}</h3>
              
              <Link 
                to={`/categories/${categorySlug}`} 
                className="inline-flex items-center gap-3 bg-white text-gray-900 text-xs font-black px-8 py-3.5 rounded-xl hover:bg-primary hover:text-white transition-all shadow-xl active:scale-95"
              >
                MUA NGAY <ArrowRight size={14} strokeWidth={3} />
              </Link>
            </div>
          </div>

          {/* Grid Area */}
          <div className="flex-1 bg-white rounded-[2rem] p-4 lg:p-8 border border-gray-100/50 shadow-sm">
            <ProductGrid products={displayProducts} loading={loading} />
          </div>
        </div>
      </div>
    </section>

  );
};
