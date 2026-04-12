// src/pages/auth/RegisterPage.tsx
import React from 'react';
import { SeoHead } from '@/components/common/SeoHead';
import { RegisterForm } from '@/components/auth/RegisterForm';

const BGD_IMG = '/register_bg.png';

const RegisterPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 md:p-8">
      <SeoHead title="Đăng ký tài khoản | NBE Hoang Duy" description="Tạo tài khoản đại lý ngay hôm nay." />
      
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row-reverse min-h-[650px]">
        
        {/* Right Side: Graphic / Splash */}
        <div className="md:w-1/2 bg-gray-900 relative hidden md:block">
          <img 
            src={BGD_IMG} 
            alt="Safety Background" 
            className="absolute inset-0 w-full h-full object-cover opacity-60"
            loading="lazy"
          />
          <div className="relative z-10 p-12 flex flex-col justify-end h-full text-white">
            <h1 className="text-4xl lg:text-5xl font-black mb-4 leading-tight">
              Trở Thành<br/><span className="text-primary">Đại Lý Sỉ</span>
            </h1>
            <p className="text-lg text-gray-300">
              Đăng ký mua hàng với NBE Hoang Duy để được truy cập mức giá chiết khấu lớn nhất thị trường dành cho tổ chức và đại lý cấp 1.
            </p>
          </div>
        </div>

        {/* Left Side: Form Mount */}
        <div className="md:w-1/2 flex items-center justify-center p-6 md:p-12">
          <div className="w-full max-w-sm">
            {/* The actual robust logic is inside RegisterForm Component */}
            <RegisterForm />
          </div>
        </div>

      </div>
    </div>
  );
};

export default RegisterPage;
