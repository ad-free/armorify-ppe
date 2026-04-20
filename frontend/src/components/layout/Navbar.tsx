// src/components/layout/Navbar.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ShoppingCart, User, Menu, Phone, Mail, LogOut, LayoutDashboard, MapPin, Zap, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import { MegaMenu } from './MegaMenu';
import { useAuthStore } from '@/store/authStore';
import { authToast } from '@/lib/toast';

export const Navbar: React.FC = () => {
  const [isCategoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const categoryMenuTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = React.useRef<HTMLDivElement>(null);

  const handleCategoryMenuOpen = () => {
    if (categoryMenuTimeoutRef.current) clearTimeout(categoryMenuTimeoutRef.current);
    setCategoryMenuOpen(true);
  };

  const handleCategoryMenuClose = () => {
    categoryMenuTimeoutRef.current = setTimeout(() => {
      setCategoryMenuOpen(false);
    }, 150);
  };
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  // Close profile dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    if (isProfileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileOpen]);

  const handleLanguageChange = (lang: 'vi' | 'en') => {
    localStorage.setItem('armorify-lang', lang);
    void i18n.changeLanguage(lang);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    authToast.logoutSuccess();
    setIsProfileOpen(false);
  };

  return (
    <header className="w-full bg-white flex flex-col z-50 relative font-sans">
      {/* Top Utility Bar (FastKart style: light grey, thin) */}
      <div className="bg-[#f8f8f8] py-2 border-b border-gray-200 hidden md:block">
        <div className="container mx-auto px-4 max-w-7xl flex flex-wrap justify-between items-center text-[13px] text-gray-500 font-medium">
          <div className="flex gap-6">
            <span className="flex items-center gap-1.5"><MapPin size={14} className="text-primary"/> 123 Đường Báo Hộ, TP.HCM</span>
            <span className="flex items-center gap-1.5"><Mail size={14} className="text-primary"/> {t('topBar.email')}</span>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex gap-4 border-r border-gray-300 pr-6">
              <Link to="/about" className="hover:text-primary transition-colors">{t('topBar.about')}</Link>
              <Link to="/contact" className="hover:text-primary transition-colors">{t('topBar.contact')}</Link>
              <span className="text-gray-300">|</span>
              <button onClick={() => handleLanguageChange('vi')} className={`hover:text-primary transition-colors ${i18n.language === 'vi' ? 'text-primary font-bold' : ''}`}>VN</button>
              <button onClick={() => handleLanguageChange('en')} className={`hover:text-primary transition-colors ${i18n.language === 'en' ? 'text-primary font-bold' : ''}`}>EN</button>
            </div>
            <span className="flex items-center gap-1.5 font-semibold text-gray-700">Miễn phí giao hàng đơn từ 500k!</span>
          </div>
        </div>
      </div>

      {/* Main Bar (FastKart style: white bg, massive search bar) */}
      <div className="container mx-auto flex items-center justify-between gap-8 py-5">
        {/* Logo */}
        <Link to="/" className="flex-shrink-0 flex items-center gap-2">
          <div className="w-10 h-10 bg-primary text-white flex items-center justify-center rounded-xl font-black text-xl shadow-sm">
            <Zap size={22} className="fill-white" />
          </div>
          <span className="text-2xl font-black text-gray-900 tracking-tighter hidden sm:block">
            NBE Hoang Duy<span className="text-primary">.</span>
          </span>
        </Link>

        {/* Search Bar - FastKart Style */}
        <div className="flex-1 max-w-2xl hidden lg:flex items-center bg-[#f3f7f7] rounded-xl p-1 focus-within:bg-white focus-within:ring-2 focus-within:ring-primary/20 transition-all border border-transparent focus-within:border-primary/30">
          <div className="px-5 py-2.5 border-r border-gray-200 text-sm font-bold text-gray-700 whitespace-nowrap min-w-[150px] flex items-center justify-between cursor-pointer group hover:text-primary">
            {t('navigation.categories')} <Menu size={16} className="text-gray-400 group-hover:text-primary ml-2" />
          </div>
          <input 
            type="text" 
            placeholder="Tìm kiếm mũ, giày, găng tay bảo hộ..." 
            className="flex-1 px-5 py-2.5 bg-transparent border-none outline-none text-[15px] text-gray-800 placeholder-gray-400 font-medium"
          />
          <button className="w-12 h-12 bg-primary text-white rounded-lg flex items-center justify-center hover:bg-primary/90 transition-all shadow-md active:scale-95">
            <Search size={22} />
          </button>
        </div>

        {/* Actions - FastKart Style */}
        <div className="flex items-center gap-4 sm:gap-7">
          <div className="hidden xl:flex items-center gap-3 border-r border-gray-100 pr-7">
            <div className="w-11 h-11 rounded-full bg-primary/5 flex items-center justify-center text-primary group cursor-pointer hover:bg-primary transition-colors">
              <Phone size={20} className="group-hover:text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-tighter">Hỗ trợ 24/7</span>
              <span className="text-[15px] font-bold text-slate-700 leading-none">1900 1234</span>
            </div>
          </div>

          <Link to="/wishlist" className="hidden sm:flex flex-col items-center gap-1 text-gray-400 hover:text-primary transition-colors relative">
            <div className="relative">
              <Heart size={26} strokeWidth={1.8} />
              <span className="absolute -top-1.5 -right-2 bg-rose-500 text-white text-[10px] min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center font-bold shadow-sm border-2 border-white">0</span>
            </div>
          </Link>

          {user ? (
            <div className="relative" ref={profileRef}>
              <button 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2.5 text-gray-500 hover:text-primary transition-colors focus:outline-none"
              >
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                  <User size={22} strokeWidth={2} />
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-tighter">Tài khoản</span>
                  <span className="text-sm font-bold text-slate-700 leading-none">{user.firstname}</span>
                </div>
              </button>

              {/* Profile Submenu */}
              {isProfileOpen && (
                <div className="absolute right-0 top-full mt-4 w-60 bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-gray-100 py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-300 origin-top-right">
                    <div className="px-5 py-3.5 border-b border-gray-50 mb-2">
                      <p className="text-sm font-black text-gray-900 leading-tight">{user.firstname} {user.lastname}</p>
                      <p className="text-[11px] text-gray-400 font-bold truncate mt-0.5">{user.email || user.phone}</p>
                    </div>
                    
                    <Link to="/profile" className="flex items-center gap-3 px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-primary/5 hover:text-primary transition-colors" onClick={() => setIsProfileOpen(false)}>
                      <User size={18} /> {t('actions.profile')}
                    </Link>

                    {user.role === 'admin' && (
                      <Link to="/admin" className="flex items-center gap-3 px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-primary/5 hover:text-primary transition-colors" onClick={() => setIsProfileOpen(false)}>
                        <LayoutDashboard size={18} /> {t('actions.admin')}
                      </Link>
                    )}

                    <div className="border-t border-gray-50 mt-2 pt-2">
                      <button onClick={handleLogout} className="w-full flex items-center gap-3 px-5 py-3 text-sm font-bold text-rose-500 hover:bg-rose-50 transition-colors text-left">
                        <LogOut size={18} /> {t('actions.logout')}
                      </button>
                    </div>
                  </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="flex items-center gap-2.5 text-gray-500 hover:text-primary transition-colors">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                <User size={22} strokeWidth={2} />
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-tighter">Đăng nhập</span>
                <span className="text-sm font-black text-gray-900 leading-none">Tài khoản</span>
              </div>
            </Link>
          )}
          
          <Link to="/cart" className="flex items-center gap-4 group">
            <div className="relative">
              <div className="text-primary bg-[#0da487]/10 p-3 rounded-xl group-hover:bg-[#0da487] group-hover:text-white transition-all duration-300">
                <ShoppingCart size={24} strokeWidth={2.5}/>
              </div>
              <span className="absolute -top-2 -right-2 bg-[#ffa53b] text-white text-[11px] min-w-[20px] h-[20px] px-1.5 rounded-full flex items-center justify-center font-black shadow-[0_3px_10px_rgba(255,165,59,0.3)] border-2 border-white">
                0
              </span>
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-tighter">Giỏ hàng</span>
              <span className="text-[15px] font-black text-gray-900 leading-none group-hover:text-primary transition-colors">0đ</span>
            </div>
          </Link>

        </div>
      </div>


      {/* Bottom Navigation (FastKart style) */}
      <div className="bg-white border-b border-gray-100 hidden md:block">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center">
            {/* Categories Megamenu Trigger */}
            <div 
              className="relative w-fit flex-shrink-0"
              onMouseLeave={handleCategoryMenuClose}
            >
              <button 
                onMouseEnter={handleCategoryMenuOpen}
                onClick={() => setCategoryMenuOpen(!isCategoryMenuOpen)}
                className="flex items-center gap-3 bg-primary text-white cursor-pointer py-3.5 px-6 rounded-tr-3xl relative z-[60] transition-all hover:bg-primary/95 w-[280px] active:scale-95 flex-shrink-0"
              >
                <Menu size={20} strokeWidth={3} />
                <span className="font-black tracking-tight text-sm uppercase">All Categories</span>
              </button>
              
              {/* The Mega Menu */}
              <AnimatePresence>
                {isCategoryMenuOpen && (
                  <div className="absolute top-full left-0 z-50 pt-2 w-[950px]">
                    <MegaMenu isOpen={isCategoryMenuOpen} onClose={() => setCategoryMenuOpen(false)} />
                  </div>
                )}
              </AnimatePresence>
            </div>


            {/* Quick Links */}
            <nav className="flex items-center gap-10 ml-10">
              {[
                { to: '/', label: 'Home' },
                { to: '/categories', label: 'Shop' },
                { to: '/categories/giay-bao-ho', label: 'Giày Bảo Hộ' },
                { to: '/categories/quan-ao-bao-ho', label: 'Quần Áo' },
                { to: '/brand/3m', label: 'Thương Hiệu' },
                { to: '/blog', label: 'Tin Tức' },
              ].map((link) => (
                <Link 
                  key={link.to} 
                  to={link.to} 
                  className="text-[15px] font-black text-gray-700 hover:text-primary transition-colors py-5 relative group"
                >
                  {link.label}
                  <span className="absolute bottom-4 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
                </Link>
              ))}
            </nav>
          </div>
          
          <Link to="/flash-sale" className="flex items-center gap-2 text-primary font-black hover:opacity-80 transition-all text-sm tracking-tight">
            <Zap size={18} className="fill-primary" /> DEAL TODAY
          </Link>
        </div>
      </div>


    </header>
  );
};
