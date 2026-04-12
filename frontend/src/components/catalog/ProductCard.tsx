// src/components/catalog/ProductCard.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ProductRead } from '@/types/api';
import { StarRating } from './StarRating';
import { DiscountBadge } from './DiscountBadge';

interface ProductCardProps {
  product: ProductRead;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="group flex flex-col bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 relative"
    >
      {/* Badges Overlay */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
        {product.is_new && (
          <span className="bg-blue-600 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
            MỚI
          </span>
        )}
        {product.compare_at_price && Number(product.compare_at_price) > product.price && (
          <DiscountBadge 
            price={product.price} 
            compareAtPrice={Number(product.compare_at_price)} 
          />
        )}
      </div>

      <Link to={`/products/${product.slug}`} className="block relative aspect-square overflow-hidden bg-gray-50 flex-shrink-0">
        {/* Mock image for now since ProductRead API doesn't guarantee a singular string image URL in list, you would normally map the first product image */}
        <img 
          src="https://via.placeholder.com/400x400.png?text=Product+Image" 
          alt={product.name} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          loading="lazy"
        />
        
        {/* Overlay Action */}
        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="bg-white text-primary font-semibold py-2 px-6 rounded-full transform translate-y-4 group-hover:translate-y-0 transition-all shadow-md">
            Xem chi tiết
          </div>
        </div>
      </Link>

      <div className="p-4 flex flex-col flex-grow">
        {/* Meta info */}
        <div className="flex items-center gap-1 mb-2">
          <StarRating rating={Number(product.rating_avg) || 0} readOnly size={14} />
          <span className="text-xs text-gray-400">({product.rating_count})</span>
        </div>

        <Link to={`/products/${product.slug}`} className="block mt-auto">
          <h3 className="font-semibold text-gray-800 leading-tight mb-2 line-clamp-2 group-hover:text-primary transition-colors">
            {product.name}
          </h3>
        </Link>
        
        <div className="flex flex-col mt-auto pt-3 border-t border-gray-50">
          <span className="text-lg font-bold text-red-600">
            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price)}
          </span>
          {product.compare_at_price && Number(product.compare_at_price) > product.price && (
            <span className="text-sm text-gray-400 line-through">
              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(product.compare_at_price))}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};
