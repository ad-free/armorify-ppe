import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SeoHead } from '@/components/common/SeoHead';
import { Breadcrumb } from '@/components/common/Breadcrumb';
import { ProductGrid } from '@/components/catalog/ProductGrid';
import { ProductSortFilter } from '@/components/catalog/ProductSortFilter';
import { PaginationControls } from '@/components/common/PaginationControls';
import { useProducts } from '@/hooks/useCatalog';

const SearchPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';

  // Pagination & filter state from URL
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = 20;
  const skip = (page - 1) * limit;
  const sort_by = searchParams.get('sort_by') as any || 'newest';
  const category_id = searchParams.get('category_id') || undefined;
  const brand_id = searchParams.get('brand_id') || undefined;
  const price_min = searchParams.get('price_min') ? Number(searchParams.get('price_min')) : undefined;
  const price_max = searchParams.get('price_max') ? Number(searchParams.get('price_max')) : undefined;
  const is_new = searchParams.get('is_new') === 'true' ? true : undefined;
  const is_featured = searchParams.get('is_featured') === 'true' ? true : undefined;
  const rating_min = searchParams.get('rating_min') ? Number(searchParams.get('rating_min')) : undefined;

  const { data, isLoading } = useProducts(
    {
      skip,
      limit,
      sort_by,
      q: query,
      category_id,
      brand_id,
      price_min,
      price_max,
      is_new,
      is_featured,
      rating_min,
    },
    { enabled: !!query }
  );

  return (
    <div className="bg-[#f8fafc] min-h-screen pb-24">
      <SeoHead
        title={`Tìm kiếm: ${query}`}
        description={`Kết quả tìm kiếm cho ${query} tại NBE Hoang Duy.`}
      />

      {/* Hero Banner with Embedded Breadcrumb */}
      <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 overflow-hidden border-b border-slate-800/80 mb-12">
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-0 left-0 w-96 h-96 bg-primary rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-teal-500 rounded-full blur-[100px] translate-x-1/3 translate-y-1/3" />
        </div>
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />

        <div className="container mx-auto px-6 max-w-7xl relative z-10">
          <div className="py-12 md:py-16">
            <Breadcrumb
              variant="dark"
              items={[
                { label: 'Trang chủ', href: '/' },
                { label: 'Tìm kiếm' }
              ]}
            />
            <div className="mt-6 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              <div className="space-y-4">
                <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-white tracking-tight uppercase leading-none">
                  Kết quả tìm kiếm cho: <span className="text-primary">"{query}"</span>
                </h1>
                <p className="text-slate-400 max-w-2xl text-xs md:text-sm font-semibold leading-relaxed">
                  {data?.total 
                    ? `Tìm thấy ${data.total} sản phẩm phù hợp với từ khóa của bạn.` 
                    : !isLoading && query ? 'Không tìm thấy sản phẩm nào phù hợp.' : ''}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 max-w-7xl">

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Filter */}
        <div className="w-full lg:w-72 flex-shrink-0">
          <ProductSortFilter hideBrandFilter={false} />
        </div>

        {/* Product Grid */}
        <div className="flex-1">
          <ProductGrid products={data?.items || []} loading={isLoading} />
          {data && data.total > limit && (
            <div className="mt-8">
              <PaginationControls total={data.total} skip={skip} limit={limit} />
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
};

export default SearchPage;
