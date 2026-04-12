// src/pages/public/CategoryPage.tsx
import React from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SeoHead } from '@/components/common/SeoHead';
import { Breadcrumb } from '@/components/common/Breadcrumb';
import { ProductGrid } from '@/components/catalog/ProductGrid';
import { ProductSortFilter } from '@/components/catalog/ProductSortFilter';
import { PaginationControls } from '@/components/common/PaginationControls';
import { useProducts } from '@/hooks/useCatalog';

const CategoryPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();

  // Pagination & filter state from URL
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = 20;
  const skip = (page - 1) * limit;
  const sort_by = searchParams.get('sort_by') as any || 'newest';

  // In reality you would fetch category details by slug, then map the category_id
  const { data, isLoading } = useProducts({ skip, limit, sort_by });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="container mx-auto px-4 py-8 max-w-7xl"
    >
      <SeoHead
        title={`Sản phẩm danh mục ${slug}`}
        description="Khám phá các sản phẩm bảo hộ chính hãng, giá cạnh tranh tại NBE Hoang Duy."
      />

      <Breadcrumb
        items={[
          { label: 'Trang chủ', href: '/' },
          { label: 'Danh mục sản phẩm', href: '/categories' },
          { label: slug?.toUpperCase() || '' }
        ]}
      />

      <div className="mb-8 mt-4">
        <h1 className="text-3xl md:text-4xl font-black mb-4 uppercase">{slug?.replace('-', ' ')}</h1>
        <p className="text-gray-600 text-lg">
          Trang bị các sản phẩm bảo hộ chất lượng cao để đảm bảo an toàn tối đa cho công việc của bạn.
        </p>
      </div>

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
    </motion.div>
  );
};

export default CategoryPage;
