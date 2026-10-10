import React, { useState, useRef, useEffect } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
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
  X,
  Tag,
  ImagePlus,
  FileSignature,
  Star
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
  { id: 'flash-sale', labelKey: 'admin.menu.flash_sale', icon: Zap, path: '/admin/manage/flash-sale' },
  { id: 'catalog', labelKey: 'admin.menu.catalog', icon: Grid, path: '/admin/manage/catalog' },
  { id: 'brand', labelKey: 'admin.menu.brand', icon: Tag, path: '/admin/manage/brand' },
  { id: 'user', labelKey: 'admin.menu.user', icon: Users, path: '/admin/manage/user' },
  { id: 'blog', labelKey: 'admin.menu.blog', icon: FileText, path: '/admin/manage/blog' },
  { id: 'banner', labelKey: 'admin.menu.banner', icon: ImagePlus, path: '/admin/manage/banner' },
  { id: 'quote', labelKey: 'admin.menu.quote', icon: FileSignature, path: '/admin/manage/quote' },
  { id: 'review', labelKey: 'admin.menu.review', icon: Star, path: '/admin/manage/review' },
];

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children, title, subtitle }) => {
  const { t } = useTranslation();
  const location = useLocation();
  const { entityId } = useParams<{ entityId: string }>();
  const { user } = useAuthStore();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerRef = useRef<HTMLDialogElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const dialog = drawerRef.current;
    if (!dialog) return;
    if (drawerOpen && !dialog.open) dialog.showModal();
    if (!drawerOpen && dialog.open) dialog.close();

    if (drawerOpen) {
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = previousOverflow; };
    }
  }, [drawerOpen]);

  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 1024px)');
    const closeOnDesktop = () => {
      if (desktop.matches) setDrawerOpen(false);
    };
    desktop.addEventListener('change', closeOnDesktop);
    return () => desktop.removeEventListener('change', closeOnDesktop);
  }, []);

  const activeId = entityId || (location.pathname === '/admin' ? 'dashboard' : '');
  const brand = (
    <Link to="/" className="flex min-h-11 min-w-0 items-center gap-3 rounded-md" onClick={() => setDrawerOpen(false)}>
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-primary text-white">
        <Zap size={22} aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="block text-xl font-bold text-foreground">Armorify<span className="text-primary">.</span></span>
        <span className="text-caption text-muted-foreground">Admin Center</span>
      </span>
    </Link>
  );
  const navigation = (
    <nav aria-label="Admin navigation" className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
      <p className="mb-3 px-3 text-sm font-medium text-muted-foreground">Management</p>
      <ul className="space-y-1">
        {ADMIN_MENU.map((item) => {
          const Icon = item.icon;
          const isActive = activeId === item.id || location.pathname === item.path ||
            (item.path !== '/admin' && location.pathname.startsWith(`${item.path}/`));
          return (
            <li key={item.id}>
              <Link
                to={item.path}
                onClick={() => setDrawerOpen(false)}
                aria-current={isActive ? 'page' : undefined}
                className={`flex min-h-11 items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium ${isActive
                  ? 'bg-primary-soft text-primary'
                  : 'text-muted-foreground hover:bg-background hover:text-foreground'}`}
              >
                <Icon size={20} className="shrink-0" aria-hidden="true" />
                <span className="min-w-0 flex-1 break-words">{t(item.labelKey)}</span>
                {isActive && <ChevronRight size={16} className="shrink-0" aria-hidden="true" />}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
  const account = (
    <div className="shrink-0 border-t border-border p-4">
      <div className="mb-3 flex items-center gap-3 rounded-md bg-background p-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-border bg-surface font-semibold text-primary" aria-hidden="true">
          {user?.firstname?.[0] || 'A'}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{user?.firstname}</p>
          <p className="text-caption text-muted-foreground">Super Admin</p>
        </div>
      </div>
      <Link to="/" onClick={() => setDrawerOpen(false)} className="btn btn-ghost w-full justify-start gap-2">
        <LogOut size={18} aria-hidden="true" />
        Storefront
      </Link>
    </div>
  );

  return (
    <div className="flex min-h-screen w-full min-w-0 bg-background font-sans text-foreground">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-surface lg:flex">
        <div className="shrink-0 p-4">{brand}</div>
        {navigation}
        {account}
      </aside>

      <dialog
        ref={drawerRef}
        id="admin-navigation-drawer"
        aria-labelledby="admin-navigation-title"
        onCancel={() => setDrawerOpen(false)}
        onKeyDown={(event) => {
          if (event.key !== 'Tab') return;
          const controls = event.currentTarget.querySelectorAll<HTMLElement>('a[href], button:not(:disabled)');
          const first = controls[0];
          const last = controls[controls.length - 1];
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last?.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first?.focus();
          }
        }}
        onClose={() => {
          setDrawerOpen(false);
          if (!window.matchMedia('(min-width: 1024px)').matches) menuButtonRef.current?.focus();
        }}
        className="fixed inset-y-0 left-0 m-0 h-[100dvh] max-h-none w-80 max-w-[calc(100%-2rem)] border-0 border-r border-border bg-surface p-0 text-foreground backdrop:bg-foreground/40"
      >
        <div className="flex h-full min-h-0 flex-col">
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border p-4">
            <h2 id="admin-navigation-title" className="section-heading">Admin navigation</h2>
            <button type="button" autoFocus onClick={() => setDrawerOpen(false)} className="btn btn-ghost btn-icon shrink-0" aria-label="Close admin navigation">
              <X size={20} aria-hidden="true" />
            </button>
          </div>
          {navigation}
          {account}
        </div>
      </dialog>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-border bg-surface">
          <div className="mx-auto flex min-h-20 max-w-[1280px] items-center gap-3 px-4 py-4 sm:px-6 lg:px-8">
            <button
              ref={menuButtonRef}
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="btn btn-ghost btn-icon shrink-0 lg:hidden"
              aria-label="Open admin navigation"
              aria-controls="admin-navigation-drawer"
              aria-expanded={drawerOpen}
              aria-haspopup="dialog"
            >
              <MenuIcon size={22} aria-hidden="true" />
            </button>
            <div className="min-w-0">
              <p className="text-caption text-muted-foreground">Admin Center</p>
              <h1 className="page-heading break-words">{title || 'Administration'}</h1>
              {subtitle && <p className="text-body mt-1 break-words text-muted-foreground">{subtitle}</p>}
            </div>
          </div>
        </header>
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full min-w-0 max-w-[1280px]">{children}</div>
        </main>
      </div>
    </div>
  );
};
