// src/components/layout/Navbar.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ShoppingCart, User, Menu, Phone, Mail, LogOut, LayoutDashboard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MegaMenu } from './MegaMenu';
import { useAuthStore } from '@/store/authStore';

export const Navbar: React.FC = () => {
  const [isCategoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsProfileOpen(false);
  };

  return (
    <header className="w-full bg-white shadow-sm flex flex-col z-50 relative">
      {/* Top Utility Bar */}
      <div className="bg-gray-100 py-1 hidden lg:block">
        <div className="container mx-auto px-4 max-w-7xl flex justify-between items-center text-xs text-gray-600 font-medium">
          <div className="flex gap-4">
            <span className="flex items-center gap-1"><Phone size={12}/> Hotline: 0372371668</span>
            <span className="flex items-center gap-1"><Mail size={12}/> Email: info@nbehoangduy.vn</span>
          </div>
          <div className="flex gap-4">
            <Link to="/about" className="hover:text-primary">Giới thiệu</Link>
            <Link to="/contact" className="hover:text-primary">Liên hệ</Link>
            <Link to="/dealer" className="hover:text-primary">Tuyển đại lý</Link>
          </div>
        </div>
      </div>

      {/* Main Bar */}
      <div className="container mx-auto px-4 py-4 max-w-7xl flex items-center justify-between gap-4 md:gap-8">
        {/* Logo */}
        <Link to="/" className="flex-shrink-0 flex items-center gap-2">
          <div className="w-10 h-10 bg-primary text-white flex items-center justify-center rounded-lg font-bold text-xl">A</div>
          <span className="text-2xl font-black text-gray-900 tracking-tight hidden sm:block">
            NBE <span className="text-primary">Hoang Duy</span>
          </span>
        </Link>

        {/* Search Bar */}
        <div className="flex-1 max-w-2xl hidden md:flex">
          <div className="relative w-full">
            <input 
              type="text" 
              placeholder="Tìm kiếm giày bảo hộ, dây đai an toàn..."
              className="w-full pl-4 pr-12 py-2.5 rounded-l-md border-y border-l border-gray-300 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm shadow-sm"
            />
            <button className="absolute right-0 top-0 bottom-0 px-4 bg-primary text-white rounded-r-md hover:bg-primary/90 flex items-center justify-center">
              <Search size={20} />
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-6">
          {user ? (
            <div className="relative">
              <button 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex flex-col items-center gap-1 text-gray-700 hover:text-primary transition-colors focus:outline-none"
              >
                <div className="bg-gray-100 p-2 rounded-full cursor-pointer">
                  <User size={20} strokeWidth={2}/>
                </div>
                <span className="text-xs font-semibold hidden lg:block">
                  {user.firstname}
                </span>
              </button>

              {/* Profile Submenu */}
              {isProfileOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsProfileOpen(false)}
                  ></div>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in zoom-in duration-200 origin-top-right">
                    <div className="px-4 py-2 border-b border-gray-100 mb-1">
                      <p className="text-sm font-bold text-gray-900">{user.firstname} {user.lastname}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email || user.phone}</p>
                    </div>
                    
                    <Link 
                      to="/profile" 
                      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <User size={16} />
                      <span>Thông tin cá nhân</span>
                    </Link>

                    {user.role === 'admin' && (
                      <Link 
                        to="/admin" 
                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <LayoutDashboard size={16} />
                        <span>Quản trị viên</span>
                      </Link>
                    )}

                    <div className="border-t border-gray-100 mt-1 pt-1">
                      <button 
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
                      >
                        <LogOut size={16} />
                        <span>Đăng xuất</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Link to="/login" className="flex flex-col items-center gap-1 text-gray-700 hover:text-primary transition-colors">
              <div className="bg-gray-100 p-2 rounded-full cursor-pointer">
                <User size={20} strokeWidth={2}/>
              </div>
              <span className="text-xs font-semibold hidden lg:block">
                Đăng nhập
              </span>
            </Link>
          )}
          
          <Link to="/cart" className="flex flex-col items-center gap-1 text-gray-700 hover:text-primary transition-colors relative">
            <div className="relative bg-gray-100 p-2 rounded-full cursor-pointer">
              <ShoppingCart size={20} strokeWidth={2}/>
              <span className="absolute -top-1 -right-1 bg-destructive text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                0
              </span>
            </div>
            <span className="text-xs font-semibold hidden lg:block">Giỏ hàng</span>
          </Link>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="bg-primary text-primary-foreground hidden md:block">
        <div className="container mx-auto px-4 max-w-7xl flex items-center">
          {/* Categories Megamenu Trigger */}
          <div 
            className="flex items-center gap-2 bg-black/10 hover:bg-black/20 cursor-pointer py-3 px-6 transition-colors relative group"
            onMouseEnter={() => setCategoryMenuOpen(true)}
            onMouseLeave={() => setCategoryMenuOpen(false)}
          >
            <Menu size={20}/>
            <span className="font-bold tracking-wide text-sm uppercase">Danh Mục Sản Phẩm</span>
            
            {/* The actual Mega Menu */}
            <div className="absolute top-full left-0 w-full lg:w-[800px] z-50">
              <MegaMenu isOpen={isCategoryMenuOpen} onClose={() => setCategoryMenuOpen(false)} />
            </div>
          </div>

          {/* Quick Links */}
          <div className="flex items-center gap-8 ml-8 text-sm font-bold uppercase tracking-wide">
            <Link to="/sale" className="hover:text-yellow-300 transition-colors">⚡ Khuyến Mãi</Link>
            <Link to="/brand/3m" className="hover:text-white/80 transition-colors">Thương Hiệu 3M</Link>
            <Link to="/video" className="hover:text-white/80 transition-colors">Video Review</Link>
            <Link to="/blog" className="hover:text-white/80 transition-colors">Tin Tức Kỹ Thuật</Link>
          </div>
        </div>
      </div>
    </header>
  );
};
