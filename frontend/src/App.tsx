import React, { Suspense, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Toaster } from 'react-hot-toast';
import { FloatingContact } from './components/common/FloatingContact';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { useAuthStore } from './store/authStore';
import { GET } from './lib/api';
import type { UserRead } from './types/api';

// Lazy load the pages we built
const HomePage = React.lazy(() => import('./pages/public/HomePage'));
const BlogList = React.lazy(() => import('./pages/public/BlogList'));
const BlogDetail = React.lazy(() => import('./pages/public/BlogDetail'));
const BrandPage = React.lazy(() => import('./pages/public/BrandPage'));
const DealerPage = React.lazy(() => import('./pages/public/DealerPage'));
const VideoPage = React.lazy(() => import('./pages/public/VideoPage'));
const AboutPage = React.lazy(() => import('./pages/public/AboutPage'));
const ContactPage = React.lazy(() => import('./pages/public/ContactPage'));
const NotFoundPage = React.lazy(() => import('./pages/public/NotFoundPage'));
const OrderSuccessPage = React.lazy(() => import('./pages/public/OrderSuccessPage'));

const CategoryPage = React.lazy(() => import('./pages/public/CategoryPage'));
const ProductDetail = React.lazy(() => import('./pages/public/ProductDetail'));
const CartPage = React.lazy(() => import('./pages/public/CartPage'));
const CheckoutPage = React.lazy(() => import('./pages/public/CheckoutPage'));
const WishlistPage = React.lazy(() => import('./pages/public/WishlistPage'));

const LoginPage = React.lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = React.lazy(() => import('./pages/auth/RegisterPage'));
const ProfilePage = React.lazy(() => import('./pages/user/ProfilePage'));
const AdminDashboard = React.lazy(() => import('./pages/admin/Dashboard'));
const ResourceManagerPage = React.lazy(() => import('./pages/admin/ResourceManager'));

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-xl max-w-2xl w-full">
            <h2 className="text-2xl font-black text-rose-500 mb-4 uppercase tracking-tight">Hệ thống gặp lỗi hiển thị</h2>
            <div className="bg-rose-50 p-4 rounded-xl border border-rose-100 mb-6 overflow-auto max-h-[300px]">
              <p className="text-rose-700 font-mono text-sm whitespace-pre-wrap">{this.state.error?.toString()}</p>
              <p className="text-rose-500 text-xs mt-2 font-mono">{this.state.error?.stack}</p>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-4 bg-primary text-white font-black rounded-xl uppercase tracking-widest hover:bg-primary/90 transition-all"
            >
              Tải lại trang
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const AppLayout = ({ children, t }: { children: React.ReactNode; t: (key: string) => string }) => {
  const { pathname } = useLocation();
  const isAdmin = pathname.startsWith('/admin');

  if (isAdmin) {
    return (
      <main className="min-h-screen bg-[#f4f7f6]">
        <Suspense fallback={<div className="flex h-screen items-center justify-center bg-[#f4f7f6] uppercase font-black text-xs tracking-widest text-gray-400">{t('status.loading')}...</div>}>
          {children}
        </Suspense>
      </main>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-[80vh] bg-gray-50">
        <Suspense fallback={<div className="flex p-20 justify-center">{t('status.loading')}</div>}>
          {children}
        </Suspense>
      </main>
      <Footer />
      <FloatingContact />
    </>
  );
};


const GlobalToaster = () => {
  return (
    <Toaster
      position="top-right"
      gutter={12}
      containerStyle={{ top: 40, right: 40 }}
      toastOptions={{
        duration: 4000,
        className: 'premium-toast',
        style: {
          background: '#ffffff',
          color: '#1a202c',
          padding: '16px 24px',
          borderRadius: '16px',
          fontSize: '14px',
          fontWeight: '600',
          boxShadow: '0 20px 40px rgba(0,0,0,0.12)',
          border: '1px solid #f3f4f6',
        },
        success: {
          iconTheme: {
            primary: '#0da487',
            secondary: '#fff',
          },
        },
        error: {
          iconTheme: {
            primary: '#ef4444',
            secondary: '#fff',
          },
        },
      }}
    />
  );
};

function App() {
  const { t } = useTranslation();
  const hasHydrated = useAuthStore(state => state._hasHydrated);
  const user = useAuthStore(state => state.user);
  const accessToken = useAuthStore(state => state.accessToken);
  const refreshToken = useAuthStore(state => state.refreshToken);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  useEffect(() => {
    if (!hasHydrated) return;

    const validateTokens = async () => {
      if (!accessToken || !refreshToken) {
        setIsAuthChecking(false);
        return;
      }

      try {
        await GET<UserRead>('/auth/me');
      } catch {
        // The API layer will already logout on failed refresh attempts.
      } finally {
        setIsAuthChecking(false);
      }
    };

    validateTokens();
  }, [hasHydrated, accessToken, refreshToken]);

  if (!hasHydrated || isAuthChecking) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium animate-pulse">{t('status.initializing')}</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <GlobalToaster />
      <BrowserRouter>
        <AppLayout t={t}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/blog" element={<BlogList />} />
            <Route path="/blog/:slug" element={<BlogDetail />} />
            <Route path="/brand/:slug" element={<BrandPage />} />
            <Route path="/dealer" element={<DealerPage />} />
            <Route path="/video" element={<VideoPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/order-success" element={<OrderSuccessPage />} />
            <Route path="/categories/:slug" element={<CategoryPage />} />
            <Route path="/categories" element={<CategoryPage />} />
            <Route path="/products/:slug" element={<ProductDetail />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/wishlist" element={<WishlistPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route
              path="/admin"
              element={user?.role === 'admin' ? <AdminDashboard /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/admin/manage/:entityId"
              element={user?.role === 'admin' ? <ResourceManagerPage /> : <Navigate to="/login" replace />}
            />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
