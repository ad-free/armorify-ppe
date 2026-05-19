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
    <div className="bg-[#f8fafc] min-h-screen pb-24">
      <SeoHead
        title="Video Review Sản Phẩm Bảo Hộ"
        description="Tổng hợp các video đánh giá, hướng dẫn sử dụng thiết bị bảo hộ lao động thực tế nhất."
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
                { label: 'Video Review' }
              ]}
            />
            <div className="mt-6 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              <div className="space-y-4">
                <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-white tracking-tight uppercase leading-none">
                  Video Đánh Giá Sản Phẩm
                </h1>
                <p className="text-slate-400 max-w-2xl text-xs md:text-sm font-semibold leading-relaxed">
                  Khám phá chi tiết các sản phẩm bảo hộ lao động qua góc nhìn cận cảnh và chân thực nhất.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 max-w-7xl">

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
      </div>
    </div>
  );
};

export default VideoPage;
