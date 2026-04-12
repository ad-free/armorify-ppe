// src/pages/auth/LoginPage.tsx
import React from 'react';
import { SeoHead } from '@/components/common/SeoHead';
import { LoginForm } from '@/components/auth/LoginForm';

// Import the background image statically or use AI generated placeholder. 
const BGD_IMG = '/auth/login_bg.png';

const LoginPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 md:p-8">
      <SeoHead title="Đăng nhập | NBE Hoang Duy" description="Đăng nhập để xem đơn hàng và quản lý tài khoản của bạn." />

      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row min-h-[600px]">

        {/* Left Side: Graphic / Splash */}
        <div className="md:w-1/2 bg-gray-900 relative hidden md:block">
          <img
            src={BGD_IMG}
            alt="Safety Background"
            className="absolute inset-0 w-full h-full object-cover opacity-60"
            loading="lazy"
          />
          <div className="relative z-10 p-12 flex flex-col justify-end h-full text-white">
            <h1 className="text-4xl lg:text-5xl font-black mb-4 leading-tight">
              An Toàn<br /><span className="text-primary">Lên Hàng Đầu</span>
            </h1>
            <p className="text-lg text-gray-300">
              Truy cập tài khoản NBE Hoang Duy để theo dõi lộ trình đơn hàng, nhận bảng báo giá sỉ tự động và tích lũy điểm thưởng doanh nghiệp.
            </p>
          </div>
        </div>

        {/* Right Side: Form Mount */}
        <div className="md:w-1/2 flex items-center justify-center p-6 md:p-12">
          <div className="w-full max-w-sm">
            <div className="text-center mb-8 md:hidden">
              <h2 className="text-3xl font-black">NBE Hoang Duy</h2>
              <p className="text-gray-500 mt-2">Đăng nhập tài khoản</p>
            </div>
            {/* The actual robust logic is inside LoginForm Component */}
            <LoginForm />
          </div>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;
