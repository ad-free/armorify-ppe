import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { FloatingContact } from './components/common/FloatingContact';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { useAuthStore } from './store/authStore';

// Lazy load the pages we built
const HomePage = React.lazy(() => import('./pages/public/HomePage'));
const BlogList = React.lazy(() => import('./pages/public/BlogList'));
const BlogDetail = React.lazy(() => import('./pages/public/BlogDetail'));
const BrandPage = React.lazy(() => import('./pages/public/BrandPage'));
const DealerPage = React.lazy(() => import('./pages/public/DealerPage'));
const VideoPage = React.lazy(() => import('./pages/public/VideoPage'));

const CategoryPage = React.lazy(() => import('./pages/public/CategoryPage'));
const ProductDetail = React.lazy(() => import('./pages/public/ProductDetail'));
const CartPage = React.lazy(() => import('./pages/public/CartPage'));
const CheckoutPage = React.lazy(() => import('./pages/public/CheckoutPage'));

const LoginPage = React.lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = React.lazy(() => import('./pages/auth/RegisterPage'));
const ProfilePage = React.lazy(() => import('./pages/user/ProfilePage'));
const AdminDashboard = React.lazy(() => import('./pages/admin/Dashboard'));
const ResourceManagerPage = React.lazy(() => import('./pages/admin/ResourceManager'));

function App() {
  const hasHydrated = useAuthStore(state => state._hasHydrated);

  if (!hasHydrated) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium animate-pulse">Initializing Armorify...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Navbar />

      <main className="min-h-[80vh] bg-gray-50">
        <Suspense fallback={<div className="flex p-20 justify-center">Đang tải...</div>}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/blog" element={<BlogList />} />
            <Route path="/blog/:slug" element={<BlogDetail />} />
            <Route path="/brand/:slug" element={<BrandPage />} />
            <Route path="/dealer" element={<DealerPage />} />
            <Route path="/video" element={<VideoPage />} />
            <Route path="/categories/:slug" element={<CategoryPage />} />
            <Route path="/products/:slug" element={<ProductDetail />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/manage/:entityId" element={<ResourceManagerPage />} />
          </Routes>
        </Suspense>
      </main>
      
      <Footer />
      <FloatingContact />
      <Toaster
        position="top-right"
        gutter={10}
        containerStyle={{ top: 20, right: 20 }}
        toastOptions={{
          duration: 3200,
        }}
      />
    </BrowserRouter>
  );
}

export default App;
