// src/components/layout/Footer.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Youtube, Instagram, MapPin, Mail, Phone, Zap } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white font-sans border-t border-gray-100">
      {/* Main Footer */}
      <div className="container mx-auto pt-20 pb-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
        {/* Column 1: Brand */}
        <div className="space-y-8">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-primary text-white flex items-center justify-center rounded-xl font-black text-xl shadow-sm">
                <Zap size={22} className="fill-white" />
            </div>
            <span className="text-2xl font-black text-gray-900 tracking-tighter">
                NBE Hoang Duy<span className="text-primary">.</span>
            </span>
          </Link>
          <p className="text-sm text-gray-500 leading-relaxed font-medium">
            Nhà cung cấp thiết bị bảo hộ lao động hàng đầu Việt Nam. Cam kết chính hãng, chất lượng, giá tốt nhất thị trường.
          </p>
          <div className="flex gap-4 pt-2">
            {[
              { href: '#', bg: 'bg-[#3b5998]', icon: Facebook },
              { href: '#', bg: 'bg-[#ff0000]', icon: Youtube },
              { href: '#', bg: 'bg-[#e4405f]', icon: Instagram },
            ].map((s, i) => {
              const Icon = s.icon;
              return (
                <a key={i} href={s.href} className={`w-10 h-10 rounded-xl ${s.bg} text-white flex items-center justify-center transition-all hover:-translate-y-1 shadow-md`}>
                  <Icon size={18} />
                </a>
              );
            })}
          </div>
        </div>

        {/* Column 2: Quick Links */}
        <div className="lg:pl-10">
          <h3 className="font-black text-gray-900 text-[15px] mb-8 tracking-tight uppercase">Cửa Hàng</h3>
          <ul className="space-y-4">
            {[
              { to: '/categories', label: 'Tất cả sản phẩm' },
              { to: '/sale', label: 'Khuyến mãi' },
              { to: '/brand/3m', label: 'Thương hiệu 3M' },
              { to: '/video', label: 'Video hướng dẫn' },
              { to: '/blog', label: 'Tin tức & Blog' },
            ].map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="text-sm text-gray-500 hover:text-primary transition-colors font-bold flex items-center gap-2 group">
                  <span className="w-1 h-1 rounded-full bg-gray-200 group-hover:bg-primary transition-colors" />
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Column 3: Support */}
        <div>
          <h3 className="font-black text-gray-900 text-[15px] mb-8 tracking-tight uppercase">Hỗ Trợ</h3>
          <ul className="space-y-4">
            {[
              { to: '/about', label: 'Về chúng tôi' },
              { to: '/contact', label: 'Liên hệ' },
              { to: '/policy/shipping', label: 'Chính sách giao hàng' },
              { to: '/policy/returns', label: 'Đổi trả & Bảo hành' },
              { to: '/dealer', label: 'Đăng ký đại lý' },
            ].map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="text-sm text-gray-500 hover:text-primary transition-colors font-bold flex items-center gap-2 group">
                  <span className="w-1 h-1 rounded-full bg-gray-200 group-hover:bg-primary transition-colors" />
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Column 4: Contact */}
        <div>
          <h3 className="font-black text-gray-900 text-[15px] mb-8 tracking-tight uppercase">Liên Hệ</h3>
          <ul className="space-y-6">
            <li className="flex gap-4 items-start">
              <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 flex-shrink-0 group-hover:text-primary transition-colors">
                <MapPin size={20} strokeWidth={2} />
              </div>
              <span className="text-sm text-gray-500 font-bold leading-relaxed">123 Đường Điện Biên Phủ, Bình Thạnh, TP.HCM</span>
            </li>
            <li className="flex gap-4 items-center">
              <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 flex-shrink-0 group-hover:text-primary transition-colors">
                <Phone size={18} strokeWidth={2} />
              </div>
              <a href="tel:0372371668" className="text-sm font-black text-gray-900 hover:text-primary transition-colors leading-none tracking-tight">0372.371.668</a>
            </li>
            <li className="flex gap-4 items-center">
              <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 flex-shrink-0 group-hover:text-primary transition-colors">
                <Mail size={18} strokeWidth={2} />
              </div>
              <a href="mailto:info@nbehoangduy.vn" className="text-sm text-gray-500 font-bold hover:text-primary transition-colors leading-none">info@nbehoangduy.vn</a>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-100 bg-[#f8f8f8]">
        <div className="container mx-auto py-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs font-bold text-gray-400 tracking-tighter uppercase">© 2026 NBE Hoang Duy. All rights reserved.</p>
          <div className="flex items-center gap-6 text-xs text-gray-400 font-bold">
            <Link to="/policy/privacy" className="hover:text-primary transition-colors uppercase tracking-widest text-[10px]">Chính sách bảo mật</Link>
            <Link to="/policy/terms" className="hover:text-primary transition-colors uppercase tracking-widest text-[10px]">Điều khoản</Link>
          </div>
        </div>
      </div>

    </footer>
  );
};

