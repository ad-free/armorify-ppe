import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Primitives';
import { useTranslation } from 'react-i18next';
import { ShoppingCart, Heart, Eye } from 'lucide-react';
import { ProductRead } from '@/types/api';
import { StarRating } from './StarRating';
import { authToast } from '@/lib/toast';
import { useCartStore } from '@/store/cartStore';

import { useWishlistStore } from '@/store/wishlistStore';
import { useAuthStore } from '@/store/authStore';
import { formatCurrency } from '@/lib/currency';
import { getMediaUrl } from '@/lib/api';

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
  
  // Flash Sale Logic
  const hasFlashSale = Boolean(product.flash_sale_price);
  const displayPrice = hasFlashSale ? Number(product.flash_sale_price) : product.price;
  const originalPrice = hasFlashSale ? product.price : (comparePrice || 0);
  const displayDiscount = hasFlashSale ? product.flash_sale_discount : (comparePrice > product.price ? Math.round(((comparePrice - product.price) / comparePrice) * 100) : 0);

  return (
    <article
      className="card relative flex h-full min-w-0 flex-col overflow-hidden"
    >
      {/* Badges Overlay */}
      <div className="absolute top-3 left-3 z-20 flex flex-col items-start gap-2 pointer-events-none">
        {displayDiscount && displayDiscount > 0 ? (
          <span className="badge badge-error">
            -{displayDiscount}%
          </span>
        ) : null}
        {product.is_new && (
          <span className="badge badge-neutral">
            Mới
          </span>
        )}
        {hasFlashSale && (
          <span className="badge badge-success">
             Ưu đãi
          </span>
        )}
      </div>

      {/* Image Section */}
      <Link
        to={`/products/${product.slug}`}
        className="block relative aspect-[4/5] overflow-hidden bg-surface"
      >
        {product.cover_image_url ? (
          <img
            src={getMediaUrl(product.cover_image_url)}
            alt={product.name}
            className="w-full h-full object-contain p-4"
            loading="lazy"
            width={400}
            height={500}
          />
        ) : (
          <div className="flex h-full items-center justify-center p-4 text-caption">Chưa có ảnh</div>
        )}
      </Link>

      {/* Info Section */}
      <div className="p-3 sm:p-4 flex flex-col flex-grow">
        {/* Brand & Category */}
        <div className="flex flex-col gap-2 mb-3">
          {product.brand ? (
            <span className="text-caption">
              {product.brand.name}
            </span>
          ) : (
            <span className="text-caption">Sản phẩm</span>
          )}

          <div className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
            <StarRating value={Number(product.rating_avg) || 0} readOnly size="xs" />
            <span className="font-semibold">{Number(product.rating_avg) > 0 ? Number(product.rating_avg).toFixed(1) : '0.0'}</span>
            <span>
              ({product.rating_count || 0})
            </span>
          </div>
        </div>

        {/* Title */}
        <Link to={`/products/${product.slug}`} className="block mb-3 min-h-11 hover:text-primary">
          <h3 className="font-semibold text-sm sm:text-base leading-snug min-h-11 line-clamp-2">
            {product.name}
          </h3>
        </Link>

        {/* Pricing Stack */}
        <div className="flex flex-col gap-2 mt-auto">
          {/* Main Price Row */}
          <div className="flex flex-wrap items-baseline gap-2">
            <span className={`text-lg sm:text-xl font-bold tracking-tight ${hasFlashSale ? 'text-destructive' : 'text-foreground'}`}>
              {fmt(displayPrice)}
            </span>
            {originalPrice > displayPrice && (
              <span className="text-xs text-muted-foreground line-through">
                {fmt(originalPrice)}
              </span>
            )}
          </div>

          {/* Dealer price */}
          {product.dealer_price && (
            <div className="flex flex-wrap items-center justify-between gap-1 bg-primary-soft border border-primary/20 px-2 py-2 rounded-md">
              <span className="text-xs text-primary">Đại lý</span>
              <span className="text-sm font-semibold text-primary">{fmt(product.dealer_price)}</span>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="mt-4 pt-3 border-t border-border">
          <Button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              addItem(product, 1);
              authToast.success(
                'Thêm thành công',
                `Đã thêm ${product.name} vào giỏ hàng.`
              );
            }}
            className="w-full px-2"
          >
            <ShoppingCart size={16} aria-hidden="true" />
            Thêm vào giỏ
          </Button>
        </div>
      </div>

      {/* Always available to keyboard and touch users. */}
      <div className="absolute top-3 right-3 z-30 flex flex-col gap-2">
        {user && (
          <Button
            variant="secondary"
            aria-label={`${isFavorite ? 'Bỏ yêu thích' : 'Yêu thích'}: ${product.name}`}
            aria-pressed={isFavorite}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleItem(product);
              if (!isFavorite) {
                authToast.success('Đã thêm vào yêu thích', product.name);
              }
            }}
            className={`btn-icon ${isFavorite ? 'bg-primary-soft text-primary border-primary/20' : ''}`}
          >
            <Heart size={20} aria-hidden="true" fill={isFavorite ? "currentColor" : "none"} />
          </Button>
        )}
        <Link 
          to={`/products/${product.slug}`}
          aria-label={`Xem sản phẩm: ${product.name}`}
          className="btn btn-secondary btn-icon"
        >
          <Eye size={20} aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
};

