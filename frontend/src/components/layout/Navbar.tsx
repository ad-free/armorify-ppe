// src/components/layout/Navbar.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ShoppingCart, User, Menu, Phone, Mail, LogOut, LayoutDashboard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MegaMenu } from './MegaMenu';
import { useAuthStore } from '@/store/authStore';
import { authToast } from '@/lib/toast';

export const Navbar: React.FC = () => {
  const [isCategoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

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
    <header className="w-full bg-white shadow-sm flex flex-col z-50 relative">
      {/* Top Utility Bar */}
      <div className="bg-gray-100 py-1">
        <div className="container mx-auto px-4 max-w-7xl flex flex-wrap justify-between items-center text-xs text-gray-600 font-medium">
          <div className="flex gap-4">
            <span className="flex items-center gap-1"><Phone size={12}/> {t('topBar.hotline')}</span>
            <span className="flex items-center gap-1"><Mail size={12}/> {t('topBar.email')}</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex gap-4">
              <Link to="/about" className="hover:text-primary">{t('topBar.about')}</Link>
              <Link to="/contact" className="hover:text-primary">{t('topBar.contact')}</Link>
              <Link to="/dealer" className="hover:text-primary">{t('topBar.dealer')}</Link>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleLanguageChange('vi')}
                className={`text-xs font-semibold px-2 py-1 rounded ${i18n.language === 'vi' ? 'bg-primary text-white' : 'text-gray-600 hover:text-primary'}`}
              >
                {t('language.vi')}
              </button>
              <button
                type="button"
                onClick={() => handleLanguageChange('en')}
                className={`text-xs font-semibold px-2 py-1 rounded ${i18n.language === 'en' ? 'bg-primary text-white' : 'text-gray-600 hover:text-primary'}`}
              >
                {t('language.en')}
              </button>
            </div>
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
              placeholder={t('search.placeholder')}
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
                      <span>{t('actions.profile')}</span>
                    </Link>

                    {user.role === 'admin' && (
                      <Link 
                        to="/admin" 
                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <LayoutDashboard size={16} />
                        <span>{t('actions.admin')}</span>
                      </Link>
                    )}

                    <div className="border-t border-gray-100 mt-1 pt-1">
                      <button 
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
                      >
                        <LogOut size={16} />
                        <span>{t('actions.logout')}</span>
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
                {t('actions.login')}
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
            <span className="text-xs font-semibold hidden lg:block">{t('actions.cart')}</span>
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
            <span className="font-bold tracking-wide text-sm uppercase">{t('navigation.categories')}</span>
            
            {/* The actual Mega Menu */}
            <div className="absolute top-full left-0 w-full lg:w-[800px] z-50">
              <MegaMenu isOpen={isCategoryMenuOpen} onClose={() => setCategoryMenuOpen(false)} />
            </div>
          </div>

          {/* Quick Links */}
          <div className="flex items-center gap-8 ml-8 text-sm font-bold uppercase tracking-wide">
            <Link to="/sale" className="hover:text-yellow-300 transition-colors">{t('navigation.sale')}</Link>
            <Link to="/brand/3m" className="hover:text-white/80 transition-colors">{t('navigation.brand')}</Link>
            <Link to="/video" className="hover:text-white/80 transition-colors">{t('navigation.video')}</Link>
            <Link to="/blog" className="hover:text-white/80 transition-colors">{t('navigation.blog')}</Link>
          </div>
        </div>
      </div>
    </header>
  );
};
