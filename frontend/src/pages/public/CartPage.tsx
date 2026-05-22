// src/pages/public/CartPage.tsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { SeoHead } from '@/components/common/SeoHead';
import { Breadcrumb } from '@/components/common/Breadcrumb';
import { useCartStore } from '@/store/cartStore';
import { formatCurrency } from '@/lib/currency';
import { getMediaUrl } from '@/lib/api';

const CartPage: React.FC = () => {
  const { items, removeItem, updateQuantity, getTotalPrice } = useCartStore();
  const navigate = useNavigate();

  const formatMoney = (val: number) => formatCurrency(val);

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      <SeoHead title="Giỏ hàng | NBE Hoang Duy" />
      
      <div className="bg-white border-b py-4">
        <div className="container mx-auto px-4 max-w-7xl">
          <Breadcrumb items={[{ label: 'Trang chủ', href: '/' }, { label: 'Giỏ hàng của bạn' }]} />
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-7xl pt-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
            <ShoppingBag size={32} className="text-primary" />
            Giỏ Hàng
          </h1>
          {items.length > 0 && (
            <button 
              onClick={() => {
                if(window.confirm('Bạn có chắc chắn muốn xoá toàn bộ giỏ hàng?')) {
                  useCartStore.getState().clearCart();
                }
              }}
              className="text-sm font-bold text-gray-400 hover:text-rose-500 transition-colors flex items-center gap-1.5 uppercase tracking-widest"
            >
              <Trash2 size={16} />
              Xoá tất cả
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-soft p-16 text-center"
          >
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingBag size={40} className="text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold mb-4">Giỏ hàng trống</h2>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              Chưa có sản phẩm nào trong giỏ hàng. Khám phá hàng ngàn thiết bị bảo hộ lao động chính hãng với mức chiết khấu hấp dẫn!
            </p>
            <Link to="/products" className="inline-block bg-primary text-white font-bold py-3 px-8 rounded-lg hover:bg-primary/90 transition-transform transform hover:-translate-y-1">
              Tiếp tục mua sắm
            </Link>
          </motion.div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Cart Items */}
            <div className="flex-1 space-y-4">
              {items.map((item) => (
                <div
                  key={`${item.product.id}-${item.variant_id ?? 'default'}-${item.unit_price ?? item.product.price}`}
                  className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex gap-4 md:gap-6 relative"
                >
                  <div className="w-24 h-24 md:w-32 md:h-32 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden border border-gray-200">
                    <img 
                      src={getMediaUrl(item.product.cover_image_url) || "https://via.placeholder.com/200"} 
                      alt={item.product.name} 
                      className="w-full h-full object-contain p-2 bg-white"
                    />
                  </div>
                  <div className="flex-1 flex flex-col justify-between py-1">
                    <div className="pr-10">
                      <Link to={`/products/${item.product.slug}`} className="font-bold text-gray-800 hover:text-primary text-lg line-clamp-2 leading-tight">
                        {item.product.name}
                      </Link>
                      {/* Variant Info Placeholder - Note: Real variant data requires fetching or storing inside CartItem */}
                      {item.variant_id && (
                        <p className="text-xs font-semibold text-gray-500 mt-1 uppercase tracking-widest">
                          Phân loại ID: {item.variant_id.slice(0,8)}...
                        </p>
                      )}
                      <p className="font-bold text-red-600 mt-2">
                        {formatMoney(item.unit_price ?? item.product.price)}
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center border rounded-md overflow-hidden bg-gray-50">
                        <button onClick={() => updateQuantity(item.product.id, item.quantity - 1, item.variant_id)} className="px-3 py-1 hover:bg-gray-200 font-bold">-</button>
                        <input type="number" readOnly value={item.quantity} className="w-12 text-center py-1 bg-transparent font-medium outline-none"/>
                        <button onClick={() => updateQuantity(item.product.id, item.quantity + 1, item.variant_id)} className="px-3 py-1 hover:bg-gray-200 font-bold">+</button>
                      </div>
                      
                      <p className="font-bold hidden md:block text-gray-900">
                        Thành tiền:{' '}
                        {formatMoney((item.unit_price ?? item.product.price) * item.quantity)}
                      </p>
                    </div>
                  </div>
                  
                  {/* Delete btn */}
                  <button onClick={() => removeItem(item.product.id, item.variant_id)} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors">
                    <Trash2 size={20} />
                  </button>
                </div>
              ))}
            </div>

            {/* Summary Sidebar */}
            <div className="w-full lg:w-96 flex-shrink-0">
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 sticky top-24">
                <h3 className="font-bold text-xl mb-6 border-b pb-4">Tóm tắt đơn hàng</h3>
                
                <div className="space-y-4 mb-6 text-gray-600 font-medium">
                  <div className="flex justify-between">
                    <span>Tạm tính</span>
                    <span>{formatMoney(getTotalPrice())}</span>
                  </div>
                  <div className="flex justify-between text-green-600">
                    <span>Giảm giá</span>
                    <span>- 0đ</span>
                  </div>
                  <div className="flex justify-between border-t border-dashed pt-4">
                    <span className="font-bold text-gray-900">Tổng cộng</span>
                    <span className="font-black text-2xl text-red-600">
                      {formatMoney(getTotalPrice())}
                    </span>
                  </div>
                  <p className="text-right text-xs text-gray-400 mt-1">(Đã bao gồm VAT nếu có)</p>
                </div>

                <div className="mb-6">
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Nhập mã ưu đãi..." 
                      className="flex-1 border border-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-primary font-medium uppercase placeholder:normal-case placeholder:font-normal"
                    />
                    <button className="bg-gray-900 text-white px-5 py-3 rounded-lg text-sm font-bold hover:bg-gray-800 transition-colors">
                      ÁP DỤNG
                    </button>
                  </div>
                </div>

                <button 
                  onClick={() => navigate('/checkout')}
                  className="w-full bg-primary text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 transition-transform transform hover:-translate-y-1 shadow-soft"
                >
                  TIẾN HÀNH THANH TOÁN <ArrowRight size={20}/>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;
