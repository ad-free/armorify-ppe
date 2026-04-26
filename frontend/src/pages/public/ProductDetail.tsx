// src/pages/public/ProductDetail.tsx
import React, { useEffect, useMemo, useState } from 'react';
import DOMPurify from 'dompurify';
import { marked } from 'marked';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { BadgeCheck, Check, Headphones, ShoppingCart, Sparkles, Truck, Undo2 } from 'lucide-react';
import { SeoHead } from '@/components/common/SeoHead';
import { Breadcrumb } from '@/components/common/Breadcrumb';
import { StarRating } from '@/components/catalog/StarRating';
import { ProductImageGallery } from '@/components/catalog/ProductImageGallery';
import { ReviewSection } from '@/components/catalog/ReviewSection';
import { ProductCard } from '@/components/catalog/ProductCard';
import { ProductSpecifications } from '@/components/catalog/ProductSpecifications';
import {
  useCategories,
  useProductBySlug,
  useProductImages,
  useProductVariants,
  useRelatedProducts,
} from '@/hooks/useCatalog';
import { useCartStore } from '@/store/cartStore';
import type { ProductRead, ProductVariantRead } from '@/types/api';

type DetailTab = 'description' | 'specs' | 'reviews';

const stripHtml = (html: string) => html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

const resolveVariantUnitPrice = (product: ProductRead, v: ProductVariantRead) => {
  const o = v.price_override;
  if (o != null && String(o) !== '' && Number(o) > 0) return Number(o);
  return product.price;
};

const ProductDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<DetailTab>('description');
  const addItem = useCartStore((s) => s.addItem);

  const { data: product, isLoading, isError } = useProductBySlug(slug);
  const { data: images } = useProductImages(product?.id);
  const { data: related } = useRelatedProducts(product?.id);
  const { data: variants } = useProductVariants(product?.id);
  const { data: categories } = useCategories();

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
    if (!activeVariant) return product.price;
    return resolveVariantUnitPrice(product, activeVariant);
  }, [product, activeVariant]);

  const effectiveStock = useMemo(() => {
    if (!product) return 0;
    if (variants && variants.length > 0) {
      if (activeVariant) return activeVariant.stock;
      // If variants exist but none selected, sum their stocks to see if ANY is available
      return variants.reduce((sum, v) => sum + (v.stock || 0), 0);
    }
    return product.stock || 0;
  }, [product, variants, activeVariant]);

  const primarySku = activeVariant?.sku ?? variants?.[0]?.sku ?? '—';

  const stockState = useMemo(() => {
    if (!product) return 'out' as const;
    if (effectiveStock <= 0) return 'out' as const;
    // If there are variants and user hasn't selected one, we don't know the exact stock yet, but we know it's > 0 (handled above)
    if (variants && variants.length > 0 && !activeVariant) return 'in' as const;
    if (effectiveStock <= 5) return 'low' as const;
    return 'in' as const;
  }, [product, effectiveStock, variants, activeVariant]);

  const maxQty = product ? Math.min(99, Math.max(1, effectiveStock)) : 1;

  const descriptionExcerpt = useMemo(() => {
    if (!product?.description) return '';
    const plain = stripHtml(product.description);
    return plain.length > 240 ? `${plain.slice(0, 240)}…` : plain;
  }, [product?.description]);

  const safeDescriptionHtml = useMemo(() => {
    if (!product?.description) return '';
    try {
      const parsed = marked.parse(product.description, { async: false }) as string;
      return DOMPurify.sanitize(parsed, { USE_PROFILES: { html: true } });
    } catch (e) {
      return DOMPurify.sanitize(product.description, { USE_PROFILES: { html: true } });
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
      toast.error('Vui lòng chọn một phân loại hàng trước khi thêm vào giỏ.');
      return;
    }
    addItem(product, quantity, activeVariant?.id, effectivePrice);
    toast.custom(
      (toastId) => (
        <div
          className={`pointer-events-auto flex max-w-sm items-center gap-3 rounded-xl border border-emerald-100 bg-white px-4 py-3 shadow-lg ring-1 ring-emerald-100 transition-all duration-300 ${
            toastId.visible ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'
          }`}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <Check size={22} strokeWidth={2.5} />
          </div>
          <div>
            <p className="font-semibold text-slate-900">{t('productDetail.toastAddedTitle')}</p>
            <p className="text-sm text-slate-500">
              {t('productDetail.toastAddedDesc', { name: product.name, qty: quantity })}
            </p>
          </div>
        </div>
      ),
      { duration: 3200 }
    );
  };

  const handleBuyNow = () => {
    if (!product || stockState === 'out') return;
    if (variants && variants.length > 0 && !activeVariant) {
      toast.error('Vui lòng chọn một phân loại hàng trước khi mua.');
      return;
    }
    addItem(product, quantity, activeVariant?.id, effectivePrice);
    navigate('/checkout');
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 bg-slate-50/80">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
        <p className="text-sm font-medium text-slate-500">{t('productDetail.loading')}</p>
      </div>
    );
  }

  if (isError || !product) {
    return <Navigate to="/" replace />;
  }

  const fallbackImage =
    product.cover_image_url || 'https://via.placeholder.com/900x900.png?text=Armorify';
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
    `relative flex-1 whitespace-nowrap rounded-xl px-4 py-3 text-sm font-bold transition-all sm:text-base ${
      activeTab === tab
        ? 'bg-primary text-white shadow-md shadow-primary/25'
        : 'text-slate-600 hover:bg-slate-100'
    }`;

  return (
    <div className="bg-gradient-to-b from-slate-50 to-white pb-20">
      <SeoHead
        title={product.seo_title || product.name}
        description={product.seo_description || t('productDetail.descriptionEmpty')}
      />

      <div className="border-b border-slate-200/80 bg-white/90 backdrop-blur-sm">
        <div className="container mx-auto max-w-7xl px-4 py-3">
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

      <div className="container mx-auto max-w-7xl px-4 pt-8 lg:pt-12">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-14 lg:items-start">
          <div className="lg:sticky lg:top-24">
            <ProductImageGallery images={imagesArray} productName={product.name} />
          </div>

          <div>
            {onSale && (
              <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl bg-gradient-to-r from-rose-600 to-orange-500 px-4 py-2.5 text-sm font-bold text-white shadow-md">
                <Sparkles className="h-4 w-4 shrink-0" />
                <span>{t('productDetail.badgeSale')}</span>
                <span className="rounded-full bg-white/20 px-3 py-0.5 text-xs font-black tracking-wide">
                  −{salePercent}%
                </span>
              </div>
            )}

            <div className="mb-3 flex flex-wrap items-center gap-2">
              {product.is_new && (
                <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-sky-800">
                  {t('productDetail.badgeNew')}
                </span>
              )}
              {product.is_featured && (
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-amber-900">
                  {t('productDetail.badgeFeatured')}
                </span>
              )}
            </div>

            <h1 className="text-2xl font-black leading-tight text-slate-900 sm:text-3xl lg:text-4xl">
              {product.name}
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-600">
              {product.brand && (
                <>
                  <span>
                    {t('productDetail.brand')}:{' '}
                    <Link
                      to={`/brand/${product.brand.slug}`}
                      className="font-bold text-primary hover:underline"
                    >
                      {product.brand.name}
                    </Link>
                  </span>
                  <span className="hidden text-slate-300 sm:inline">|</span>
                </>
              )}
              <span>
                {t('productDetail.sku')}: <strong className="text-slate-900">{primarySku}</strong>
              </span>
              {product.brand?.country_of_origin && (
                <>
                  <span className="hidden text-slate-300 sm:inline">|</span>
                  <span>
                    {t('productDetail.origin')}:{' '}
                    <strong className="text-slate-900">{product.brand.country_of_origin}</strong>
                  </span>
                </>
              )}
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-4 border-b border-slate-100 pb-5">
              <div className="flex items-center gap-2">
                <StarRating value={Number(product.rating_avg) || 0} readOnly size="lg" />
                <span className="text-sm font-semibold text-slate-800">
                  {product.rating_avg ?? '—'}
                </span>
                <span className="text-sm text-slate-400">
                  ({t('productDetail.ratingReviews', { count: product.rating_count || 0 })})
                </span>
              </div>
              <span className="text-slate-200">|</span>
              <span
                className={`inline-flex items-center gap-1.5 text-sm font-semibold ${
                  stockState === 'in'
                    ? 'text-emerald-600'
                    : stockState === 'low'
                      ? 'text-amber-600'
                      : 'text-rose-600'
                }`}
              >
                <Check size={16} className="shrink-0" />
                {stockState === 'in' && t('productDetail.stockInStock')}
                {stockState === 'low' && t('productDetail.stockLow')}
                {stockState === 'out' && t('productDetail.stockOut')}
              </span>
            </div>

            <div className="mt-6">
              <div className="flex flex-wrap items-end gap-3">
                <span className="text-4xl font-black tracking-tight text-rose-600 sm:text-5xl">
                  {formatMoney(effectivePrice)}
                </span>
                {onSale && (
                  <span className="mb-1 text-xl text-slate-400 line-through">
                    {formatMoney(Number(product.compare_at_price))}
                  </span>
                )}
              </div>
              {activeVariant && effectivePrice !== product.price && (
                <p className="mt-2 text-xs font-medium text-slate-500">
                  {t('productDetail.retailPrice')}:{' '}
                  <span className="text-slate-600">{formatMoney(product.price)}</span>
                </p>
              )}
              {product.dealer_price != null && Number(product.dealer_price) > 0 && (
                <p className="mt-2 text-sm text-slate-700">
                  <span className="font-bold text-primary">{t('productDetail.dealerPrice')}:</span>{' '}
                  <span className="font-semibold tabular-nums">{formatMoney(Number(product.dealer_price))}</span>
                  <span className="ml-2 text-xs text-slate-500">{t('productDetail.dealerHint')}</span>
                </p>
              )}
            </div>

            {variants && variants.length > 0 && product && (
              <div className="mt-6">
                <p className="mb-2 text-sm font-bold text-slate-800">{t('productDetail.chooseOption')}</p>
                <div className="flex flex-wrap gap-2">
                  {variants.map((v) => {
                    const unit = resolveVariantUnitPrice(product, v);
                    const selected = activeVariant?.id === v.id;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => {
                          setSelectedVariantId(v.id);
                          setQuantity(1);
                        }}
                        className={`min-w-[140px] rounded-xl border px-3 py-2.5 text-left text-sm transition ${
                          selected
                            ? 'border-primary bg-primary/10 ring-2 ring-primary/30'
                            : 'border-slate-200 bg-white hover:border-primary/40'
                        }`}
                      >
                        <div className="font-semibold text-slate-900 flex items-center gap-1.5 flex-wrap">
                          {v.size && <span>{v.size}</span>}
                          {v.size && v.color && <span className="text-slate-300">·</span>}
                          {v.color && (
                            v.color.startsWith('#') || v.color.match(/^(rgba?|hsl)/) ? (
                              <div className="flex items-center gap-1.5">
                                <div className="w-3.5 h-3.5 rounded-full border border-slate-200 shadow-sm" style={{ backgroundColor: v.color }} title={v.color} />
                              </div>
                            ) : (
                              <span>{v.color}</span>
                            )
                          )}
                          {!v.size && !v.color && <span>{v.sku}</span>}
                        </div>
                        <div className="text-xs font-medium text-slate-600 tabular-nums mt-0.5">{formatMoney(unit)}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {descriptionExcerpt && (
              <p className="mt-5 text-sm leading-relaxed text-slate-600 sm:text-base">{descriptionExcerpt}</p>
            )}

            <div className="mt-8 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-5 flex flex-wrap items-center gap-4">
                <span className="text-sm font-bold text-slate-800">{t('productDetail.quantity')}</span>
                <div className="inline-flex items-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-inner">
                  <button
                    type="button"
                    disabled={stockState === 'out'}
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="px-4 py-2.5 text-lg font-bold text-slate-700 transition hover:bg-white disabled:opacity-40"
                  >
                    −
                  </button>
                  <span className="min-w-[3rem] select-none text-center text-lg font-black text-slate-900 tabular-nums">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    disabled={stockState === 'out' || quantity >= maxQty}
                    onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
                    className="px-4 py-2.5 text-lg font-bold text-slate-700 transition hover:bg-white disabled:opacity-40"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  disabled={stockState === 'out'}
                  onClick={handleAddToCart}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-primary bg-white py-4 text-sm font-bold text-primary shadow-sm transition hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ShoppingCart size={20} />
                  {t('productDetail.addToCart')}
                </button>
                <button
                  type="button"
                  disabled={stockState === 'out'}
                  onClick={handleBuyNow}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-4 text-sm font-bold uppercase tracking-wide text-white shadow-lg shadow-primary/25 transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {t('productDetail.buyNow')}
                </button>
              </div>
            </div>

            <div className="mt-10">
              <h2 className="mb-4 text-sm font-black uppercase tracking-widest text-slate-500">
                {t('productDetail.policiesTitle')}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { icon: BadgeCheck, text: t('productDetail.policyAuthentic') },
                  { icon: Truck, text: t('productDetail.policyShipping') },
                  { icon: Undo2, text: t('productDetail.policyReturns') },
                  { icon: Headphones, text: t('productDetail.policySupport') },
                ].map(({ icon: Icon, text }, i) => (
                  <div
                    key={i}
                    className="flex gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition hover:border-primary/25 hover:shadow-md"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon size={22} />
                    </div>
                    <p className="text-sm font-medium leading-snug text-slate-600">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs — product info / specs / reviews */}
        <section className="mt-16 lg:mt-20">
          <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm">
            <div className="flex flex-wrap gap-2 border-b border-slate-100 bg-slate-50/80 p-2 sm:p-3">
              <button type="button" className={tabClass('description')} onClick={() => setActiveTab('description')}>
                {t('productDetail.tabDescription')}
              </button>
              <button type="button" className={tabClass('specs')} onClick={() => setActiveTab('specs')}>
                {t('productDetail.tabSpecs')}
              </button>
              <button type="button" className={tabClass('reviews')} onClick={() => setActiveTab('reviews')}>
                {t('productDetail.tabReviews')}
              </button>
            </div>

            <div className="p-5 sm:p-8 lg:p-10">
              {activeTab === 'description' && (
                <div className="prose prose-slate max-w-none prose-headings:font-bold prose-a:text-primary">
                  {safeDescriptionHtml ? (
                    <div dangerouslySetInnerHTML={{ __html: safeDescriptionHtml }} />
                  ) : (
                    <p className="text-slate-500">{t('productDetail.descriptionEmpty')}</p>
                  )}
                </div>
              )}

              {activeTab === 'specs' && (
                <div>
                  <h3 className="mb-4 text-lg font-bold text-slate-900">{t('productDetail.specsTitle')}</h3>
                  <ProductSpecifications specifications={product.specifications} />
                </div>
              )}

              {activeTab === 'reviews' && (
                <ReviewSection
                  productId={product.id}
                  ratingAvg={product.rating_avg}
                  ratingCount={product.rating_count || 0}
                />
              )}
            </div>
          </div>
        </section>

        {related && related.length > 0 && (
          <section className="mt-16 lg:mt-20">
            <h2 className="mb-6 text-xl font-black text-slate-900 sm:text-2xl">{t('productDetail.relatedTitle')}</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;
