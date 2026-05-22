// src/pages/public/OrderSuccessPage.tsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Package, ArrowRight, Home, Phone, Download } from 'lucide-react';

const OrderSuccessPage: React.FC = () => {
  const location = useLocation();
  const orderId = (location.state as any)?.orderId || `ORD-${Math.floor(Math.random() * 90000) + 10000}`;

  const steps = [
    { label: 'Đặt Hàng', icon: '📝', done: true },
    { label: 'Xác Nhận', icon: '✅', done: true },
    { label: 'Đóng Gói', icon: '📦', done: false },
    { label: 'Vận Chuyển', icon: '🚚', done: false },
    { label: 'Giao Hàng', icon: '🏠', done: false },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-primary/5 py-16 px-4 font-sans">
      <div className="max-w-2xl mx-auto">

        {/* Success Icon */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', bounce: 0.4, duration: 0.8 }}
          className="flex flex-col items-center mb-8 text-center"
        >
          <div className="relative mb-6">
            <div className="w-28 h-28 bg-emerald-500 rounded-full flex items-center justify-center shadow-2xl shadow-emerald-500/30">
              <CheckCircle size={56} className="text-white" strokeWidth={2.5} />
            </div>
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute inset-0 rounded-full bg-emerald-500 -z-10"
            />
          </div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-3xl font-black text-gray-900 mb-2"
          >
            Đặt Hàng Thành Công! 🎉
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-gray-500 max-w-sm"
          >
            Cảm ơn bạn đã tin tưởng chọn Armorify. Đơn hàng của bạn đang được xử lý.
          </motion.p>
        </motion.div>

        {/* Order Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-6"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-emerald-500 px-6 py-5 text-white">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-1">Mã Đơn Hàng</p>
                <p className="text-xl font-black">#{orderId}</p>
              </div>
              <div className="text-right">
                <p className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-1">Trạng thái</p>
                <span className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full">Đang xử lý</span>
              </div>
            </div>
          </div>

          {/* Order Progress */}
          <div className="px-6 py-6 border-b border-gray-50">
            <p className="text-xs font-extrabold text-gray-400 uppercase tracking-wider mb-5">Tiến Trình Đơn Hàng</p>
            <div className="relative">
              {/* Track line */}
              <div className="absolute top-5 left-5 right-5 h-0.5 bg-gray-100">
                <div className="h-full bg-emerald-500 w-[25%] transition-all" />
              </div>

              <div className="relative flex justify-between">
                {steps.map((step, i) => (
                  <div key={i} className="flex flex-col items-center gap-2 z-10">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold transition-all ${
                      step.done ? 'bg-emerald-500 shadow-lg shadow-emerald-500/30' : 'bg-gray-100'
                    }`}>
                      <span>{step.icon}</span>
                    </div>
                    <p className={`text-[11px] font-semibold text-center leading-tight ${step.done ? 'text-emerald-600' : 'text-gray-400'}`}>
                      {step.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 divide-x divide-y divide-gray-50">
            {[
              { label: 'Phương thức thanh toán', value: 'COD – Thanh toán khi nhận' },
              { label: 'Thời gian giao hàng', value: '3 – 5 ngày làm việc' },
              { label: 'Địa chỉ nhận hàng', value: 'TP. Hồ Chí Minh' },
              { label: 'Email xác nhận', value: 'Đã gửi vào hòm thư' },
            ].map((item, i) => (
              <div key={i} className="px-5 py-4">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">{item.label}</p>
                <p className="text-sm font-semibold text-gray-800">{item.value}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="grid grid-cols-2 gap-4 mb-6"
        >
          <Link
            to="/"
            className="flex items-center justify-center gap-2 py-3.5 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all hover:shadow-lg hover:shadow-primary/20"
          >
            <Home size={18} />
            Trang Chủ
          </Link>
          <Link
            to="/profile?tab=orders"
            className="flex items-center justify-center gap-2 py-3.5 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-all"
          >
            <Package size={18} />
            Xem Đơn Hàng
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="grid grid-cols-2 gap-4"
        >
          <button className="flex items-center justify-center gap-2 py-3 text-sm text-gray-600 border border-dashed border-gray-200 rounded-xl hover:border-primary hover:text-primary transition-colors font-semibold">
            <Download size={16} /> Tải Hóa Đơn PDF
          </button>
          <a
            href="tel:0372371668"
            className="flex items-center justify-center gap-2 py-3 text-sm text-gray-600 border border-dashed border-gray-200 rounded-xl hover:border-primary hover:text-primary transition-colors font-semibold"
          >
            <Phone size={16} /> Hotline Hỗ Trợ
          </a>
        </motion.div>

        {/* Upsell */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="mt-8 text-center"
        >
          <Link
            to="/categories"
            className="inline-flex items-center gap-2 text-primary font-bold text-sm hover:underline"
          >
            Tiếp tục mua sắm <ArrowRight size={16} />
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default OrderSuccessPage;
