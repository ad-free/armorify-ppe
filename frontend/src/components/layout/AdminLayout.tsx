import React from 'react';
import { useNavigate, useParams, useLocation, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  BarChart3,
  Package,
  Users,
  ShoppingBag,
  FileText,
  Grid,
  LogOut,
  Menu as MenuIcon,
  Zap,
  ChevronRight,
  Bell,
  Search,
  Tag,
  ImagePlus,
  FileSignature
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

const ADMIN_MENU = [
  { id: 'dashboard', labelKey: 'admin.menu.dashboard', icon: BarChart3, path: '/admin' },
  { id: 'order', labelKey: 'admin.menu.order', icon: ShoppingBag, path: '/admin/manage/order' },
  { id: 'product', labelKey: 'admin.menu.product', icon: Package, path: '/admin/manage/product' },
  { id: 'catalog', labelKey: 'admin.menu.catalog', icon: Grid, path: '/admin/manage/catalog' },
  { id: 'brand', labelKey: 'admin.menu.brand', icon: Tag, path: '/admin/manage/brand' },
  { id: 'user', labelKey: 'admin.menu.user', icon: Users, path: '/admin/manage/user' },
  { id: 'blog', labelKey: 'admin.menu.blog', icon: FileText, path: '/admin/manage/blog' },
  { id: 'banner', labelKey: 'admin.menu.banner', icon: ImagePlus, path: '/admin/manage/banner' },
  { id: 'quote', labelKey: 'admin.menu.quote', icon: FileSignature, path: '/admin/manage/quote' },
];

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children, title, subtitle: _subtitle }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { entityId } = useParams<{ entityId: string }>();
  const { user } = useAuthStore();

  const activeId = entityId || (location.pathname === '/admin' ? 'dashboard' : '');

  return (
    <div className="flex min-h-screen w-full bg-[#f4f7f6] font-sans selection:bg-primary/20">
      {/* Sidebar - Premium Dark/Green Style */}
      <div className="hidden lg:flex flex-col w-[280px] bg-white border-r border-gray-100 shadow-[20px_0_40px_rgba(0,0,0,0.02)] z-30 sticky top-0 h-screen">
        <div className="h-24 flex items-center px-8">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 bg-primary text-white flex items-center justify-center rounded-xl font-black text-xl shadow-[0_8px_20px_rgba(13,164,135,0.3)] group-hover:scale-105 transition-all">
              <Zap size={22} className="fill-white" />
            </div>
            <div>
              <h1 className="font-black text-xl text-gray-900 tracking-tighter leading-none">Armorify<span className="text-primary">.</span></h1>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1">Admin Center</p>
            </div>
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4 custom-scrollbar">
          <nav className="space-y-1.5">
            <p className="px-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] mb-6 block">Management</p>
            {ADMIN_MENU.map((item) => {
              const Icon = item.icon;
              const isActive = activeId === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl transition-all duration-300 group ${isActive
                    ? 'bg-primary text-white shadow-[0_10px_25px_rgba(13,164,135,0.25)]'
                    : 'text-gray-500 hover:bg-gray-50/80 hover:text-primary font-bold text-sm'
                    }`}
                >
                  <div className="flex items-center gap-4">
                    <Icon size={20} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'text-white' : 'text-gray-400 group-hover:text-primary transition-colors'} />
                    <span className={`tracking-tight ${isActive ? 'font-black' : 'font-bold'}`}>{t(item.labelKey)}</span>
                  </div>
                  {isActive && <ChevronRight size={16} strokeWidth={3} className="opacity-50" />}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6 border-t border-gray-50">
          <div className="bg-gray-50 rounded-3xl p-4 mb-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-primary font-black shadow-sm border border-gray-100">
              {user?.firstname?.[0] || 'A'}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-black text-gray-900 truncate">{user?.firstname}</span>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Super Admin</span>
            </div>
          </div>
          <button
            onClick={() => navigate('/')}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-2xl text-gray-400 hover:text-rose-500 hover:bg-rose-50 transition-all font-black text-xs uppercase tracking-widest"
          >
            <LogOut size={16} strokeWidth={3} />
            <span>Storefront</span>
          </button>
        </div>
      </div>

      {/* Right Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header - Fixed Top */}
        <header className="h-24 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-8 lg:px-12 z-20 sticky top-0">
          <div className="flex items-center gap-8 flex-1">
            <button className="lg:hidden p-3 rounded-xl bg-gray-100 text-gray-600">
              <MenuIcon size={22} />
            </button>

            {title && (
              <div className="hidden md:block">
                <div className="flex items-center gap-2 text-gray-400 text-[11px] font-black uppercase tracking-widest">
                  <span>Admin</span> <ChevronRight size={10} strokeWidth={3} /> <span className="text-gray-900">{title}</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            <button className="w-11 h-11 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-primary/10 hover:text-primary transition-all">
              <Search size={20} />
            </button>
            <button className="w-11 h-11 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-primary/10 hover:text-primary transition-all relative">
              <Bell size={20} />
              <span className="absolute top-0 right-0 w-3 h-3 bg-rose-500 border-2 border-white rounded-full"></span>
            </button>
          </div>

        </header>

        {/* Main Scrolling Area */}
        <main className="flex-1 p-8 lg:p-12">
          <div className="mx-auto max-w-[1600px] animate-in fade-in slide-in-from-bottom-4 duration-700">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

