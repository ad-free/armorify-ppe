// src/pages/public/WishlistPage.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, ArrowRight, Trash2 } from 'lucide-react';
import { useWishlistStore } from '@/store/wishlistStore';
import { ProductCard } from '@/components/catalog/ProductCard';
import { motion, AnimatePresence } from 'framer-motion';
import { SeoHead } from '@/components/common/SeoHead';
import { Breadcrumb } from '@/components/common/Breadcrumb';

const WishlistPage: React.FC = () => {
  const { items, clearWishlist } = useWishlistStore();

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-24">
      <SeoHead
        title="Danh sách yêu thích | Armorify PPE"
        description="Xem lại các sản phẩm bảo hộ lao động bạn đã yêu thích tại Armorify."
      />

      {/* Header Section */}
      <div className="bg-white border-b border-gray-100 pt-6 pb-8">
        <div className="container mx-auto px-4 max-w-7xl">
          <Breadcrumb items={[{ label: 'Trang chủ', href: '/' }, { label: 'Yêu thích' }]} />

          <div className="mt-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 mb-2"
              >
                <div className="w-8 h-8 bg-rose-50 text-rose-500 rounded-lg flex items-center justify-center shadow-sm">
                  <Heart size={16} fill="currentColor" />
                </div>
                <span className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em]">Cá nhân hóa</span>
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight"
              >
                Sản phẩm <span className="text-primary">yêu thích</span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-gray-500 mt-2 text-[15px] font-medium max-w-xl leading-relaxed"
              >
                Lưu giữ những sản phẩm bạn quan tâm để dễ dàng so sánh và mua sắm sau này.
                {items.length > 0 && ` Hiện có ${items.length} mục.`}
              </motion.p>
            </div>

            {items.length > 0 && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={clearWishlist}
                className="flex items-center gap-2 px-5 py-2.5 text-rose-500 hover:bg-rose-50 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest border border-rose-100 shadow-sm active:scale-95"
              >
                <Trash2 size={14} />
                Xóa toàn bộ
              </motion.button>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-7xl mt-8">
        <AnimatePresence mode="wait">
          {items.length > 0 ? (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-5"
            >
              {items.map((product, idx) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="bg-white rounded-[2.5rem] border border-gray-100 shadow-[0_30px_100px_rgba(0,0,0,0.03)] p-12 md:p-16 text-center flex flex-col items-center max-w-2xl mx-auto"
            >
              <div className="w-24 h-24 bg-gray-50 rounded-[2rem] flex items-center justify-center text-gray-200 mb-6 relative">
                <Heart size={48} className="stroke-[1.5]" />
                <div className="absolute -top-1 -right-1 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md border border-gray-50">
                  <ShoppingBag size={16} className="text-primary" />
                </div>
              </div>

              <h2 className="text-2xl font-black text-gray-900 mb-3 tracking-tight">Danh sách trống trải</h2>
              <p className="text-gray-400 font-medium text-base mb-8 max-w-md">
                Có vẻ như bạn chưa thêm sản phẩm nào vào mục yêu thích. Hãy khám phá kho hàng của chúng tôi để tìm thấy những sản phẩm ưng ý nhất!
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  to="/categories"
                  className="px-8 py-4 bg-primary text-white font-black rounded-2xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all flex items-center gap-2 uppercase text-[11px] tracking-widest active:scale-95"
                >
                  Khám phá ngay <ArrowRight size={16} />
                </Link>
                <Link
                  to="/"
                  className="px-8 py-4 bg-white text-gray-400 border border-gray-100 font-black rounded-2xl hover:bg-gray-50 transition-all uppercase text-[11px] tracking-widest active:scale-95"
                >
                  Trang chủ
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Featured Suggestion Section (Optional) */}
      {items.length > 0 && (
        <div className="container mx-auto px-4 max-w-7xl mt-24 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/5 rounded-full mb-6">
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
            <span className="text-[10px] font-black text-primary uppercase tracking-widest">Đừng bỏ lỡ</span>
          </div>
          <h3 className="text-2xl font-black text-gray-900 mb-10">Gợi ý dành riêng cho bạn</h3>
          <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.3em]">Hệ thống đang chuẩn bị thêm nhiều sản phẩm mới...</p>
        </div>
      )}
    </div>
  );
};

export default WishlistPage;
