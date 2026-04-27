import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ShoppingCart, Heart, Eye } from 'lucide-react';
import { ProductRead } from '@/types/api';
import { StarRating } from './StarRating';
import toast from 'react-hot-toast';
import { useCartStore } from '@/store/cartStore';

import { useWishlistStore } from '@/store/wishlistStore';
import { useAuthStore } from '@/store/authStore';
import { formatCurrency } from '@/lib/currency';

interface ProductCardProps {
  product: ProductRead;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { i18n } = useTranslation();
  const addItem = useCartStore((s) => s.addItem);
  const { user } = useAuthStore();
  const { toggleItem, isInWishlist } = useWishlistStore();
  const isFavorite = isInWishlist(product.id);

  const fmt = (val: number) => formatCurrency(val, { locale: i18n.language === 'vi' ? 'vi-VN' : 'en-US' });

  const comparePrice = product.compare_at_price ? Number(product.compare_at_price) : 0;
  const discount = comparePrice > product.price
    ? Math.round(((comparePrice - product.price) / comparePrice) * 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group flex flex-col bg-white rounded-[1.5rem] overflow-hidden transition-all duration-500 border border-transparent hover:border-primary/10 card-shadow relative h-full flex-1 min-w-[160px]"
    >
      {/* Badges Overlay */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2 pointer-events-none">
        {discount > 0 && (
          <span className="bg-destructive text-white text-[11px] font-black px-2.5 py-1 rounded-lg shadow-lg shadow-destructive/20 uppercase tracking-tight">
            -{discount}%
          </span>
        )}
        {product.is_new && (
          <span className="bg-secondary text-white text-[11px] font-black px-2.5 py-1 rounded-lg shadow-lg shadow-secondary/20 uppercase tracking-tight">
            NEW
          </span>
        )}
      </div>

      {/* Action Buttons (Floating on hover) */}
      <div className="absolute top-4 right-4 z-30 flex flex-col gap-2.5 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0 duration-300">
        {user && (
          <button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleItem(product);
              if (!isFavorite) {
                toast.success('Đã thêm vào yêu thích!');
              }
            }}
            className={`w-10 h-10 rounded-xl shadow-xl flex items-center justify-center transition-all duration-300 active:scale-90 ${
              isFavorite 
                ? 'bg-destructive text-white' 
                : 'bg-white text-gray-500 hover:text-white hover:bg-destructive'
            }`}
          >
            <Heart size={20} fill={isFavorite ? "currentColor" : "none"} />
          </button>
        )}
        <Link 
          to={`/products/${product.slug}`}
          className="w-10 h-10 bg-white text-gray-500 hover:text-white hover:bg-primary rounded-xl shadow-xl flex items-center justify-center transition-all duration-300 active:scale-90"
        >
          <Eye size={20} />
        </Link>
      </div>

      {/* Image Section */}
      <Link
        to={`/products/${product.slug}`}
        className="block relative aspect-[4/5] overflow-hidden bg-white group-hover:bg-gray-50 transition-colors duration-500"
      >
        <img
          src={product.cover_image_url || "https://via.placeholder.com/400x500.png?text=NBE+Hoang+Duy"}
          alt={product.name}
          className="w-full h-full object-contain p-6 transition-transform duration-1000 group-hover:scale-110 ease-out"
          loading="lazy"
        />
        {/* Subtle overlay on hover */}
        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      </Link>

      {/* Info Section */}
      <div className="p-4 md:p-5 flex flex-col flex-grow">
        {/* Brand & Category */}
        <div className="flex items-center justify-between mb-2">
          {product.brand ? (
            <span className="text-[10px] font-black text-primary uppercase tracking-[0.15em] opacity-80 decoration-primary/30 decoration-2 underline-offset-4 hover:underline">
              {product.brand.name}
            </span>
          ) : (
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">NBE Hoang Duy</span>
          )}

          <div className="flex items-center gap-1.5 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100/50">
            <StarRating value={Number(product.rating_avg) || 0} readOnly size="xs" />
            <span className="text-[10px] font-bold text-amber-700">{Number(product.rating_avg) || 5}</span>
            {product.rating_count > 0 && (
              <span className="text-[9px] font-medium text-gray-400 border-l border-amber-200 pl-1.5">
                {product.rating_count}
              </span>
            )}
          </div>
        </div>

        {/* Title */}
        <Link to={`/products/${product.slug}`} className="block mb-3 group/title">
          <h3 className="font-bold text-gray-900 text-sm md:text-[15px] leading-[1.3] transition-colors duration-300 group-hover/title:text-primary h-10 line-clamp-2">
            {product.name}
          </h3>
        </Link>

        {/* Pricing Stack */}
        <div className="flex flex-col gap-2 mt-auto">
          {/* Main Price Row */}
          <div className="flex items-baseline gap-2">
            <span className="text-xl md:text-[1.4rem] font-black text-gray-900 tracking-tight leading-none">
              {fmt(product.price)}
            </span>
            {discount > 0 && (
              <span className="text-[11px] text-gray-400 line-through font-medium">
                {fmt(comparePrice)}
              </span>
            )}
          </div>

          {/* Dealer Price (Premium Highlight) */}
          {product.dealer_price && (
            <div className="flex items-center justify-between bg-emerald-50/60 border border-emerald-100/50 px-3 py-2 rounded-xl transition-all group-hover:bg-emerald-50">
              <span className="text-[9px] font-black text-emerald-800 uppercase tracking-widest">Đại Lý</span>
              <span className="text-[13px] font-black text-primary">{fmt(product.dealer_price)}</span>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="mt-5 pt-4 border-t border-gray-100/60">
          <button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              addItem(product, 1);
              toast.success(`Đã thêm ${product.name} vào giỏ hàng!`, {
                icon: '🛒',
                style: {
                  borderRadius: '10px',
                  background: '#333',
                  color: '#fff',
                },
              });
            }}
            className="w-full py-3 bg-gray-50 text-gray-600 font-black text-[11px] rounded-[1.1rem] flex items-center justify-center gap-2.5 border border-gray-100 group-hover:bg-primary group-hover:text-white group-hover:border-primary group-hover:shadow-lg group-hover:shadow-primary/30 transition-all duration-300 active:scale-95 uppercase tracking-widest"
          >
            <ShoppingCart size={16} strokeWidth={2.5} className="group-hover:rotate-12 transition-transform" />
            THÊM<span className="hidden sm:inline">VÀO GIỎ</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
};

