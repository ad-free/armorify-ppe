// src/pages/public/CheckoutPage.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { SeoHead } from '@/components/common/SeoHead';
import { Breadcrumb } from '@/components/common/Breadcrumb';
import { GuestOrderForm } from '@/components/order/GuestOrderForm';
import { ShieldCheck, Truck, RotateCcw } from 'lucide-react';

const CheckoutPage: React.FC = () => {
  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      <SeoHead title="Hoàn tất đơn hàng | NBE Hoang Duy" />

      {/* Breadcrumb bar */}
      <div className="bg-white border-b py-4">
        <div className="container mx-auto px-4 max-w-7xl">
          <Breadcrumb
            items={[
              { label: 'Trang chủ', href: '/' },
              { label: 'Giỏ hàng', href: '/cart' },
              { label: 'Hoàn tất đơn hàng' },
            ]}
          />
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-7xl pt-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 uppercase tracking-tight">
            Hoàn tất đơn hàng
          </h1>
          <p className="text-gray-500 mt-1.5 text-sm">
            Điền thông tin giao hàng và kiểm tra lại đơn trước khi xác nhận.
          </p>
        </div>

        {/* Trust badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
          {[
            { icon: <ShieldCheck size={20} className="text-emerald-600" />, label: 'Thanh toán bảo mật', desc: 'Mã hoá SSL 256-bit' },
            { icon: <Truck size={20} className="text-blue-600" />, label: 'Giao hàng nhanh', desc: 'Toàn quốc trong 2-5 ngày' },
            { icon: <RotateCcw size={20} className="text-amber-600" />, label: 'Đổi trả dễ dàng', desc: 'Trong vòng 30 ngày' },
          ].map((b) => (
            <div key={b.label} className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3">
              <div className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center shrink-0">
                {b.icon}
              </div>
              <div>
                <p className="text-xs font-black text-gray-800 uppercase tracking-tight">{b.label}</p>
                <p className="text-[11px] text-gray-500">{b.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Main Form (2-col inside) */}
        <GuestOrderForm />

        {/* Back link */}
        <div className="mt-6">
          <Link to="/cart" className="text-sm text-gray-500 hover:text-primary font-semibold transition-colors flex items-center gap-1">
            ← Quay lại giỏ hàng
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
