// src/components/layout/Footer.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Youtube, Instagram, MapPin, Mail, Phone } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t pt-16 pb-8 text-sm text-gray-600">
      <div className="container mx-auto px-4 max-w-7xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
        {/* Column 1: Info */}
        <div className="space-y-4">
          <Link to="/" className="flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-primary text-white flex items-center justify-center rounded-lg font-bold text-xl">A</div>
            <span className="text-2xl font-black text-gray-900 tracking-tight">NBE Hoang Duy</span>
          </Link>
          <p className="leading-relaxed">
            Leading supplier of genuine, high-quality Personal Protective Equipment in Vietnam. Ensuring safety for your everyday work infrastructure.
          </p>
          <div className="flex gap-4 pt-2">
            <a href="#" className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition">
              <Facebook size={16} />
            </a>
            <a href="#" className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-700 transition">
              <Youtube size={16} />
            </a>
            <a href="#" className="w-8 h-8 rounded-full bg-pink-600 text-white flex items-center justify-center hover:bg-pink-700 transition">
              <Instagram size={16} />
            </a>
          </div>
        </div>

        {/* Column 2: Policies */}
        <div>
          <h3 className="font-bold text-gray-900 text-lg mb-6 uppercase tracking-wider">Hỗ Trợ Khách Hàng</h3>
          <ul className="space-y-3 font-medium">
            <li><Link to="/about" className="hover:text-primary transition-colors">Giới thiệu NBE Hoang Duy</Link></li>
            <li><Link to="/policy/shipping" className="hover:text-primary transition-colors">Chính sách giao hàng</Link></li>
            <li><Link to="/policy/returns" className="hover:text-primary transition-colors">Chính sách đổi trả bảo hành</Link></li>
            <li><Link to="/policy/privacy" className="hover:text-primary transition-colors">Chính sách bảo mật</Link></li>
            <li><Link to="/dealer" className="hover:text-primary transition-colors">Đăng ký đại lý sỉ</Link></li>
          </ul>
        </div>

        {/* Column 3: Contact */}
        <div>
          <h3 className="font-bold text-gray-900 text-lg mb-6 uppercase tracking-wider">Thông Tin Liên Hệ</h3>
          <ul className="space-y-4">
            <li className="flex gap-3 items-start">
              <MapPin className="text-primary flex-shrink-0 mt-0.5" size={18} />
              <span>123 Đường Điện Biên Phủ, Phường 15, Quận Bình Thạnh, TP.HCM</span>
            </li>
            <li className="flex gap-3 items-center">
              <Phone className="text-primary flex-shrink-0" size={18} />
              <span className="font-bold text-gray-900">0372.371.668 (Zalo/Call)</span>
            </li>
            <li className="flex gap-3 items-center">
              <Mail className="text-primary flex-shrink-0" size={18} />
              <span>info@nbehoangduy.vn</span>
            </li>
          </ul>
        </div>

        {/* Column 4: Certifications */}
        <div>
          <h3 className="font-bold text-gray-900 text-lg mb-6 uppercase tracking-wider">Chứng Nhận</h3>
          <div className="space-y-4">
            <div className="bg-gray-100 p-4 rounded text-center border-dashed border-2 border-gray-200 font-bold text-gray-400">
              [Logo Bộ Công Thương]
            </div>
            <div className="bg-gray-100 p-4 rounded text-center border-dashed border-2 border-gray-200 font-bold text-gray-400">
              [DMCA Protected]
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200">
        <div className="container mx-auto px-4 py-6 max-w-7xl flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-medium text-gray-500">
          <p>© 2026 CÔNG TY TNHH NBE HOANG DUY. All rights reserved.</p>
          <div className="flex gap-4">
            <span>Mã số thuế: 0101234567</span>
            <span>Cấp bởi: Sở Kế Hoạch & Đầu Tư TP.HCM</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
