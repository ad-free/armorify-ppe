// src/pages/public/CheckoutPage.tsx
import React from 'react';
import { SeoHead } from '@/components/common/SeoHead';
import { GuestOrderForm } from '@/components/order/GuestOrderForm';
import { useCartStore } from '@/store/cartStore';

// Note: GuestOrderForm internally maps cart logic (or uses the mock we built in previous phase)
// In a finalized push, GuestOrderForm would read directly from useCartStore

const CheckoutPage: React.FC = () => {
  useCartStore();

  return (
    <div className="bg-gray-50 min-h-screen py-12">
      <SeoHead title="Thanh toán an toàn | NBE Hoang Duy" />
      
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-gray-900 uppercase">Hoàn tất đơn hàng</h1>
          <p className="text-gray-500 mt-2">NBE Hoang Duy hỗ trợ thanh toán khi nhận hàng (COD) hoặc chuyển khoản an toàn.</p>
        </div>

        <div className="flex items-center justify-center">
            {/* The GuestOrderForm contains the form and total tracking */}
            {/* Mount it here */}
            <GuestOrderForm />
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
