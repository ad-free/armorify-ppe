// src/pages/public/NotFoundPage.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ArrowLeft } from 'lucide-react';

const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-primary/5 flex items-center justify-center px-4 py-20 font-sans">
      <div className="max-w-2xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Giant 404 */}
          <div className="relative mb-8">
            <div className="text-[160px] sm:text-[220px] font-black text-gray-100 leading-none select-none">
              404
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                animate={{ y: [0, -12, 0] }}
                transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                className="w-24 h-24 sm:w-32 sm:h-32 bg-white rounded-3xl shadow-2xl flex items-center justify-center border border-gray-100"
              >
                <span className="text-5xl sm:text-6xl">🔍</span>
              </motion.div>
            </div>
          </div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-2xl sm:text-3xl font-black text-gray-900 mb-3"
          >
            Oops! Trang không tồn tại
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-gray-500 text-base mb-10 max-w-sm mx-auto leading-relaxed"
          >
            Trang bạn đang tìm kiếm đã bị xóa, đổi tên hoặc tạm thời không khả dụng.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link
              to="/"
              className="inline-flex items-center gap-2.5 px-8 py-3.5 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5"
            >
              <Home size={18} />
              Về Trang Chủ
            </Link>
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center gap-2.5 px-8 py-3.5 bg-white text-gray-700 font-bold rounded-xl border border-gray-200 hover:bg-gray-50 transition-all hover:-translate-y-0.5"
            >
              <ArrowLeft size={18} />
              Quay Lại
            </button>
          </motion.div>

          {/* Quick links */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-14 pt-8 border-t border-gray-100"
          >
            <p className="text-sm font-semibold text-gray-400 mb-4">Có thể bạn đang tìm kiếm?</p>
            <div className="flex flex-wrap justify-center gap-3">
              {[
                { to: '/categories', label: '🛡️ Sản Phẩm' },
                { to: '/about', label: '🏢 Về Chúng Tôi' },
                { to: '/contact', label: '📞 Liên Hệ' },
                { to: '/blog', label: '📰 Tin Tức' },
              ].map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-semibold text-gray-600 hover:border-primary hover:text-primary transition-colors"
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default NotFoundPage;
