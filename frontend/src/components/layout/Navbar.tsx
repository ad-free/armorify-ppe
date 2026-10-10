import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, User, Menu, Phone, Mail, LogOut, LayoutDashboard, MapPin, Zap, Heart, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { MegaMenu } from './MegaMenu';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { authToast } from '@/lib/toast';

export const Navbar: React.FC = () => {
  const [isCategoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileNavOpen, setMobileNavOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const categoryRef = useRef<HTMLDivElement>(null);
  const categoryTriggerRef = useRef<HTMLButtonElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const profileTriggerRef = useRef<HTMLButtonElement>(null);
  const mobileNavRef = useRef<HTMLDivElement>(null);
  const mobileNavTriggerRef = useRef<HTMLButtonElement>(null);
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const items = useCartStore((state) => state.items);
  const wishlistCount = useWishlistStore((state) => state.items.length);
  const isVietnamese = i18n.language.startsWith('vi');
  const label = (key: string) => {
    const text = t(key);
    return text.charAt(0).toLocaleUpperCase(i18n.language) + text.slice(1).toLocaleLowerCase(i18n.language);
  };
  const totalItems = items.reduce((total, item) => total + item.quantity, 0);
  const totalPrice = items.reduce((total, item) => {
    const unit = item.unit_price ?? item.product.price;
    return total + unit * item.quantity;
  }, 0);
  const formatMoney = (value: number) =>
    new Intl.NumberFormat(i18n.language === 'vi' ? 'vi-VN' : 'en-US', {
      style: 'currency', currency: 'VND', maximumFractionDigits: 0,
    }).format(value);
  const closeCategories = () => {
    setCategoryMenuOpen(false);
    categoryTriggerRef.current?.focus();
  };
  const closeProfile = () => {
    setIsProfileOpen(false);
    profileTriggerRef.current?.focus();
  };
  const closeMobileNav = () => {
    setMobileNavOpen(false);
    mobileNavTriggerRef.current?.focus();
  };

  useEffect(() => {
    const dismissOutside = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!categoryRef.current?.contains(target)) setCategoryMenuOpen(false);
      if (!profileRef.current?.contains(target)) setIsProfileOpen(false);
      if (!mobileNavRef.current?.contains(target)) setMobileNavOpen(false);
    };
    document.addEventListener('pointerdown', dismissOutside);
    return () => document.removeEventListener('pointerdown', dismissOutside);
  }, []);

  const handleLanguageChange = (lang: 'vi' | 'en') => {
    localStorage.setItem('armorify-lang', lang);
    void i18n.changeLanguage(lang);
  };
  const handleLogout = () => {
    closeProfile();
    logout();
    navigate('/');
    authToast.logoutSuccess();
    setIsProfileOpen(false);
  };
  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    if (searchQuery.trim()) navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
  };
  const links = [
    { to: '/', label: label('navbar.navHome'), end: true },
    { to: '/categories', label: label('navbar.navCategories'), end: false },
    { to: '/brand', label: label('navbar.navBrands'), end: false },
    { to: '/dealer', label: label('navbar.navDealer'), end: false },
    { to: '/blog', label: label('navbar.navBlog'), end: false },
    { to: '/contact', label: label('navbar.navContact'), end: false },
  ];
  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `inline-flex min-h-11 items-center rounded-md px-3 text-sm font-semibold ${isActive ? 'bg-primary-soft text-primary' : 'text-foreground hover:bg-background hover:text-primary'}`;

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface font-sans text-foreground">
      <div className="hidden border-b border-border bg-background xl:block">
        <div className="container flex min-h-11 flex-wrap items-center justify-between gap-x-6 text-caption text-muted-foreground">
          <div className="flex flex-wrap gap-6">
            <span className="flex items-center gap-2"><MapPin size={16} aria-hidden="true" />{t('navbar.address')}</span>
            <span className="flex items-center gap-2"><Mail size={16} aria-hidden="true" />{t('navbar.email')}</span>
          </div>
          <span>{t('navbar.freeShipping')}</span>
        </div>
      </div>

      <div className="container grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-3 py-3 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:gap-x-6 lg:py-4">
        <Link to="/" aria-label="NBE Hoang Duy — Home" className="inline-flex min-h-11 min-w-11 items-center gap-2 justify-self-start rounded-md">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-primary text-white"><Zap size={24} aria-hidden="true" /></span>
          <span className="hidden text-xl font-bold tracking-tight sm:block">NBE Hoang Duy<span className="text-primary">.</span></span>
          <span className="text-lg font-bold sm:hidden">NBE</span>
        </Link>

        <form onSubmit={handleSearch} role="search" className="col-span-2 row-start-2 flex min-w-0 items-center gap-2 lg:col-span-1 lg:col-start-2 lg:row-start-1">
          <label htmlFor="header-product-search" className="sr-only">{t('navbar.searchPlaceholder')}</label>
          <input id="header-product-search" type="search" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder={t('navbar.searchPlaceholder')} className="field min-w-0 flex-1" />
          <button type="submit" className="btn btn-primary shrink-0" aria-label={t('navbar.searchButton')}>
            <Search size={20} aria-hidden="true" /><span className="hidden sm:inline">{label('navbar.searchButton')}</span>
          </button>
        </form>

        <div className="flex items-center justify-end gap-1 sm:gap-3 lg:col-start-3">
          <a href="tel:19001234" className="hidden min-h-11 items-center gap-2 rounded-md text-primary xl:flex" aria-label={`${t('navbar.support')}: 1900 1234`}>
            <Phone size={20} aria-hidden="true" /><span className="text-sm font-semibold">1900 1234</span>
          </a>
          {user && (
            <Link to="/wishlist" className="btn btn-ghost btn-icon relative" aria-label={`${isVietnamese ? 'Yêu thích' : 'Wishlist'}: ${wishlistCount}`}>
              <Heart size={22} aria-hidden="true" />
              {wishlistCount > 0 && <span className="badge badge-neutral absolute -right-1 -top-1 px-1.5" aria-hidden="true">{wishlistCount}</span>}
            </Link>
          )}
          {user ? (
            <div ref={profileRef} className="relative" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setIsProfileOpen(false); }} onKeyDown={(event) => { if (event.key === 'Escape' && isProfileOpen) { event.stopPropagation(); closeProfile(); } }}>
              <button ref={profileTriggerRef} type="button" className="btn btn-ghost px-2" aria-label={`${label('navbar.account')}: ${user.firstname}`} aria-expanded={isProfileOpen} aria-controls="header-profile-panel" onClick={() => { setIsProfileOpen(!isProfileOpen); setCategoryMenuOpen(false); setMobileNavOpen(false); }}>
                <User size={22} aria-hidden="true" /><span className="hidden text-sm sm:inline">{user.firstname}</span>
              </button>
              {isProfileOpen && (
                <div id="header-profile-panel" className="absolute right-0 top-full z-50 mt-2 w-64 max-w-[calc(100vw-2rem)] rounded-lg border border-border bg-surface p-2 shadow-md">
                  <div className="mb-2 border-b border-border px-3 py-3">
                    <p className="text-sm font-semibold">{user.firstname} {user.lastname}</p>
                    <p className="text-caption break-words text-muted-foreground">{user.email || user.phone}</p>
                  </div>
                  <Link to="/profile" className="btn btn-ghost w-full justify-start" onClick={closeProfile}><User size={18} aria-hidden="true" />{label('actions.profile')}</Link>
                  {user.role === 'admin' && <Link to="/admin" className="btn btn-ghost w-full justify-start" onClick={closeProfile}><LayoutDashboard size={18} aria-hidden="true" />{label('actions.admin')}</Link>}
                  <button type="button" onClick={handleLogout} className="btn btn-ghost w-full justify-start text-destructive hover:bg-destructive-soft"><LogOut size={18} aria-hidden="true" />{label('actions.logout')}</button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="btn btn-ghost px-2" aria-label={t('navbar.login')}><User size={22} aria-hidden="true" /><span className="hidden text-sm sm:inline">{label('navbar.login')}</span></Link>
          )}
          <Link to="/cart" className="btn btn-ghost gap-2 px-2" aria-label={`${t('navbar.cart')}: ${totalItems}, ${formatMoney(totalPrice)}`}>
            <span className="relative"><ShoppingCart size={22} aria-hidden="true" /><span className="badge badge-neutral absolute -right-3 -top-3 px-1.5" aria-hidden="true">{totalItems}</span></span>
            <span className="hidden text-sm lg:inline">{formatMoney(totalPrice)}</span>
          </Link>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="container relative flex flex-wrap items-center gap-2 py-2">
          <div ref={categoryRef} className="static shrink-0" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setCategoryMenuOpen(false); }} onKeyDown={(event) => { if (event.key === 'Escape' && isCategoryMenuOpen) { event.stopPropagation(); closeCategories(); } }}>
            <button ref={categoryTriggerRef} type="button" className="btn btn-primary px-3" aria-expanded={isCategoryMenuOpen} aria-controls="header-category-panel" onClick={() => { setCategoryMenuOpen(!isCategoryMenuOpen); setIsProfileOpen(false); setMobileNavOpen(false); }}>
              <Menu size={20} aria-hidden="true" /><span>{label('navbar.allCategories')}</span>
            </button>
            {isCategoryMenuOpen && <div id="header-category-panel" className="absolute inset-x-4 top-full z-50 pt-2 sm:inset-x-6 lg:inset-x-8"><MegaMenu isOpen={isCategoryMenuOpen} onClose={closeCategories} /></div>}
          </div>
          <nav aria-label={isVietnamese ? 'Điều hướng chính' : 'Main navigation'} className="hidden flex-wrap items-center lg:flex">
            {links.map((link) => <NavLink key={link.to} to={link.to} end={link.end} className={navLinkClass}>{link.label}</NavLink>)}
          </nav>
          <div ref={mobileNavRef} className="lg:hidden" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setMobileNavOpen(false); }} onKeyDown={(event) => { if (event.key === 'Escape' && isMobileNavOpen) { event.stopPropagation(); closeMobileNav(); } }}>
            <button ref={mobileNavTriggerRef} type="button" className="btn btn-ghost btn-icon" aria-label={isVietnamese ? 'Điều hướng chính' : 'Main navigation'} aria-expanded={isMobileNavOpen} aria-controls="header-mobile-navigation" onClick={() => { setMobileNavOpen(!isMobileNavOpen); setCategoryMenuOpen(false); setIsProfileOpen(false); }}>{isMobileNavOpen ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}</button>
            {isMobileNavOpen && <nav id="header-mobile-navigation" aria-label={isVietnamese ? 'Điều hướng chính' : 'Main navigation'} className="absolute inset-x-4 top-full z-50 grid max-h-[60vh] overflow-y-auto rounded-lg border border-border bg-surface p-2 shadow-md sm:inset-x-6">
              {links.map((link) => <NavLink key={link.to} to={link.to} end={link.end} className={navLinkClass} onClick={closeMobileNav}>{link.label}</NavLink>)}
              <Link to="/about" className="btn btn-ghost justify-start" onClick={closeMobileNav}>{label('navbar.about')}</Link>
            </nav>}
          </div>
          <div className="ml-auto flex items-center">
            <Link to="/about" className="btn btn-ghost hidden lg:inline-flex">{label('navbar.about')}</Link>
            <button type="button" onClick={() => handleLanguageChange('vi')} className={`btn btn-ghost btn-icon ${isVietnamese ? 'bg-primary-soft text-primary' : ''}`} aria-label="Tiếng Việt" aria-pressed={isVietnamese}>VN</button>
            <button type="button" onClick={() => handleLanguageChange('en')} className={`btn btn-ghost btn-icon ${!isVietnamese ? 'bg-primary-soft text-primary' : ''}`} aria-label="English" aria-pressed={!isVietnamese}>EN</button>
          </div>
        </div>
      </div>
    </header>
  );
};
