// src/pages/public/BrandPage.tsx
import React from 'react';
import { useParams, Navigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SeoHead } from '@/components/common/SeoHead';
import { Breadcrumb } from '@/components/common/Breadcrumb';
import { PaginationControls } from '@/components/common/PaginationControls';
import { useBrands, useProducts } from '@/hooks/useCatalog';
import { ProductGrid } from '@/components/catalog/ProductGrid';
import { ProductSortFilter } from '@/components/catalog/ProductSortFilter';
import { getMediaUrl } from '@/lib/api';
import { Award, Globe, ShieldCheck, ArrowLeft, Grid3X3 } from 'lucide-react';
import { Link } from 'react-router-dom';

const BrandPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  
  const { data: brands, isLoading: brandsLoading } = useBrands();
  const brand = brands?.items?.find((b) => b.slug === slug);

  // Pagination & filter state from URL
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = 16;
  const skip = (page - 1) * limit;
  const sort_by = searchParams.get('sort_by') as any || 'newest';
  const price_min = searchParams.has('price_min') ? Number(searchParams.get('price_min')) : undefined;
  const price_max = searchParams.has('price_max') ? Number(searchParams.get('price_max')) : undefined;
  const rating_min = searchParams.get('rating_min') ? Number(searchParams.get('rating_min')) : undefined;

  const { data: productsData, isLoading: productsLoading } = useProducts({
    brand_id: brand?.id,
    skip,
    limit,
    sort_by,
    price_min,
    price_max,
    rating_min,
  });

  if (brandsLoading) {
    return (
      <div className="container mx-auto py-32 text-center flex flex-col items-center justify-center space-y-6">
        <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        <span className="text-gray-400 font-black text-xs uppercase tracking-[0.2em] animate-pulse">Đang tải thương hiệu...</span>
      </div>
    );
  }

  if (!brandsLoading && !brand) return <Navigate to="/" replace />;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-[#f8fafc] min-h-screen pb-20"
    >
      <SeoHead
        title={`Thương hiệu ${brand?.name} - NBE Hoang Duy`}
        description={brand?.description || `Khám phá các sản phẩm bảo hộ lao động chính hãng từ thương hiệu ${brand?.name}.`}
      />

      {/* Hero Header Area */}
      <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-zinc-900 text-white overflow-hidden py-16 md:py-24">
        {/* Subtle decorative background patterns */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-primary rounded-full blur-[180px] opacity-10 pointer-events-none" />
        
        <div className="container mx-auto px-6 max-w-7xl relative z-10">
          <div className="mb-6">
            <Breadcrumb
              items={[
                { label: 'Trang chủ', href: '/' },
                { label: 'Thương hiệu', href: '/#brands' },
                { label: brand?.name || '' }
              ]}
            />
          </div>

          <div className="flex flex-col lg:flex-row items-center lg:items-start gap-10 mt-8">
            {/* Brand Logo in a Premium Card */}
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, type: 'spring' }}
              className="w-44 h-44 flex-shrink-0 flex items-center justify-center rounded-[2.5rem] bg-white p-6 shadow-2xl border border-white/10 backdrop-blur-3xl group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              {brand?.logo_url ? (
                <img 
                  src={getMediaUrl(brand.logo_url)} 
                  alt={brand.name} 
                  className="max-w-full max-h-full object-contain filter contrast-125 group-hover:scale-105 transition-transform duration-700" 
                />
              ) : (
                <Award size={48} className="text-primary animate-pulse" />
              )}
            </motion.div>

            {/* Brand Info */}
            <div className="flex-1 text-center lg:text-left">
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex flex-wrap justify-center lg:justify-start items-center gap-3 mb-4"
              >
                <h1 className="text-4xl md:text-5xl font-black tracking-tight">{brand?.name}</h1>
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black bg-white/10 backdrop-blur-md text-primary tracking-widest uppercase border border-white/5">
                  <ShieldCheck size={14} className="fill-primary text-slate-900" /> CHÍNH HÃNG 100%
                </span>
              </motion.div>

              {brand?.country_of_origin && (
                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.25 }}
                  className="flex items-center justify-center lg:justify-start gap-2 text-sm text-slate-300 font-bold mb-6"
                >
                  <Globe size={16} className="text-primary" />
                  <span>Xuất xứ: <strong className="text-white font-black">{brand.country_of_origin}</strong></span>
                </motion.div>
              )}

              {brand?.description && (
                <motion.p 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-slate-300 max-w-4xl text-base md:text-lg leading-relaxed font-medium"
                >
                  {brand.description}
                </motion.p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Listing Section */}
      <div className="container mx-auto px-6 max-w-7xl py-12">
        <div className="flex flex-col lg:flex-row gap-10">
          
          {/* Sidebar Filter - Glassmorphic styled card */}
          <div className="w-full lg:w-72 flex-shrink-0">
            <div className="sticky top-28 bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-50">
                <Grid3X3 size={18} className="text-primary" />
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Bộ Lọc Sản Phẩm</h3>
              </div>
              <ProductSortFilter hideBrandFilter />
            </div>
          </div>

          {/* Product Listing Area */}
          <div className="flex-1 min-w-0">
            {productsLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 animate-pulse">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="bg-white aspect-[3/4] rounded-[2rem] border border-slate-100"></div>
                ))}
              </div>
            ) : productsData?.items.length === 0 ? (
              <div className="py-24 text-center border border-dashed border-slate-200 rounded-[2.5rem] bg-white shadow-sm flex flex-col items-center px-6">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-6 text-slate-400">
                  <Grid3X3 size={32} />
                </div>
                <h3 className="text-lg font-black text-slate-900 mb-2">Không tìm thấy sản phẩm nào</h3>
                <p className="text-slate-500 font-medium max-w-md text-sm leading-relaxed mb-8">
                  Hiện chưa có sản phẩm nào tương thích với các tiêu chí lọc được chọn. Vui lòng làm sạch bộ lọc hoặc quay lại sau.
                </p>
                <Link 
                  to={`/brand/${slug}`}
                  className="px-8 py-3.5 bg-primary text-white text-xs font-black rounded-xl hover:bg-primary/90 transition-all flex items-center gap-2"
                >
                  <ArrowLeft size={14} strokeWidth={3} /> Đặt lại bộ lọc
                </Link>
              </div>
            ) : (
              <div className="space-y-12">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
                    Tìm thấy <strong className="text-slate-900">{productsData?.total ?? 0}</strong> sản phẩm
                  </span>
                </div>
                <ProductGrid products={productsData?.items || []} />
                {productsData && productsData.total > limit && (
                  <div className="pt-6 border-t border-slate-100">
                    <PaginationControls total={productsData.total} skip={skip} limit={limit} />
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      </div>
    </motion.div>
  );
};

export default BrandPage;
