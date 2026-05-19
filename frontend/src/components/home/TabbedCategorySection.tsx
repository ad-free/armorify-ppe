// src/components/home/TabbedCategorySection.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProductGrid } from '../catalog/ProductGrid';
import { useCategories, useProducts } from '@/hooks/useCatalog';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface TabbedCategorySectionProps {
  excludeSlugs?: string[];
}

export const TabbedCategorySection: React.FC<TabbedCategorySectionProps> = ({ excludeSlugs = [] }) => {
  const { data: categories } = useCategories();
  
  // Lọc các danh mục gốc và loại trừ những danh mục đã hiển thị ở CategoryFloor (vd: giày, mũ)
  const displayCategories = (categories || [])
    .filter(c => (!c.parent_id || c.parent_id === c.id) && !excludeSlugs.includes(c.slug))
    .slice(0, 12); // Lấy tối đa 12 danh mục để làm Tabs

  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Set Tab mặc định khi danh mục được tải
  useEffect(() => {
    if (displayCategories.length > 0 && !activeCategoryId) {
      setActiveCategoryId(displayCategories[0].id);
    }
  }, [displayCategories, activeCategoryId]);

  // Tự động chuyển tab mỗi 5 giây
  useEffect(() => {
    if (!displayCategories.length || isHovered) return;

    const interval = setInterval(() => {
      setActiveCategoryId((currentId) => {
        if (!currentId) return displayCategories[0].id;
        const currentIndex = displayCategories.findIndex(c => c.id === currentId);
        const nextIndex = (currentIndex + 1) % displayCategories.length;
        return displayCategories[nextIndex].id;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [displayCategories, isHovered]);

  const { data: productsData, isLoading } = useProducts(
    { category_id: activeCategoryId || undefined, limit: 8 },
    { enabled: !!activeCategoryId }
  );

  const activeCategory = displayCategories.find(c => c.id === activeCategoryId);

  if (!displayCategories.length) return null;

  return (
    <section 
      className="py-20 bg-gray-50 border-t border-gray-100"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="container mx-auto px-4 md:px-0">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-primary font-black text-[11px] tracking-[0.4em] uppercase mb-4 block">Danh Mục Nổi Bật</span>
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight uppercase mb-4">
            Sản Phẩm Theo Ngành Hàng
          </h2>
          <div className="h-1 w-24 bg-primary mx-auto rounded-full mb-6" />
          <p className="text-gray-500 font-medium text-lg">
            Khám phá thêm các danh mục bảo hộ chuyên dụng khác, đáp ứng mọi tiêu chuẩn an toàn khắt khe nhất.
          </p>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap justify-center gap-2 md:gap-4 mb-12">
          {displayCategories.map((cat) => {
            const isActive = activeCategoryId === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategoryId(cat.id)}
                className={`relative px-6 py-3 rounded-full text-sm md:text-base font-bold transition-all duration-300 border ${
                  isActive 
                    ? 'text-white shadow-xl shadow-primary/30 border-transparent' 
                    : 'text-gray-500 bg-white hover:bg-gray-50 border-gray-200 hover:border-gray-300 hover:text-gray-900'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute inset-0 bg-primary rounded-full z-0"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{cat.name}</span>
              </button>
            );
          })}
        </div>

        {/* Product Grid Area */}
        <div className="min-h-[400px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeCategoryId}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
            >
              <ProductGrid products={productsData?.items || []} loading={isLoading} />
            </motion.div>
          </AnimatePresence>
        </div>
        
        {/* View All Button */}
        {activeCategory && (
          <div className="mt-14 text-center">
            <Link 
              to={`/categories/${activeCategory.slug}`}
              className="inline-flex items-center gap-3 bg-gray-900 text-white font-black text-sm px-10 py-4 rounded-full hover:bg-primary transition-all shadow-xl hover:shadow-primary/30 active:scale-95 uppercase tracking-widest group"
            >
              Xem tất cả {activeCategory.name} 
              <ArrowRight size={18} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
};
