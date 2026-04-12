import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { FloatingContact } from './components/common/FloatingContact';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';

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

function App() {
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
          </Routes>
        </Suspense>
      </main>
      
      <Footer />
      <FloatingContact />
      <Toaster position="top-right" />
    </BrowserRouter>
  );
}

export default App;
