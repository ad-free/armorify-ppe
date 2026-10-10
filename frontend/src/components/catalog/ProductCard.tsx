import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Primitives';
import { useTranslation } from 'react-i18next';
import { Heart, Eye } from 'lucide-react';
import { ProductRead } from '@/types/api';
import { StarRating } from './StarRating';
import { authToast } from '@/lib/toast';
import { useWishlistStore } from '@/store/wishlistStore';
import { useAuthStore } from '@/store/authStore';
import { formatCurrency } from '@/lib/currency';
import { getMediaUrl } from '@/lib/api';

function getCardFacts(raw: ProductRead['specifications']) {
  const entries: [unknown, unknown][] = Array.isArray(raw)
    ? raw.flatMap((row) => row && typeof row === 'object' && 'name' in row && 'value' in row
      ? [[row.name, row.value] as [unknown, unknown]] : [])
    : raw && typeof raw === 'object' ? Object.entries(raw) : [];
  const rows = entries.flatMap(([name, value]) => {
    if (typeof name !== 'string' || !name.trim()) return [];
    if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean') return [];
    if (typeof value === 'number' && !Number.isFinite(value)) return [];
    if (!String(value).trim()) return [];
    const label = name.trim().replace(/_/g, ' ');
    const key = label.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
    return [{ label, value: String(value).trim(), key }];
  });
  const unitKeys = /^(don vi|don vi tinh|unit|price unit|sales unit|unit of measure)$/;
  const standardKeys = /^(tieu chuan|chung nhan|standard|standards|certification|certifications)$/;
  const unit = rows.find((row) => unitKeys.test(row.key))?.value;
  const standards = rows.filter((row) => standardKeys.test(row.key));
  const details = rows.filter((row) => !unitKeys.test(row.key) && !standardKeys.test(row.key));
  return { unit, standards, details: details.slice(0, 2) };
}

interface ProductCardProps {
  product: ProductRead;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { i18n } = useTranslation();
  const { user } = useAuthStore();
  const { toggleItem, isInWishlist } = useWishlistStore();
  const isFavorite = isInWishlist(product.id);
  const inStock = product.stock > 0;
  const { unit, standards, details } = getCardFacts(product.specifications);

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
            <Link
              to={`/brand/${product.brand.slug}`}
              aria-label={`Thương hiệu: ${product.brand.name}`}
              className="text-caption inline-flex min-h-11 items-center break-words hover:text-primary"
            >
              {product.brand.name}
            </Link>
          ) : (
            <span className="text-caption">Sản phẩm</span>
          )}

          {product.rating_count > 0 && (
            <div
              className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground"
              aria-label={`${Number(product.rating_avg).toFixed(1)} trên 5, ${product.rating_count} đánh giá`}
            >
              <StarRating value={Number(product.rating_avg) || 0} readOnly size="xs" />
              <span className="font-semibold">{Number(product.rating_avg).toFixed(1)}</span>
              <span>({product.rating_count})</span>
            </div>
          )}
        </div>

        {/* Title */}
        <Link to={`/products/${product.slug}`} className="block mb-3 min-h-11 hover:text-primary">
          <h3 className="font-semibold text-sm sm:text-base leading-snug min-h-11 line-clamp-2">
            {product.name}
          </h3>
        </Link>

        <dl className="mb-3 space-y-2 break-words text-xs">
          {standards.length === 0 && (
            <div className="text-muted-foreground">
              <dt className="sr-only">Tiêu chuẩn</dt>
              <dd>Tiêu chuẩn chưa cung cấp</dd>
            </div>
          )}
          {[...standards, ...details].map((fact, index) => (
            <div key={`${fact.label}-${index}`}>
              <dt className="text-muted-foreground">{fact.label}</dt>
              <dd className="font-medium text-foreground">{fact.value}</dd>
            </div>
          ))}
        </dl>

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
          <p className="break-words text-xs text-muted-foreground">
            {unit ? `Giá / ${unit}` : 'Đơn vị chưa cung cấp'}
          </p>

          {/* Dealer price */}
          {product.dealer_price && (
            <div className="flex flex-wrap items-center justify-between gap-1 bg-primary-soft border border-primary/20 px-2 py-2 rounded-md">
              <span className="text-xs text-primary">Đại lý</span>
              <span className="text-sm font-semibold text-primary">{fmt(product.dealer_price)}</span>
            </div>
          )}
        </div>
        <p className={`mt-3 text-xs font-medium ${inStock ? 'text-success' : 'text-muted-foreground'}`}>
          {inStock ? `Còn hàng (${product.stock})` : 'Hết hàng'}
        </p>

        {/* Action Button */}
        <div className="mt-4 pt-3 border-t border-border">
          {inStock ? (
            <Link
              to={`/products/${encodeURIComponent(product.slug)}`}
              aria-label={`Xem lựa chọn: ${product.name}`}
              className="btn btn-primary w-full whitespace-normal px-2 text-xs sm:text-sm"
            >
              Xem lựa chọn
            </Link>
          ) : (
            <Button disabled aria-label={`Hết hàng: ${product.name}`} className="w-full whitespace-normal px-2 text-xs sm:text-sm">
              Hết hàng
            </Button>
          )}
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

