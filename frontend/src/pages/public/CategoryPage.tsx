// src/pages/public/CategoryPage.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { SeoHead } from '@/components/common/SeoHead';
import { Breadcrumb } from '@/components/common/Breadcrumb';
import { ProductGrid } from '@/components/catalog/ProductGrid';
import { ProductSortFilter } from '@/components/catalog/ProductSortFilter';
import { PaginationControls } from '@/components/common/PaginationControls';
import { useProducts, useCategories } from '@/hooks/useCatalog';
import {
  SlidersHorizontal,
  LayoutGrid,
  Grid3X3,
  X,
  Package,
} from 'lucide-react';

const CategoryPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: categories } = useCategories();

  // Mobile filter drawer
  const [showMobileFilter, setShowMobileFilter] = useState(false);

  // Resolve category from slug
  const currentCategory = useMemo(() => {
    if (!slug || !categories) return null;
    return categories.find((c: any) => c.slug === slug) || null;
  }, [slug, categories]);

  // Pagination & filter state from URL
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limitParam = parseInt(searchParams.get('limit') || '24', 10);
  const limit = [12, 24, 48].includes(limitParam) ? limitParam : 24;
  const skip = (page - 1) * limit;
  const sort_by = (searchParams.get('sort_by') as any) || 'newest';
  const category_id = searchParams.get('category_id') || currentCategory?.id || undefined;
  const brand_id = searchParams.get('brand_id') || undefined;
  const price_min = searchParams.get('price_min') ? Number(searchParams.get('price_min')) : undefined;
  const price_max = searchParams.get('price_max') ? Number(searchParams.get('price_max')) : undefined;
  const is_new = searchParams.get('is_new') === 'true' ? true : undefined;
  const is_featured = searchParams.get('is_featured') === 'true' ? true : undefined;
  const rating_min = searchParams.get('rating_min') ? Number(searchParams.get('rating_min')) : undefined;

  const { data, isLoading } = useProducts({
    skip,
    limit,
    sort_by,
    category_id,
    brand_id,
    price_min,
    price_max,
    is_new,
    is_featured,
    rating_min,
  });

  // Grid columns state
  const [gridColumns, setGridColumns] = useState<3 | 4>(4);

  // Close mobile filter on resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setShowMobileFilter(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Lock body scroll when mobile filter is open
  useEffect(() => {
    if (showMobileFilter) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [showMobileFilter]);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchParams.get('category_id')) count++;
    if (searchParams.get('brand_id')) count++;
    if (searchParams.get('price_min') || searchParams.get('price_max')) count++;
    if (searchParams.get('is_new')) count++;
    if (searchParams.get('is_featured')) count++;
    if (searchParams.get('rating_min')) count++;
    return count;
  }, [searchParams]);

  const handleLimitChange = useCallback((newLimit: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('limit', newLimit.toString());
    newParams.set('page', '1');
    setSearchParams(newParams);
  }, [searchParams, setSearchParams]);

  const pageTitle = currentCategory?.name || 'Tất cả sản phẩm';
  const totalProducts = data?.total || 0;

  // Active filter tags
  const activeFilterTags = useMemo(() => {
    const tags: { key: string; label: string; paramKey: string }[] = [];
    if (searchParams.get('category_id') && categories) {
      const cat = categories.find((c: any) => c.id === searchParams.get('category_id'));
      if (cat) tags.push({ key: 'cat', label: `Danh mục: ${cat.name}`, paramKey: 'category_id' });
    }
    if (searchParams.get('brand_id')) tags.push({ key: 'brand', label: 'Thương hiệu đã chọn', paramKey: 'brand_id' });
    if (searchParams.get('price_min') || searchParams.get('price_max')) {
      const min = searchParams.get('price_min');
      const max = searchParams.get('price_max');
      let label = 'Giá: ';
      if (min && max) label += `${Number(min).toLocaleString('vi-VN')}₫ - ${Number(max).toLocaleString('vi-VN')}₫`;
      else if (min) label += `Từ ${Number(min).toLocaleString('vi-VN')}₫`;
      else if (max) label += `Dưới ${Number(max).toLocaleString('vi-VN')}₫`;
      tags.push({ key: 'price', label, paramKey: 'price_min' });
    }
    if (searchParams.get('is_new') === 'true') tags.push({ key: 'new', label: 'Sản phẩm mới', paramKey: 'is_new' });
    if (searchParams.get('is_featured') === 'true') tags.push({ key: 'featured', label: 'Nổi bật', paramKey: 'is_featured' });
    if (searchParams.get('rating_min')) {
      const rating = searchParams.get('rating_min');
      tags.push({ key: 'rating', label: `Đánh giá: từ ${rating}★`, paramKey: 'rating_min' });
    }
    return tags;
  }, [searchParams, categories]);

  const removeFilterTag = useCallback((paramKey: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (paramKey === 'price_min') {
      newParams.delete('price_min');
      newParams.delete('price_max');
    } else {
      newParams.delete(paramKey);
    }
    newParams.set('page', '1');
    setSearchParams(newParams);
  }, [searchParams, setSearchParams]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <SeoHead
        title={`${pageTitle} | NBE Hoang Duy`}
        description="Khám phá các sản phẩm bảo hộ lao động chính hãng, giá cạnh tranh tại NBE Hoang Duy."
      />

      {/* Hero Banner */}
      <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-primary rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-secondary rounded-full blur-[100px] translate-x-1/3 translate-y-1/3" />
        </div>
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />

        <div className="container mx-auto px-4 md:px-6 max-w-[1440px] relative z-10">
          <div className="py-10 md:py-14">
            <Breadcrumb
              variant="dark"
              items={[
                { label: 'Trang chủ', href: '/' },
                { label: 'Sản phẩm', href: '/categories' },
                ...(currentCategory ? [{ label: currentCategory.name }] : []),
              ]}
            />
            <div className="mt-4 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-tight">
                  {pageTitle}
                </h1>
                <p className="mt-3 text-gray-400 text-base md:text-lg max-w-2xl">
                  Trang bị các sản phẩm bảo hộ chất lượng cao, chính hãng để đảm bảo an toàn tối đa cho công việc của bạn.
                </p>
              </div>

              {/* Quick Stats */}
              <div className="flex items-center gap-3">
                {[
                  { icon: <Package size={16} />, label: `${totalProducts} sản phẩm` },
                ].map((stat, i) => (
                  <div key={i} className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2.5 rounded-xl border border-white/10">
                    <span className="text-primary">{stat.icon}</span>
                    <span className="text-white text-sm font-semibold">{stat.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 md:px-6 max-w-[1440px] py-6 md:py-8">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Mobile filter toggle */}
            <button
              onClick={() => setShowMobileFilter(true)}
              className="lg:hidden flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:border-primary hover:text-primary transition-all shadow-sm active:scale-95"
            >
              <SlidersHorizontal size={16} />
              Bộ lọc
              {activeFilterCount > 0 && (
                <span className="ml-1 w-5 h-5 bg-primary text-white text-[10px] font-black rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Active filter tags */}
            {activeFilterTags.length > 0 && (
              <div className="hidden sm:flex items-center gap-2 flex-wrap">
                {activeFilterTags.map(tag => (
                  <span
                    key={tag.key}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary text-xs font-semibold rounded-full border border-primary/20"
                  >
                    {tag.label}
                    <button
                      onClick={() => removeFilterTag(tag.paramKey)}
                      className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Grid toggle */}
            <div className="hidden md:flex items-center bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <button
                onClick={() => setGridColumns(4)}
                className={`p-2.5 transition-all ${gridColumns === 4 ? 'bg-primary text-white' : 'text-gray-400 hover:text-gray-600'}`}
                title="Hiển thị 4 cột"
              >
                <Grid3X3 size={16} />
              </button>
              <button
                onClick={() => setGridColumns(3)}
                className={`p-2.5 transition-all ${gridColumns === 3 ? 'bg-primary text-white' : 'text-gray-400 hover:text-gray-600'}`}
                title="Hiển thị 3 cột"
              >
                <LayoutGrid size={16} />
              </button>
            </div>

            {/* Items per page */}
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-1.5 shadow-sm">
              <span className="text-xs text-gray-400 font-medium whitespace-nowrap">Hiển thị:</span>
              {[12, 24, 48].map(n => (
                <button
                  key={n}
                  onClick={() => handleLimitChange(n)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    limit === n
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>

            {/* Results summary */}
            <div className="hidden sm:block text-sm text-gray-500">
              <span className="font-bold text-gray-800">{totalProducts}</span> sản phẩm
            </div>
          </div>
        </div>

        <div className="flex gap-7">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-[280px] flex-shrink-0">
            <ProductSortFilter hideBrandFilter={false} />
          </aside>

          {/* Product Grid Area */}
          <div className="flex-1 min-w-0">
            <ProductGrid products={data?.items || []} loading={isLoading} columns={gridColumns} />
            {data && data.total > limit && (
              <div className="mt-8">
                <PaginationControls total={data.total} skip={skip} limit={limit} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      <AnimatePresence>
        {showMobileFilter && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMobileFilter(false)}
              className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="fixed left-0 top-0 bottom-0 w-[320px] max-w-[85vw] bg-gray-50 z-50 overflow-y-auto shadow-2xl"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white sticky top-0 z-10">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <SlidersHorizontal size={18} className="text-primary" />
                  Bộ lọc sản phẩm
                </h3>
                <button
                  onClick={() => setShowMobileFilter(false)}
                  className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center hover:bg-gray-200 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="p-4">
                <ProductSortFilter hideBrandFilter={false} />
              </div>
              {/* Bottom CTA */}
              <div className="sticky bottom-0 p-4 bg-white border-t border-gray-200">
                <button
                  onClick={() => setShowMobileFilter(false)}
                  className="w-full py-3.5 bg-primary text-white font-bold rounded-xl text-sm uppercase tracking-wider hover:bg-primary/90 transition-all active:scale-95 shadow-lg shadow-primary/20"
                >
                  Xem {totalProducts} sản phẩm
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default CategoryPage;
