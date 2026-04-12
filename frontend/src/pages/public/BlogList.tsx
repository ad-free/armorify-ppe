// src/pages/public/BlogList.tsx
import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SeoHead } from '@/components/common/SeoHead';
import { Breadcrumb } from '@/components/common/Breadcrumb';
import { PaginationControls } from '@/components/common/PaginationControls';
import { BlogGrid } from '@/components/blog/BlogGrid';
import { useBlogPosts } from '@/hooks/useBlog';

const BlogList: React.FC = () => {
  const [searchParams] = useSearchParams();
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = 12;
  const skip = (page - 1) * limit;

  const { data, isLoading } = useBlogPosts(skip, limit);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="container mx-auto px-4 py-8 max-w-7xl"
    >
      <SeoHead
        title="Tin Tức & Kiến Thức Bảo Hộ Lao Động"
        description="Cập nhật kiến thức bảo hộ lao động, review sản phẩm, và các tin tức mới nhất từ NBE Hoang Duy."
      />
      
      <Breadcrumb
        items={[
          { label: 'Trang chủ', href: '/' },
          { label: 'Tin tức' }
        ]}
      />

      <div className="mb-8 mt-4">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">Tin Tức & Kiến Thức</h1>
        <p className="text-muted-foreground text-lg max-w-3xl">
          Cập nhật những thông tin mới nhất về an toàn lao động, hướng dẫn sử dụng thiết bị và các sự kiện nổi bật.
        </p>
      </div>

      <BlogGrid posts={data?.items || []} loading={isLoading} />

      {data && data.total > limit && (
        <PaginationControls total={data.total} skip={skip} limit={limit} />
      )}
    </motion.div>
  );
};

export default BlogList;
