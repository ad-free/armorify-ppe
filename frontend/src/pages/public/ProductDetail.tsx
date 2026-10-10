import React, { useEffect, useMemo, useRef, useState } from 'react';
import DOMPurify from 'dompurify';
import { marked } from 'marked';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Heart, ShoppingCart } from 'lucide-react';
import { authToast } from '@/lib/toast';
import { formatCurrency } from '@/lib/currency';
import { SeoHead } from '@/components/common/SeoHead';
import { Breadcrumb } from '@/components/common/Breadcrumb';
import { StarRating } from '@/components/catalog/StarRating';
import { ProductImageGallery } from '@/components/catalog/ProductImageGallery';
import { ReviewSection } from '@/components/catalog/ReviewSection';
import { ProductCard } from '@/components/catalog/ProductCard';
import { ProductSpecifications } from '@/components/catalog/ProductSpecifications';
import { normalizeSpecs } from '@/components/catalog/productFacts';
import { purchaseState, variantLabel } from '@/components/catalog/productPurchase';
import { Button, FeedbackState, Skeleton } from '@/components/ui/Primitives';
import { useCategories, useProductBySlug, useProductImages, useProductReviews, useProductVariants, useRelatedProducts } from '@/hooks/useCatalog';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import type { ProductRead } from '@/types/api';

// Key the loaded experience by product so navigation never carries a selection to another item.
const ProductDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const query = useProductBySlug(slug);
  const { i18n } = useTranslation();
  const en = i18n.language.startsWith('en');
  if (query.isLoading) return <div className="container py-8" role="status" aria-label={en ? 'Loading product' : 'Đang tải sản phẩm'}><div className="grid gap-8 lg:grid-cols-2"><Skeleton className="aspect-square" /><div className="space-y-4"><Skeleton className="h-10" /><Skeleton className="h-24" /><Skeleton className="h-48" /></div></div></div>;
  if (query.isError || !query.data) {
    const missing = query.error instanceof Error && query.error.message === 'Product not found';
    return <div className="container py-8"><FeedbackState variant={missing ? 'empty' : 'error'} title={missing ? (en ? 'Product not found' : 'Không tìm thấy sản phẩm') : (en ? 'Unable to load product' : 'Không thể tải sản phẩm')} description={en ? 'Browse the catalog or try again.' : 'Bạn có thể xem danh mục hoặc thử lại.'}>
      {!missing && <Button onClick={() => void query.refetch()}>{en ? 'Try again' : 'Thử lại'}</Button>}<Link to="/categories" className="btn btn-secondary">{en ? 'Browse products' : 'Xem sản phẩm'}</Link>
    </FeedbackState></div>;
  }
  return <ProductExperience key={query.data.id} product={query.data} refreshProduct={() => void query.refetch()} />;
};

function ProductExperience({ product, refreshProduct }: { product: ProductRead; refreshProduct: () => void }) {
  const { i18n } = useTranslation();
  const en = i18n.language.startsWith('en');
  const text = (vi: string, english: string) => en ? english : vi;
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState('1');
  const [selectedId, setSelectedId] = useState('');
  const [now, setNow] = useState(Date.now);
  const purchaseRef = useRef<HTMLDivElement>(null);
  const [showMobileAction, setShowMobileAction] = useState(false);
  const variants = useProductVariants(product.id);
  const images = useProductImages(product.id);
  const reviews = useProductReviews(product.id, 0, 10);
  const related = useRelatedProducts(product.id);
  const categories = useCategories();
  const cart = useCartStore();
  const wishlist = useWishlistStore();
  const category = categories.data?.find((item) => item.id === product.category_id);
  const selected = variants.data?.find((item) => item.id === selectedId);
  const cartQuantity = cart.items.filter((item) => item.product.id === product.id && item.variant_id === selected?.id).reduce((total, item) => total + item.quantity, 0);
  const state = purchaseState(product, variants.isError ? undefined : variants.data, selectedId, Number(quantity), cartQuantity, now);
  const fmt = (value: number) => formatCurrency(value, { locale: en ? 'en-US' : 'vi-VN' });
  const rows = normalizeSpecs(product.specifications);
  const normalizedKey = (label: string) => label.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
  const standards = rows.filter((row) => /^(tieu chuan|chung nhan|standard|standards|certification|certifications)$/.test(normalizedKey(row.label)));
  const unit = rows.find((row) => /^(don vi|don vi tinh|unit|price unit|sales unit|unit of measure)$/.test(normalizedKey(row.label)))?.value;
  const distribution = reviews.data?.extra?.distribution as Record<string, unknown> | undefined;
  const reviewCount = reviews.isError ? 0 : reviews.data?.total ?? 0;
  const entries = Object.entries(distribution ?? {});
  const distributionValid = entries.length > 0 && entries.every(([star, count]) => /^[1-5]$/.test(star) && typeof count === 'number' && Number.isInteger(count) && count >= 0) && entries.reduce((sum, [, count]) => sum + Number(count), 0) === reviewCount;
  const rating = distributionValid && reviewCount > 0 ? entries.reduce((sum, [star, count]) => sum + Number(star) * Number(count), 0) / reviewCount : product.rating_count === reviewCount ? Number(product.rating_avg) : NaN;
  const showRating = !reviews.isError && !!reviews.data?.items.length && reviewCount > 0 && Number.isFinite(rating) && rating >= 1 && rating <= 5;
  const description = useMemo(() => product.description ? DOMPurify.sanitize(marked.parse(product.description, { async: false }) as string, { ADD_TAGS: ['iframe'], ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling'], USE_PROFILES: { html: true } }) : '', [product.description]);
  const imageList = images.data?.length ? images.data : product.cover_image_url ? [{ id: 'cover', product_id: product.id, url: product.cover_image_url, alt_text: product.name, position: 0, is_active: true, created_at: '', updated_at: '' }] : [];
  const relatedProducts = related.data?.filter((item) => item.id !== product.id && item.is_active) ?? [];

  useEffect(() => {
    setQuantity('1');
  }, [selectedId]);
  useEffect(() => {
    const end = Date.parse(product.flash_deal_end ?? '');
    if (!Number.isFinite(end) || end <= Date.now()) return;
    const timer = window.setTimeout(() => { setNow(Date.now()); refreshProduct(); }, Math.min(end - Date.now(), 2_147_483_647));
    return () => window.clearTimeout(timer);
  }, [product.flash_deal_end, refreshProduct, now]);
  useEffect(() => {
    const purchase = purchaseRef.current;
    const footer = document.querySelector('footer');
    if (!purchase) return;
    let purchaseVisible = true;
    let footerVisible = false;
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === purchase) purchaseVisible = entry.isIntersecting;
        if (entry.target === footer) footerVisible = entry.isIntersecting;
      }
      setShowMobileAction(!purchaseVisible && !footerVisible);
    });
    observer.observe(purchase);
    if (footer) observer.observe(footer);
    return () => observer.disconnect();
  }, []);

  const status = variants.isError ? text('Không thể kiểm tra lựa chọn. Thử lại trước khi mua.', 'Unable to verify options. Retry before purchasing.')
    : variants.isLoading ? text('Đang kiểm tra lựa chọn và tồn kho…', 'Checking options and stock…')
    : !state.complete ? text('Chọn một phân loại để xem giá, SKU và tồn kho.', 'Select an option to confirm price, SKU and stock.')
    : state.stock <= 0 ? text('Hết hàng. Bạn có thể liên hệ để hỏi về sản phẩm.', 'Out of stock. Contact us to ask about this item.')
    : text(`Còn ${state.stock} · Có thể thêm ${state.remaining}`, `${state.stock} in stock · ${state.remaining} available to add`);
  const addToCart = (buyNow = false) => {
    // Re-read persisted cart at click time so repeated additions cannot exceed this selection's stock.
    const currentQuantity = useCartStore.getState().items.filter((item) => item.product.id === product.id && item.variant_id === state.variant?.id).reduce((sum, item) => sum + item.quantity, 0);
    const current = purchaseState(product, variants.isError ? undefined : variants.data, selectedId, Number(quantity), currentQuantity, Date.now());
    if (!current.canPurchase) return;
    cart.addItem(product, Number(quantity), current.variant?.id, current.price);
    if (buyNow) navigate('/checkout');
    else authToast.success(text('Đã thêm vào giỏ', 'Added to cart'), `${product.name} · ${quantity}`);
  };
  const quoteBody = `${product.name}\n${window.location.href}\n${state.variant ? variantLabel(state.variant) : text('Chưa chọn phân loại', 'Option not selected')}\n${text('Số lượng yêu cầu', 'Requested quantity')}: ${quantity}\n${text('Vui lòng tư vấn và báo giá. Email này chưa tạo đơn hàng.', 'Please advise and quote. This email does not place an order.')}`;
  const email = (subject: string, body: string) => `mailto:info@nbehoangduy.vn?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  const quantityInvalid = state.complete && (!Number.isInteger(Number(quantity)) || Number(quantity) < 1 || Number(quantity) > state.remaining);

  return <div className="min-w-0 break-words bg-background text-foreground pb-28 md:pb-12">
    <SeoHead title={product.seo_title || `${product.name} | NBE Hoang Duy`} description={product.seo_description || undefined} />
    <div className="border-b border-border bg-surface"><div className="container py-4"><Breadcrumb items={[{ label: text('Trang chủ', 'Home'), href: '/' }, { label: category?.name ?? text('Sản phẩm', 'Products'), href: category ? `/categories/${category.slug}` : '/categories' }, { label: product.name }]} /></div></div>
    <div className="container py-6 md:py-8 space-y-8">
      <div className="grid min-w-0 gap-6 lg:grid-cols-2 lg:gap-10 items-start">
        <section aria-label={text('Hình ảnh sản phẩm', 'Product images')} className="min-w-0 space-y-3">
          {images.isLoading ? <Skeleton className="aspect-square" /> : <ProductImageGallery key={product.id} images={imageList} productName={product.name} />}
          {images.isError && <div role="alert" className="text-caption">{text('Không thể tải thư viện ảnh.', 'Unable to load the image gallery.')} <Button variant="ghost" onClick={() => void images.refetch()}>{text('Thử lại', 'Retry')}</Button></div>}
        </section>
        <section className="min-w-0 space-y-5" aria-labelledby="product-name">
          <div className="space-y-3">
            {product.brand ? <Link className="inline-flex min-h-11 items-center text-sm font-semibold text-primary" to={`/brand/${product.brand.slug}`}>{product.brand.name}</Link> : <p className="text-caption">{text('Chưa có thông tin thương hiệu', 'Brand information not supplied')}</p>}
            <h1 id="product-name" className="page-heading">{product.name}</h1>
            <p className="text-caption break-all">SKU: <span className="font-semibold text-foreground">{state.variant?.sku || text('Chưa được cung cấp / chưa chọn', 'Not supplied / not selected')}</span></p>
            {showRating ? <a className="inline-flex min-h-11 items-center gap-2 text-sm" href="#product-reviews"><StarRating value={rating} readOnly size="sm" />{rating.toFixed(1)} · {reviewCount} {text('đánh giá', 'reviews')}</a> : <p className="text-caption">{reviews.isError ? text('Chưa tải được đánh giá', 'Reviews unavailable') : reviews.isLoading ? text('Đang tải đánh giá…', 'Loading reviews…') : reviewCount > 0 ? text(`${reviewCount} đánh giá · chưa có điểm tổng hợp`, `${reviewCount} reviews · aggregate rating unavailable`) : text('Chưa có đánh giá', 'No reviews yet')}</p>}
            <div className="rounded-md border border-border bg-muted p-3 text-sm">
              <p className="font-semibold">{text('Tiêu chuẩn được cung cấp', 'Supplied safety standards')}</p>
              {standards.length ? <ul className="mt-1 space-y-1">{standards.map((row, i) => <li key={i}>{row.label}: {row.value}</li>)}</ul> : <p className="text-muted-foreground">{text('Chưa có thông tin tiêu chuẩn. Liên hệ để xác nhận mức bảo vệ phù hợp.', 'Standards are not supplied. Contact us to confirm suitable protection.')}</p>}
            </div>
          </div>
          <div className="border-y border-border py-4 space-y-1" aria-live="polite">
            <p className="flex flex-wrap items-baseline gap-2"><span className="text-3xl font-bold tracking-tight">{state.priceValid ? fmt(state.price) : text('Chưa có giá hợp lệ', 'Valid price unavailable')}</span>{unit && <span className="text-muted-foreground">/ {unit}</span>}</p>
            {!state.complete && <p className="text-caption">{text('Giá cơ bản; giá cuối cùng phụ thuộc lựa chọn.', 'Base price; final price depends on your selection.')}</p>}
            {!unit && <p className="text-caption">{text('Chưa có thông tin đơn vị tính giá.', 'Price unit not supplied.')}</p>}
            {state.complete && state.priceValid && Number(product.compare_at_price) > state.price && <p className="text-caption line-through">{fmt(Number(product.compare_at_price))}</p>}
          </div>
          <div ref={purchaseRef} id="product-purchase" className="space-y-4 scroll-mt-40">
            {variants.isLoading && <p role="status" className="text-caption">{text('Đang tải phân loại…', 'Loading options…')}</p>}
            {variants.isError && <Button variant="secondary" onClick={() => void variants.refetch()}>{text('Thử lại phân loại', 'Retry options')}</Button>}
            {!!variants.data?.length && <div><label htmlFor="product-variant" className="field-label">{text('Phân loại · kích thước, màu sắc và thuộc tính', 'Option · size, color and attributes')}</label><select id="product-variant" className="field" value={selectedId} onChange={(event) => setSelectedId(event.target.value)} aria-describedby="purchase-status" disabled={variants.isError}>
              <option value="">{text('Chọn phân loại', 'Select an option')}</option>
              {variants.data.map((variant) => <option key={variant.id} value={variant.id} disabled={!variant.is_active || variant.product_id !== product.id || variant.stock <= 0}>{variantLabel(variant)}{variant.stock <= 0 ? text(' · Hết hàng', ' · Out of stock') : ''}</option>)}
            </select><p className="text-caption mt-2">{text('Mỗi lựa chọn là một tổ hợp có thật. Lựa chọn hết hàng bị vô hiệu hóa.', 'Each option is a supplied combination. Out-of-stock options are disabled.')}</p></div>}
            {state.variant && <p className="text-sm [overflow-wrap:anywhere]">{variantLabel(state.variant)}</p>}
            <p id="purchase-status" role="status" className={`text-sm ${state.complete && state.stock > 0 ? 'text-success' : 'text-muted-foreground'}`}>{status}</p>
            <div><label htmlFor="product-quantity" className="field-label">{text('Số lượng', 'Quantity')}</label><div className="flex max-w-56 gap-2">
              <Button variant="secondary" aria-label={text('Giảm số lượng', 'Decrease quantity')} disabled={!state.complete || Number(quantity) <= 1 || !Number.isInteger(Number(quantity))} onClick={() => setQuantity(String(Number(quantity) - 1))}>−</Button>
              <input id="product-quantity" type="number" inputMode="numeric" min={1} max={state.remaining} step={1} className="field text-center" value={quantity} disabled={!state.complete || state.remaining <= 0} onChange={(event) => setQuantity(event.target.value)} aria-invalid={quantityInvalid || undefined} aria-describedby={quantityInvalid ? 'quantity-error' : 'purchase-status'} />
              <Button variant="secondary" aria-label={text('Tăng số lượng', 'Increase quantity')} disabled={!state.complete || Number(quantity) >= state.remaining || !Number.isInteger(Number(quantity))} onClick={() => setQuantity(String(Number(quantity) + 1))}>+</Button>
            </div>{quantityInvalid && <p id="quantity-error" className="field-error">{state.remaining === 0 ? text('Không còn số lượng có thể thêm. Kiểm tra sản phẩm trong giỏ hoặc liên hệ để hỏi tồn kho.', 'No more units can be added. Check your cart or contact us about stock.') : text(`Nhập số nguyên từ 1 đến ${state.remaining}. Tồn kho bao gồm sản phẩm đã có trong giỏ.`, `Enter a whole number from 1 to ${state.remaining}. Stock includes items already in your cart.`)}</p>}</div>
            <div className="grid gap-3 sm:grid-cols-2"><Button disabled={!state.canPurchase} onClick={() => addToCart()}><ShoppingCart size={18} aria-hidden="true" />{text('Thêm vào giỏ', 'Add to cart')}</Button><Button variant="secondary" disabled={!state.canPurchase} onClick={() => addToCart(true)}>{text('Mua ngay', 'Buy now')}</Button></div>
            <a className="btn btn-secondary w-full" href={email(text(`Yêu cầu báo giá: ${product.name}`, `Bulk quote: ${product.name}`), quoteBody)}>{text('Yêu cầu báo giá số lượng lớn qua email', 'Request a bulk quote by email')}</a>
            <p className="text-caption">{text('Mở ứng dụng email để gửi yêu cầu; chưa tạo báo giá hoặc đơn hàng.', 'Opens your email app; no quote or order is created yet.')}</p>
          </div>
          <div className="border-t border-border pt-3"><Button variant="ghost" aria-pressed={wishlist.isInWishlist(product.id)} onClick={() => wishlist.toggleItem(product)}><Heart size={18} aria-hidden="true" fill={wishlist.isInWishlist(product.id) ? 'currentColor' : 'none'} />{text('Lưu sản phẩm', 'Save product')}</Button><nav aria-label={text('Chính sách và hỗ trợ', 'Policies and support')} className="flex flex-wrap gap-x-4"><Link className="inline-flex min-h-11 items-center text-sm text-primary underline" to="/policy/shipping">{text('Vận chuyển', 'Shipping')}</Link><Link className="inline-flex min-h-11 items-center text-sm text-primary underline" to="/policy/returns">{text('Đổi trả', 'Returns')}</Link><a className="inline-flex min-h-11 items-center text-sm text-primary underline" href={email(text(`Tư vấn kỹ thuật: ${product.name}`, `Technical support: ${product.name}`), quoteBody)}>{text('Tư vấn kỹ thuật qua email', 'Technical support by email')}</a></nav></div>
        </section>
      </div>
      <nav className="flex flex-wrap gap-2 border-y border-border py-3" aria-label={text('Nội dung sản phẩm', 'Product sections')}>{[['product-description', text('Mô tả', 'Description')], ['product-specifications', text('Thông số', 'Specifications')], ['product-reviews', text('Đánh giá', 'Reviews')]].map(([id, label]) => <a key={id} href={`#${id}`} className="btn btn-secondary">{label}</a>)}</nav>
      <section id="product-description" className="card p-4 sm:p-6 scroll-mt-40 space-y-4"><h2 className="section-heading">{text('Mô tả sản phẩm', 'Product description')}</h2>{description ? <div className="prose max-w-none text-foreground prose-headings:text-foreground prose-a:text-primary [overflow-wrap:anywhere] [&_table]:block [&_table]:overflow-x-auto [&_img]:max-w-full [&_iframe]:max-w-full" dangerouslySetInnerHTML={{ __html: description }} /> : <p className="text-body">{text('Chưa có mô tả sản phẩm. Liên hệ để được tư vấn trước khi chọn mua.', 'No product description is supplied. Contact us for advice before purchasing.')}</p>}</section>
      <section id="product-specifications" className="card p-4 sm:p-6 scroll-mt-40 space-y-4"><h2 className="section-heading">{text('Thông số kỹ thuật', 'Specifications')}</h2><ProductSpecifications specifications={product.specifications} /></section>
      <div id="product-reviews" className="scroll-mt-40"><ReviewSection key={product.id} productId={product.id} ratingAvg={showRating ? String(rating) : null} ratingCount={reviewCount} /></div>
      <section className="space-y-4" aria-labelledby="related-heading"><h2 id="related-heading" className="section-heading">{text('Sản phẩm liên quan', 'Related products')}</h2><p className="text-caption">{text('Gợi ý từ danh mục; không phải xác nhận tương thích. Liên hệ kỹ thuật để xác nhận trước khi dùng kết hợp.', 'Catalog suggestions, not a compatibility guarantee. Confirm with technical support before combining equipment.')}</p>
        {related.isLoading ? (
          <div role="status" aria-label={text('Đang tải sản phẩm liên quan', 'Loading related products')} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[0, 1, 2, 3].map((id) => <Skeleton key={id} className="h-64" />)}
          </div>
        ) : related.isError ? (
          <FeedbackState variant="error" title={text('Không thể tải sản phẩm liên quan', 'Unable to load related products')}>
            <Button onClick={() => void related.refetch()}>{text('Thử lại', 'Retry')}</Button>
          </FeedbackState>
        ) : relatedProducts.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{relatedProducts.map((item) => <ProductCard key={item.id} product={item} />)}</div>
        ) : <p className="text-body">{text('Chưa có sản phẩm liên quan được cung cấp.', 'No related products are supplied.')}</p>}
      </section>
    </div>
    {showMobileAction && <div className="fixed bottom-0 inset-x-0 z-30 border-t border-border bg-surface px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] md:hidden"><div className="flex items-center gap-3"><p className="min-w-0 flex-1 text-sm font-semibold">{state.priceValid ? fmt(state.price) : text('Chưa có giá', 'Price unavailable')}{unit && <span className="text-caption"> / {unit}</span>}</p><Button onClick={() => { purchaseRef.current?.scrollIntoView({ block: 'center' }); document.getElementById(state.complete ? 'product-quantity' : 'product-variant')?.focus({ preventScroll: true }); }}>{text('Xem lựa chọn mua', 'Purchase options')}</Button></div></div>}
  </div>;
}

export default ProductDetail;
