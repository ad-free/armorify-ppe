import React, { Suspense, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Toaster } from 'react-hot-toast';
import { FloatingContact } from './components/common/FloatingContact';
import ScrollToTop from './components/common/ScrollToTop';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { useAuthStore } from './store/authStore';
import { GET } from './lib/api';
import type { UserRead } from './types/api';
import { Button, FeedbackState, Skeleton } from './components/ui/Primitives';
const AdminOrders = React.lazy(() => import('./pages/admin/Orders'));
const AdminOrderDetail = React.lazy(() => import('./pages/admin/OrderDetail'));

const LegacyOrdersRedirect = () => {
  const { search } = useLocation();
  return <Navigate to={`/admin/orders${search}`} replace />;
};

// Lazy load the pages we built
const HomePage = React.lazy(() => import('./pages/public/HomePage'));
const BlogList = React.lazy(() => import('./pages/public/BlogList'));
const BlogDetail = React.lazy(() => import('./pages/public/BlogDetail'));
const BrandPage = React.lazy(() => import('./pages/public/BrandPage'));
const BrandsPage = React.lazy(() => import('./pages/public/BrandsPage'));
const DealerPage = React.lazy(() => import('./pages/public/DealerPage'));
const VideoPage = React.lazy(() => import('./pages/public/VideoPage'));
const AboutPage = React.lazy(() => import('./pages/public/AboutPage'));
const ContactPage = React.lazy(() => import('./pages/public/ContactPage'));
const NotFoundPage = React.lazy(() => import('./pages/public/NotFoundPage'));
const OrderSuccessPage = React.lazy(() => import('./pages/public/OrderSuccessPage'));
const ShippingPolicyPage = React.lazy(() => import('./pages/public/ShippingPolicyPage'));
const ReturnsPolicyPage = React.lazy(() => import('./pages/public/ReturnsPolicyPage'));

const CategoryPage = React.lazy(() => import('./pages/public/CategoryPage'));
const SearchPage = React.lazy(() => import('./pages/public/SearchPage'));
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
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <FeedbackState variant="error" title="Hệ thống gặp lỗi hiển thị" description="Vui lòng tải lại trang để thử lại." className="max-w-lg w-full">
            <Button onClick={() => window.location.reload()}>Tải lại trang</Button>
          </FeedbackState>
        </div>
      );
    }
    return this.props.children;
  }
}

const AppLayout = ({ children, t }: { children: React.ReactNode; t: (key: string) => string }) => {
  const { pathname } = useLocation();
  const isAdmin = pathname.startsWith('/admin');

  if (isAdmin || pathname === '/checkout' || pathname === '/order-success') {
    return (
      <div className="min-h-screen bg-background">
        <Suspense fallback={<div role="status" className="container py-12"><p className="text-body mb-4">{t('status.loading')}</p><Skeleton className="h-64" /></div>}>
          {children}
        </Suspense>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-[80vh] bg-background">
        <Suspense fallback={<div role="status" className="container py-12"><p className="text-body mb-4">{t('status.loading')}</p><Skeleton className="h-64" /></div>}>
          {children}
        </Suspense>
      </main>
      <Footer />
      {pathname !== '/cart' && <FloatingContact />}
    </>
  );
};


const GlobalToaster = () => {
  return (
    <Toaster
      position="top-right"
      gutter={12}
      containerStyle={{ top: 16, right: 16, left: 16 }}
      toastOptions={{
        duration: 4000,
        className: 'premium-toast',
        style: {
          background: 'hsl(var(--surface))',
          color: 'hsl(var(--foreground))',
          padding: '16px',
          borderRadius: 'var(--radius-md)',
          fontSize: '14px',
          fontWeight: '600',
          boxShadow: 'var(--shadow-md)',
          border: '1px solid hsl(var(--border))',
        },
        success: {
          iconTheme: {
            primary: 'hsl(var(--success))',
            secondary: 'hsl(var(--surface))',
          },
        },
        error: {
          iconTheme: {
            primary: 'hsl(var(--destructive))',
            secondary: 'hsl(var(--surface))',
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
      <div role="status" className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="h-12 w-12" />
          <p className="text-body">{t('status.initializing')}</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <GlobalToaster />
      <BrowserRouter>
        <ScrollToTop />
        <AppLayout t={t}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/blog" element={<BlogList />} />
            <Route path="/blog/:slug" element={<BlogDetail />} />
            <Route path="/brand" element={<BrandsPage />} />
            <Route path="/brands" element={<Navigate to="/brand" replace />} />
            <Route path="/brand/:slug" element={<BrandPage />} />
            <Route path="/dealer" element={<DealerPage />} />
            <Route path="/video" element={<VideoPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/order-success" element={<OrderSuccessPage />} />
            <Route path="/policy/shipping" element={<ShippingPolicyPage />} />
            <Route path="/policy/returns" element={<ReturnsPolicyPage />} />
            <Route path="/categories/:slug" element={<CategoryPage />} />
            <Route path="/categories" element={<CategoryPage />} />
            <Route path="/search" element={<SearchPage />} />
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
            <Route path="/admin/orders" element={user?.role === 'admin' ? <AdminOrders /> : <Navigate to="/login" replace />} />
            <Route path="/admin/orders/:orderId" element={user?.role === 'admin' ? <AdminOrderDetail /> : <Navigate to="/login" replace />} />
            <Route path="/admin/manage/order" element={user?.role === 'admin' ? <LegacyOrdersRedirect /> : <Navigate to="/login" replace />} />
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
