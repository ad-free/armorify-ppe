// src/pages/public/BrandPage.tsx
import React from 'react';
import { useParams, Navigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SeoHead } from '@/components/common/SeoHead';
import { Breadcrumb } from '@/components/common/Breadcrumb';
import { PaginationControls } from '@/components/common/PaginationControls';
import { useBrands, useProducts } from '@/hooks/useCatalog';
// Note: Assumes these exist in the codebase based on the prompt context
import { ProductGrid } from '@/components/catalog/ProductGrid';
import { ProductSortFilter } from '@/components/catalog/ProductSortFilter';

const BrandPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  
  const { data: brands, isLoading: brandsLoading } = useBrands();
  const brand = brands?.items?.find((b) => b.slug === slug);

  // Pagination & filter state from URL
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = 24;
  const skip = (page - 1) * limit;
  const sort_by = searchParams.get('sort_by') as any || 'newest';
  const price_min = searchParams.has('price_min') ? Number(searchParams.get('price_min')) : undefined;
  const price_max = searchParams.has('price_max') ? Number(searchParams.get('price_max')) : undefined;

  const { data: productsData, isLoading: productsLoading } = useProducts({
    brand_id: brand?.id,
    skip,
    limit,
    sort_by,
    price_min,
    price_max
  });

  if (brandsLoading) return <div className="container mx-auto py-20 text-center animate-pulse">Đang tải...</div>;
  if (!brandsLoading && !brand) return <Navigate to="/" replace />;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="container mx-auto px-4 py-8 max-w-7xl"
    >
      <SeoHead
        title={`Sản phẩm ${brand?.name}`}
        description={brand?.description || `Khám phá các sản phẩm bảo hộ lao động chính hãng từ thương hiệu ${brand?.name}.`}
      />

      <Breadcrumb
        items={[
          { label: 'Trang chủ', href: '/' },
          { label: 'Thương hiệu', href: '/brands' },
          { label: brand?.name || '' }
        ]}
      />

      <div className="bg-white border rounded-lg p-6 md:p-8 mb-8 flex flex-col md:flex-row items-center md:items-start gap-6 mt-4">
        {brand?.logo_url && (
          <div className="w-40 h-40 flex-shrink-0 flex items-center justify-center border rounded-lg bg-gray-50 p-4">
            <img src={brand.logo_url} alt={brand.name} className="max-w-full max-h-full object-contain" />
          </div>
        )}
        <div className="flex-1 text-center md:text-left">
          <h1 className="text-3xl font-bold mb-2">{brand?.name}</h1>
          {brand?.country_of_origin && (
            <span className="inline-block bg-gray-100 px-3 py-1 rounded text-sm text-gray-600 mb-4 font-medium">
              Xuất xứ: {brand.country_of_origin}
            </span>
          )}
          {brand?.description && (
            <p className="text-gray-600 max-w-3xl">{brand.description}</p>
          )}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Filter */}
        <div className="w-full lg:w-64 flex-shrink-0">
          <ProductSortFilter hideBrandFilter />
        </div>

        {/* Product Grid */}
        <div className="flex-1">
          {productsLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 animate-pulse">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-gray-100 aspect-[3/4] rounded-lg"></div>
              ))}
            </div>
          ) : productsData?.items.length === 0 ? (
            <div className="py-20 text-center text-gray-500 border rounded-lg bg-gray-50">
              Không tìm thấy sản phẩm nào phù hợp với bộ lọc.
            </div>
          ) : (
            <>
              <ProductGrid products={productsData?.items || []} />
              {productsData && productsData.total > limit && (
                <PaginationControls total={productsData.total} skip={skip} limit={limit} />
              )}
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default BrandPage;
