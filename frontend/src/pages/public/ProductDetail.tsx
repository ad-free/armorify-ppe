// src/pages/public/ProductDetail.tsx
import React, { useEffect, useMemo, useState } from 'react';
import DOMPurify from 'dompurify';
import { marked } from 'marked';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Truck, Undo2, Heart, ShieldCheck, PhoneCall, Sparkles, Flame } from 'lucide-react';
import { authToast } from '@/lib/toast';
import { SeoHead } from '@/components/common/SeoHead';
import { Breadcrumb } from '@/components/common/Breadcrumb';
import { StarRating } from '@/components/catalog/StarRating';
import { ProductImageGallery } from '@/components/catalog/ProductImageGallery';
import { ReviewSection } from '@/components/catalog/ReviewSection';
import { ProductCard } from '@/components/catalog/ProductCard';
import { ProductSpecifications } from '@/components/catalog/ProductSpecifications';
import { CountdownTimer } from '@/components/common/CountdownTimer';
import {
  useCategories,
  useProductBySlug,
  useProductImages,
  useProductReviews,
  useProductVariants,
  useRelatedProducts,
} from '@/hooks/useCatalog';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import type { ProductRead, ProductVariantRead } from '@/types/api';
import { getMediaUrl } from '@/lib/api';

type DetailTab = 'description' | 'specs' | 'reviews';

const resolveVariantUnitPrice = (product: ProductRead, v: ProductVariantRead | null) => {
  let basePrice = product.price;
  if (v) {
    const o = v.price_override;
    if (o != null && String(o) !== '' && Number(o) > 0) {
      basePrice = Number(o);
    }
  }

  // Apply flash sale override if active
  if (product.is_flash_deal) {
    if (product.flash_sale_discount) {
      return basePrice * (1 - product.flash_sale_discount / 100);
    } else if (product.flash_sale_price) {
      return Number(product.flash_sale_price);
    }
  }

  return basePrice;
};

const ProductDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<DetailTab>('description');
  const addItem = useCartStore((s) => s.addItem);
  const { toggleItem, isInWishlist } = useWishlistStore();

  const { data: product, isLoading, isError } = useProductBySlug(slug);
  const { data: images } = useProductImages(product?.id);
  const { data: reviewsData } = useProductReviews(product?.id || '', 0, 10);
  const { data: related } = useRelatedProducts(product?.id);
  const { data: variants } = useProductVariants(product?.id);
  const { data: categories } = useCategories();

  // Real-time rating calculation
  const { ratingAvg, ratingCount } = useMemo(() => {
    const distribution = reviewsData?.extra?.distribution || {};
    const count = Object.values(distribution).reduce((a: any, b: any) => a + b, 0) as number;
    const totalPoints = Object.entries(distribution).reduce((acc, [star, c]) => acc + (Number(star) * (c as number)), 0);
    const avg = count > 0 ? (totalPoints / count).toFixed(2) : (product?.rating_avg || '0.00');
    return {
      ratingAvg: avg,
      ratingCount: count > 0 ? count : (product?.rating_count || 0)
    };
  }, [reviewsData, product]);

  const category = useMemo(
    () => categories?.find((c) => c.id === product?.category_id),
    [categories, product?.category_id]
  );

  const formatMoney = (value: number) =>
    new Intl.NumberFormat(i18n.language === 'vi' ? 'vi-VN' : 'en-US', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(value);

  const activeVariant = useMemo(() => {
    if (!variants?.length) return null;
    if (selectedVariantId) {
      const found = variants.find((v) => v.id === selectedVariantId);
      if (found) return found;
    }
    return null;
  }, [variants, selectedVariantId]);

  const effectivePrice = useMemo(() => {
    if (!product) return 0;
    return resolveVariantUnitPrice(product, activeVariant);
  }, [product, activeVariant]);

  const effectiveStock = useMemo(() => {
    if (!product) return 0;
    if (variants && variants.length > 0) {
      if (activeVariant) return activeVariant.stock;

      let filteredVariants = variants;
      if (selectedSize) {
        filteredVariants = filteredVariants.filter(v => v.size === selectedSize);
      }
      if (selectedColor) {
        filteredVariants = filteredVariants.filter(v => v.color === selectedColor);
      }

      return filteredVariants.reduce((sum, v) => sum + (v.stock || 0), 0);
    }
    return product.stock || 0;
  }, [product, variants, activeVariant, selectedSize, selectedColor]);

  const primarySku = useMemo(() => activeVariant?.sku ?? variants?.[0]?.sku ?? '—', [activeVariant, variants]);

  const allSizes = useMemo(() => Array.from(new Set(variants?.map(v => v.size).filter((s): s is string => Boolean(s)))), [variants]);
  const allColors = useMemo(() => Array.from(new Set(variants?.map(v => v.color).filter((c): c is string => Boolean(c)))), [variants]);

  const validSizes = useMemo(() => {
    if (!variants) return [];
    let validVariants = variants;
    if (selectedColor) {
      validVariants = validVariants.filter(v => v.color === selectedColor);
    }
    return Array.from(new Set(validVariants.map(v => v.size).filter((s): s is string => Boolean(s))));
  }, [variants, selectedColor]);

  const validColors = useMemo(() => {
    if (!variants) return [];
    let validVariants = variants;
    if (selectedSize) {
      validVariants = validVariants.filter(v => v.size === selectedSize);
    }
    return Array.from(new Set(validVariants.map(v => v.color).filter((c): c is string => Boolean(c))));
  }, [variants, selectedSize]);

  const stockState = useMemo(() => {
    if (!product) return 'out' as const;
    if (effectiveStock <= 0) return 'out' as const;
    if (variants && variants.length > 0 && !activeVariant) return 'in' as const;
    if (effectiveStock <= 5) return 'low' as const;
    return 'in' as const;
  }, [product, effectiveStock, variants, activeVariant]);

  const currentProductId = React.useRef<string | null>(null);

  // Sync selection logic & auto-select on product load
  useEffect(() => {
    if (!product?.id || !variants?.length) return;

    if (currentProductId.current !== product.id) {
      currentProductId.current = product.id;
      // Prefer first variant with stock > 0, fallback to first variant
      const defaultVariant = variants.find(v => v.stock > 0) || variants[0];
      setSelectedVariantId(defaultVariant.id);
      setSelectedSize(defaultVariant.size || null);
      setSelectedColor(defaultVariant.color || null);
    }
  }, [product?.id, variants]);

  const handleSizeSelect = (size: string) => {
    if (selectedSize === size) {
      setSelectedSize(null);
      const v = variants?.find(v => v.color === selectedColor);
      setSelectedVariantId(v?.id || null);
      return;
    }
    setSelectedSize(size);
    const validColorsForThisSize = variants?.filter(v => v.size === size).map(v => v.color).filter(Boolean) || [];
    let newColor = selectedColor;
    if (selectedColor && !validColorsForThisSize.includes(selectedColor)) {
      newColor = null;
      setSelectedColor(null);
    }
    const v = variants?.find(v => v.size === size && (newColor ? v.color === newColor : !v.color));
    if (v) {
      setSelectedVariantId(v.id);
    } else {
      setSelectedVariantId(null);
    }
  };

  const handleColorSelect = (color: string) => {
    if (selectedColor === color) {
      setSelectedColor(null);
      const v = variants?.find(v => v.size === selectedSize);
      setSelectedVariantId(v?.id || null);
      return;
    }
    setSelectedColor(color);
    const validSizesForThisColor = variants?.filter(v => v.color === color).map(v => v.size).filter(Boolean) || [];
    let newSize = selectedSize;
    if (selectedSize && !validSizesForThisColor.includes(selectedSize)) {
      newSize = null;
      setSelectedSize(null);
    }
    const v = variants?.find(v => v.color === color && (newSize ? v.size === newSize : !v.size));
    if (v) {
      setSelectedVariantId(v.id);
    } else {
      setSelectedVariantId(null);
    }
  };

  const maxQty = product ? Math.min(99, Math.max(1, effectiveStock)) : 1;

  const safeDescriptionHtml = useMemo(() => {
    if (!product?.description) return '';
    const purifyConfig = {
      ADD_TAGS: ['iframe'],
      ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling'],
      USE_PROFILES: { html: true }
    };

    try {
      const parsed = marked.parse(product.description, { async: false }) as string;
      return DOMPurify.sanitize(parsed, purifyConfig);
    } catch (e) {
      return DOMPurify.sanitize(product.description, purifyConfig);
    }
  }, [product?.description]);

  const onSale = Boolean(
    product &&
    product.compare_at_price &&
    Number(product.compare_at_price) > effectivePrice
  );

  const salePercent =
    product && product.compare_at_price && onSale
      ? Math.round((1 - effectivePrice / Number(product.compare_at_price)) * 100)
      : 0;

  useEffect(() => {
    const cap = Math.min(99, Math.max(1, effectiveStock || 1));
    setQuantity((q) => Math.min(Math.max(1, q), cap));
  }, [effectiveStock, activeVariant?.id]);

  const handleAddToCart = () => {
    if (!product || stockState === 'out') return;
    if (variants && variants.length > 0 && !activeVariant) {
      authToast.error('Thiếu thông tin', 'Vui lòng chọn một phân loại hàng trước khi thêm vào giỏ.');
      return;
    }
    addItem(product, quantity, activeVariant?.id, effectivePrice);
    authToast.success(
      t('productDetail.toastAddedTitle', 'Thêm thành công'),
      t('productDetail.toastAddedDesc', { name: product.name, qty: quantity })
    );
  };

  const handleBuyNow = () => {
    if (!product || stockState === 'out') return;
    if (variants && variants.length > 0 && !activeVariant) {
      authToast.error('Thiếu thông tin', 'Vui lòng chọn một phân loại hàng trước khi mua.');
      return;
    }
    addItem(product, quantity, activeVariant?.id, effectivePrice);
    navigate('/checkout');
  };

  const handleB2BQuote = () => {
    navigate('/dealer');
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 bg-slate-50">
        <div className="w-14 h-14 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest animate-pulse">{t('productDetail.loading')}</p>
      </div>
    );
  }

  if (isError || !product) {
    return <Navigate to="/" replace />;
  }

  const fallbackImage =
    getMediaUrl(product.cover_image_url) || 'https://via.placeholder.com/900x900.png?text=Armorify';
  const imagesArray =
    images && images.length > 0
      ? images
      : [
        {
          id: 'cover',
          product_id: product.id,
          url: fallbackImage,
          alt_text: product.name,
          position: 0,
          is_active: true,
          created_at: '',
          updated_at: '',
        },
      ];

  const tabClass = (tab: DetailTab) =>
    `relative flex-1 py-4 text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab
      ? 'text-primary'
      : 'text-slate-400 hover:text-slate-800'
    }`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-[#f8fafc] min-h-screen pb-24"
    >
      <SeoHead
        title={product.seo_title || `${product.name} - NBE Hoang Duy`}
        description={product.seo_description || t('productDetail.descriptionEmpty')}
      />

      {/* Breadcrumbs Header */}
      <div className="bg-white border-b border-slate-100 py-4 shadow-sm">
        <div className="container mx-auto max-w-7xl px-6">
          <Breadcrumb
            items={[
              { label: t('productDetail.breadcrumbHome'), href: '/' },
              ...(category
                ? [{ label: category.name, href: `/categories/${category.slug}` }]
                : [{ label: t('productDetail.breadcrumbCategories'), href: '/' }]),
              { label: product.name },
            ]}
          />
        </div>
      </div>

      <div className="container mx-auto max-w-7xl px-6 pt-10">

        {/* Main Product Info Block */}
        <div className="grid gap-12 lg:grid-cols-12 items-start bg-white border border-slate-100 rounded-[3rem] p-6 md:p-10 shadow-sm">

          {/* Gallery - 5 columns */}
          <div className="lg:col-span-5 lg:sticky lg:top-28">
            <ProductImageGallery images={imagesArray} productName={product.name} />
          </div>

          {/* Core Fields - 7 columns */}
          <div className="lg:col-span-7 space-y-8">

            {/* Badges & Title */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                {product.is_flash_deal && (
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black bg-rose-500 text-white uppercase tracking-widest shadow-md shadow-rose-500/20">
                    <Flame size={12} className="fill-white" /> FLASH DEAL
                  </span>
                )}
                {product.is_featured && (
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black bg-primary/10 text-primary uppercase tracking-widest border border-primary/5">
                    <Sparkles size={12} className="fill-primary text-slate-900" /> {t('productDetail.badgeFeatured')}
                  </span>
                )}
                <span className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-600 uppercase tracking-widest border border-emerald-100">
                  <ShieldCheck size={12} className="fill-emerald-600 text-white" /> {t('productDetail.badgeAuthentic')}
                </span>
              </div>

              <h1 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight tracking-tight uppercase">
                {product.name}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-400">
                <span>{t('productDetail.sku')}: <span className="text-slate-700 font-black">{primarySku}</span></span>
                {product.brand && (
                  <>
                    <span className="text-slate-200">|</span>
                    <span>{t('productDetail.brand')}: <Link to={`/brand/${product.brand.slug}`} className="text-primary hover:text-primary/80 font-black transition-colors">{product.brand.name}</Link></span>
                  </>
                )}
              </div>
            </div>

            {/* Price & Star Rating Row */}
            <div className="bg-slate-50 rounded-[2rem] p-6 flex flex-wrap items-center justify-between gap-6 border border-slate-100 shadow-sm">
              <div className="space-y-1">
                <div className="flex flex-wrap items-baseline gap-3">
                  <span className="text-4xl font-black text-primary tracking-tight">
                    {formatMoney(effectivePrice)}
                  </span>
                  {onSale && (
                    <span className="text-lg text-slate-400 line-through decoration-slate-300">
                      {formatMoney(Number(product.compare_at_price))}
                    </span>
                  )}
                </div>
                {onSale && (
                  <p className="text-xs font-black text-emerald-600 uppercase tracking-wider bg-emerald-50 px-2.5 py-1 rounded-md w-fit">
                    {t('productDetail.savePercent', { percent: salePercent, amount: formatMoney(Number(product.compare_at_price) - effectivePrice) })}
                  </p>
                )}
              </div>

              <div className="space-y-1 text-right md:text-left">
                <div className="flex items-center gap-2">
                  <StarRating value={Number(ratingAvg) || 0} readOnly size="sm" />
                  <span className="text-sm font-black text-slate-800">{ratingAvg}</span>
                </div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                  {t('productDetail.ratingReviews', { count: ratingCount })}
                </p>
              </div>
            </div>

            {/* Variant Selectors */}
            <div className="space-y-6 pt-4 border-t border-slate-100">
              {allSizes.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{t('generic.fields.size')}:</span>
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    {allSizes.map((size) => {
                      const isValid = validSizes.includes(size);
                      const isActive = selectedSize === size;
                      return (
                        <button
                          key={size}
                          onClick={() => handleSizeSelect(size)}
                          disabled={!isValid}
                          className={`h-11 px-5 min-w-[50px] text-xs font-black rounded-xl border transition-all flex items-center justify-center gap-2 ${isActive
                              ? 'bg-primary border-primary text-white shadow-lg shadow-primary/30'
                              : isValid
                                ? 'bg-white border-slate-200 text-slate-700 hover:border-primary hover:text-primary'
                                : 'bg-slate-50 border-slate-200 border-dashed text-slate-350 cursor-not-allowed opacity-50'
                            }`}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {allColors.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{t('generic.fields.color')}:</span>
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    {allColors.map((color) => {
                      const isValid = validColors.includes(color);
                      const isActive = selectedColor === color;
                      const isHex = color.startsWith('#') || color.match(/^(rgba?|hsl)/);
                      return (
                        <button
                          key={color}
                          onClick={() => handleColorSelect(color)}
                          disabled={!isValid}
                          className={`h-11 px-5 min-w-[70px] text-xs font-black rounded-xl border transition-all flex items-center justify-center gap-2.5 ${isActive
                              ? 'bg-primary border-primary text-white shadow-lg shadow-primary/30'
                              : isValid
                                ? 'bg-white border-slate-200 text-slate-700 hover:border-primary hover:text-primary'
                                : 'bg-slate-50 border-slate-200 border-dashed text-slate-355 opacity-50 cursor-not-allowed'
                            }`}
                        >
                          {isHex ? (
                            <div
                              className={`w-4 h-4 rounded-full border shadow-sm ${isActive ? 'border-white/50' : 'border-slate-200/50'}`}
                              style={{ backgroundColor: color }}
                            />
                          ) : null}
                          <span>{color}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Countdown / Stock Progress */}
            {product.is_flash_deal && (
              <div className="bg-rose-50/50 border border-rose-100 rounded-[2rem] p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-rose-600 uppercase tracking-widest flex items-center gap-1.5">{t('productDetail.flashDealEnds')}</span>
                  {product.flash_deal_end && <CountdownTimer targetDate={product.flash_deal_end} />}
                </div>
                {effectiveStock > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                      <span>{t('productDetail.saleProgress')}</span>
                      <span dangerouslySetInnerHTML={{ __html: t('productDetail.onlyLeft', { count: effectiveStock }) }} />
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-orange-500 to-rose-600"
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.max(10, Math.min(100, (effectiveStock / 30) * 100))}%` }}
                        transition={{ duration: 1.2, ease: 'easeOut' }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Stock Availability */}
            <div className="flex items-center gap-2 pt-2">
              {effectiveStock <= 0 ? (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black bg-slate-100 text-slate-500 uppercase tracking-widest border border-slate-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400" /> {t('productDetail.stockOut')}
                </span>
              ) : effectiveStock <= 5 ? (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black bg-amber-50 text-amber-700 uppercase tracking-widest border border-amber-200 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> {t('productDetail.stockLow')} ({effectiveStock})
                </span>
              ) : (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black bg-emerald-50 text-emerald-700 uppercase tracking-widest border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" /> {t('productDetail.stockReady', { count: effectiveStock })}
                </span>
              )}
            </div>

            {/* Stepper + CTA Button Suite */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Qty stepper */}
                <div className="h-14 rounded-2xl border border-slate-200 bg-slate-50/50 flex items-center justify-between px-2 shrink-0 w-full sm:w-36">
                  <button
                    type="button"
                    disabled={quantity <= 1}
                    onClick={() => setQuantity(q => q - 1)}
                    className="w-10 h-10 flex items-center justify-center font-black text-slate-400 hover:text-primary transition-colors disabled:opacity-30 rounded-xl"
                  >
                    −
                  </button>
                  <span className="w-10 text-center font-black text-slate-900 tabular-nums text-base">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    disabled={quantity >= maxQty}
                    onClick={() => setQuantity(q => q + 1)}
                    className="w-10 h-10 flex items-center justify-center font-black text-slate-400 hover:text-primary transition-colors disabled:opacity-30 rounded-xl"
                  >
                    +
                  </button>
                </div>

                {/* Add To Cart */}
                <button
                  type="button"
                  disabled={stockState === 'out'}
                  onClick={handleAddToCart}
                  className="flex-1 h-14 flex items-center justify-center gap-2 border-2 border-primary text-primary hover:bg-primary hover:text-white font-black rounded-2xl transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed text-xs uppercase tracking-widest shadow-sm"
                >
                  <ShoppingCart size={16} strokeWidth={2.5} />
                  {t('productDetail.addToCart', 'Thêm vào giỏ')}
                </button>

                {/* Buy Now */}
                <button
                  type="button"
                  disabled={stockState === 'out'}
                  onClick={handleBuyNow}
                  className="flex-1 h-14 flex items-center justify-center bg-primary text-white font-black rounded-2xl hover:bg-primary/90 transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed text-xs uppercase tracking-widest shadow-md shadow-primary/30"
                >
                  {t('productDetail.buyNow', 'MUA NGAY')}
                </button>
              </div>

              {/* B2B / Dealer Quick Inquiry Request */}
              <button
                type="button"
                onClick={handleB2BQuote}
                className="w-full h-14 border border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10 text-primary font-black rounded-2xl flex items-center justify-center gap-2 transition-all text-xs uppercase tracking-widest"
              >
                <PhoneCall size={16} /> {t('productDetail.b2bQuote')}
              </button>
            </div>

            {/* Quick Actions & Policies */}
            <div className="flex flex-wrap items-center justify-between gap-6 pt-6 border-t border-slate-100">
              <button
                onClick={() => product && toggleItem(product)}
                className={`flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-colors ${product && isInWishlist(product.id) ? 'text-rose-500' : 'text-slate-400 hover:text-rose-500'
                  }`}
              >
                <Heart size={16} fill={product && isInWishlist(product.id) ? 'currentColor' : 'none'} strokeWidth={2.5} />
                {t('productDetail.addToWishlist')}
              </button>

              <div className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest">
                <ShieldCheck size={16} className="text-emerald-500 fill-emerald-50" strokeWidth={2.5} /> {t('productDetail.warranty')}
              </div>
            </div>

            {/* Professional B2B Policy Badges */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4">
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <Truck className="w-5 h-5 text-primary shrink-0" />
                <div className="text-left">
                  <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-wider">{t('productDetail.shipping')}</h4>
                  <p className="text-[10px] font-bold text-slate-400">{t('productDetail.shippingDesc')}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <Undo2 className="w-5 h-5 text-primary shrink-0" />
                <div className="text-left">
                  <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-wider">{t('productDetail.returnPolicy')}</h4>
                  <p className="text-[10px] font-bold text-slate-400">{t('productDetail.returnPolicyDesc')}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 col-span-2 md:col-span-1">
                <PhoneCall className="w-5 h-5 text-primary shrink-0" />
                <div className="text-left">
                  <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-wider">{t('productDetail.techSupport')}</h4>
                  <p className="text-[10px] font-bold text-slate-400">{t('productDetail.techSupportDesc')}</p>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* Tabs block */}
        <section className="mt-16">
          <div className="bg-white border border-slate-100 rounded-[2.5rem] shadow-sm overflow-hidden">

            {/* Sliding Tab Menu Bar */}
            <div className="flex border-b border-slate-100 bg-slate-50/50 px-6 gap-8">
              <button type="button" className={tabClass('description')} onClick={() => setActiveTab('description')}>
                {t('productDetail.tabDescription')}
                {activeTab === 'description' && (
                  <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full" />
                )}
              </button>
              <button type="button" className={tabClass('specs')} onClick={() => setActiveTab('specs')}>
                {t('productDetail.tabSpecs')}
                {activeTab === 'specs' && (
                  <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full" />
                )}
              </button>
              <button type="button" className={tabClass('reviews')} onClick={() => setActiveTab('reviews')}>
                {t('productDetail.tabReviews')}
                {activeTab === 'reviews' && (
                  <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full" />
                )}
              </button>
            </div>

            {/* Tab Content Panels */}
            <div className="p-8 md:p-12">
              <AnimatePresence mode="wait">
                {activeTab === 'description' && (
                  <motion.div
                    key="description"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="prose prose-slate prose-lg max-w-none prose-headings:font-black prose-headings:text-slate-900 prose-a:text-primary"
                  >
                    {safeDescriptionHtml ? (
                      <div dangerouslySetInnerHTML={{ __html: safeDescriptionHtml }} />
                    ) : (
                      <p className="text-slate-400 font-medium italic">{t('productDetail.descriptionEmpty')}</p>
                    )}
                  </motion.div>
                )}

                {activeTab === 'specs' && (
                  <motion.div
                    key="specs"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-8"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-6 w-1.5 bg-primary rounded-full" />
                      <h3 className="text-lg font-black text-slate-900 uppercase tracking-wider">{t('productDetail.specsTitle')}</h3>
                    </div>
                    <ProductSpecifications specifications={product.specifications} />
                  </motion.div>
                )}

                {activeTab === 'reviews' && (
                  <motion.div
                    key="reviews"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <ReviewSection
                      productId={product.id}
                      ratingAvg={String(ratingAvg)}
                      ratingCount={ratingCount}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>
        </section>

        {/* Related Products Grid */}
        {related && related.length > 0 && (
          <section className="mt-20">
            <div className="flex items-center gap-3 mb-8">
              <div className="h-6 w-1.5 bg-primary rounded-full" />
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{t('productDetail.relatedTitle')}</h2>
            </div>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}

      </div>
    </motion.div>
  );
};

export default ProductDetail;
