// src/pages/public/VideoPage.tsx
import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SeoHead } from '@/components/common/SeoHead';
import { Breadcrumb } from '@/components/common/Breadcrumb';
import { useProducts } from '@/hooks/useCatalog';

const VideoPage: React.FC = () => {
  // Fetch featured products, then filter client-side for videos as requested
  const { data, isLoading } = useProducts({ is_featured: true, limit: 100 });
  
  const videoProducts = useMemo(() => {
    if (!data?.items) return [];
    return data.items.filter(p => p.video_url != null && p.video_url.trim() !== '');
  }, [data?.items]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="container mx-auto px-4 py-8 max-w-7xl"
    >
      <SeoHead
        title="Video Review Sản Phẩm Bảo Hộ"
        description="Tổng hợp các video đánh giá, hướng dẫn sử dụng thiết bị bảo hộ lao động thực tế nhất."
      />

      <Breadcrumb
        items={[
          { label: 'Trang chủ', href: '/' },
          { label: 'Video Review' }
        ]}
      />

      <div className="mb-8 mt-4">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">Video Đánh Giá Sản Phẩm</h1>
        <p className="text-muted-foreground text-lg max-w-3xl">
          Khám phá chi tiết các sản phẩm bảo hộ lao động qua góc nhìn cận cảnh và chân thực nhất.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-video bg-gray-200 rounded-lg mb-3"></div>
              <div className="h-6 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      ) : videoProducts.length === 0 ? (
        <div className="py-20 text-center text-gray-500 border rounded-lg bg-gray-50">
          Hiện tại chưa có video review nào.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {videoProducts.map(product => (
            <motion.div 
              key={product.id}
              whileHover={{ y: -4 }}
              className="bg-white rounded-xl shadow-sm border overflow-hidden p-4"
            >
              <div className="aspect-[16/9] w-full rounded-lg overflow-hidden bg-black mb-4 flex items-center justify-center">
                <iframe
                  src={product.video_url!}
                  title={`Video review ${product.name}`}
                  allowFullScreen
                  loading="lazy"
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                />
              </div>
              <Link to={`/products/${product.slug}`} className="block">
                <h3 className="font-semibold text-lg hover:text-primary transition-colors line-clamp-2">
                  {product.name}
                </h3>
                <span className="text-primary text-sm font-medium mt-2 inline-block">Mua ngay &rarr;</span>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default VideoPage;
