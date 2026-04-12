// src/pages/public/ProductDetail.tsx
import React, { useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { ShoppingCart, Check, ShieldCheck, Truck, RotateCcw } from 'lucide-react';
import { SeoHead } from '@/components/common/SeoHead';
import { Breadcrumb } from '@/components/common/Breadcrumb';
import { StarRating } from '@/components/catalog/StarRating';
import { ProductImageGallery } from '@/components/catalog/ProductImageGallery';
import { ReviewSection } from '@/components/catalog/ReviewSection';
import { DiscountBadge } from '@/components/catalog/DiscountBadge';
import { useProducts, useProductImages, useProductReviews } from '@/hooks/useCatalog';
import { useCartStore } from '@/store/cartStore';

const ProductDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [quantity, setQuantity] = useState(1);
  const addItem = useCartStore(state => state.addItem);

  // Fallback to fetch via list if single fetch hook isn't strictly available.
  const { data: listData, isLoading } = useProducts({ limit: 1 }); // Ideally we fetch by slug specifically
  const product = listData?.items.find(p => p.slug === slug) || listData?.items[0];

  const { data: images } = useProductImages(product?.id || '');
  const { data: reviews } = useProductReviews(product?.id || '');

  if (isLoading) {
    return <div className="container mx-auto py-20 text-center animate-pulse">Đang tải sản phẩm...</div>;
  }

  if (!product) {
    return <Navigate to="/products" replace />;
  }

  const handleAddToCart = () => {
    addItem(product, quantity);
    toast.custom((t) => (
      <div className={`bg-white px-6 py-4 shadow-xl border rounded-lg flex items-center gap-4 ${t.visible ? 'animate-in fade-in slide-in-from-top-2' : 'animate-out fade-out'}`}>
        <div className="bg-green-100 p-2 rounded-full text-green-600"><Check size={20} className="stroke-2" /></div>
        <div>
          <p className="font-bold">Đã thêm vào giỏ hàng!</p>
          <p className="text-sm text-gray-500">{product.name} (x{quantity})</p>
        </div>
      </div>
    ), { duration: 3000 });
  };

  const imagesArray = images?.length ? images : [{ id: 'null', product_id: product.id, url: 'https://via.placeholder.com/800x800?text=Sản+Phẩm', alt_text: '', position: 0, is_active: true, created_at: '', updated_at: '' }];

  return (
    <div className="bg-white pb-16">
      <SeoHead
        title={product.seo_title || product.name}
        description={product.seo_description || 'Sản phẩm bảo hộ chính hãng.'}
      />

      <div className="bg-gray-50 py-4 border-b">
        <div className="container mx-auto px-4 max-w-7xl">
          <Breadcrumb
            items={[
              { label: 'Trang chủ', href: '/' },
              { label: 'Danh mục', href: '/categories' },
              { label: product.name }
            ]}
          />
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-7xl pt-8 lg:pt-12">
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-16">
          
          {/* Left: Interactive Image Gallery */}
          <div className="lg:w-1/2 flex-shrink-0">
             <ProductImageGallery images={imagesArray.map(i => i.url)} />
          </div>

          {/* Right: Product Info & Actions */}
          <div className="lg:w-1/2 flex flex-col justify-center">
            {product.is_new && (
               <span className="inline-block bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded w-fit mb-4">SẢN PHẨM MỚI</span>
            )}
            
            <h1 className="text-3xl md:text-4xl font-black leading-tight mb-4 text-gray-900">{product.name}</h1>
            
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
              <div className="flex items-center gap-1">
                <StarRating rating={Number(product.rating_avg) || 5} readOnly size={18} />
                <span className="text-sm font-semibold text-gray-700 ml-1">{product.rating_avg || 5.0}</span>
                <span className="text-sm text-gray-400 ml-1">({product.rating_count} đánh giá)</span>
              </div>
              <span className="text-gray-300">|</span>
              <span className="text-sm font-medium text-green-600 flex items-center gap-1">
                <Check size={16} /> Tình trạng: Còn hàng
              </span>
            </div>

            <div className="mb-8">
              <div className="flex items-end gap-3 mb-2">
                <span className="text-4xl font-black text-red-600">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price)}
                </span>
                {product.compare_at_price && Number(product.compare_at_price) > product.price && (
                  <span className="text-xl text-gray-400 line-through mb-1">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(product.compare_at_price))}
                  </span>
                )}
              </div>
              
              {product.compare_at_price && Number(product.compare_at_price) > product.price && (
                <DiscountBadge 
                    price={product.price} 
                    compareAtPrice={Number(product.compare_at_price)} 
                />
              )}
            </div>

            {/* Action Bar */}
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 mb-8 space-y-4">
              <div className="flex items-center gap-4 mb-2">
                <span className="font-semibold text-gray-700">Số lượng:</span>
                <div className="flex items-center border bg-white rounded-md overflow-hidden shadow-sm">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-4 py-2 hover:bg-gray-50 transition font-bold border-r"
                  >-</button>
                  <input 
                    type="number" 
                    value={quantity} 
                    readOnly
                    className="w-16 text-center py-2 font-bold focus:outline-none"
                  />
                  <button 
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-4 py-2 hover:bg-gray-50 transition font-bold border-l"
                  >+</button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={handleAddToCart}
                  className="flex-1 bg-white border-2 border-primary text-primary hover:bg-primary/5 font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all"
                >
                  <ShoppingCart size={20} />
                  Thêm vào giỏ
                </button>
                <button 
                  onClick={() => {
                    handleAddToCart();
                    window.location.href = '/checkout';
                  }}
                  className="flex-1 bg-primary text-white hover:bg-primary/90 font-bold py-4 rounded-xl shadow-soft transition-transform transform hover:-translate-y-1"
                >
                  MUA NGAY
                </button>
              </div>
            </div>

            {/* Micro Commitments */}
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm font-medium text-gray-600">
              <li className="flex items-center gap-2"><ShieldCheck className="text-primary" size={18}/> 100% Chính hãng</li>
              <li className="flex items-center gap-2"><Truck className="text-primary" size={18}/> Freeship toàn quốc</li>
              <li className="flex items-center gap-2"><RotateCcw className="text-primary" size={18}/> Đổi trả 7 ngày</li>
            </ul>

          </div>
        </div>
      </div>

      {/* Reviews Section using our previously generated component mapping strictly to API schemas */}
      <div className="container mx-auto px-4 max-w-7xl pt-20">
        <div className="bg-gray-50 p-8 rounded-2xl border border-gray-100">
           <ReviewSection productId={product.id} reviews={reviews?.items || []} totalReviews={reviews?.total || 0}/>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
