import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useCartStore } from '@/store/cartStore';
import { Button } from '@/components/ui/Primitives';
import { formatCurrency } from '@/lib/currency';
import { getMediaUrl } from '@/lib/api';
import { normalizeSpecs } from '@/components/catalog/productFacts';
import type { CartQuote, Money, QuoteItem } from '@/types/api';

export function MoneyValue({ value }: { value: Money | null | undefined }) {
  return <>{value == null ? 'Chưa xác định' : formatCurrency(Number(value))}</>;
}

export function QuoteTotals({ quote }: { quote: { subtotal: Money | null; discount: Money | null; shipping: Money | null; total: Money | null } }) {
  return <dl className="space-y-3 text-sm">
    <div className="flex justify-between gap-4"><dt>Tạm tính</dt><dd><MoneyValue value={quote.subtotal} /></dd></div>
    <div className="flex justify-between gap-4"><dt>Giảm giá sản phẩm</dt><dd>{quote.discount !== null && '−'}<MoneyValue value={quote.discount} /></dd></div>
    <div className="flex justify-between gap-4"><dt>Phí giao hàng</dt><dd><MoneyValue value={quote.shipping} /></dd></div>
    <div className="flex justify-between gap-4 border-t border-border pt-4 text-lg font-bold"><dt>Tổng cộng</dt><dd className="text-primary"><MoneyValue value={quote.total} /></dd></div>
  </dl>;
}

export function PriceChangeNotice() {
  const changes = useCartStore((state) => state.priceChanges);
  const items = useCartStore((state) => state.items);
  const dismiss = useCartStore((state) => state.dismissPriceChanges);
  const entries = items.flatMap((item) => {
    const change = changes[`${item.product.id}:${item.variant_id ?? ''}`];
    return change ? [{ name: item.product.name, key: `${item.product.id}:${item.variant_id ?? ''}`, ...change }] : [];
  });
  if (!entries.length) return null;
  return <div role="status" className="rounded-md border border-warning/30 bg-warning-soft p-4 text-warning">
    <p className="font-semibold">Giá đã thay đổi. Vui lòng kiểm tra giá mới trước khi đặt hàng.</p>
    <ul className="mt-2 space-y-1 text-sm">{entries.map((entry) => <li key={entry.key}>{entry.name}: <MoneyValue value={entry.previous} /> → <MoneyValue value={entry.current} /></li>)}</ul>
    <Button variant="secondary" className="mt-3" onClick={dismiss}>Đã xem giá mới</Button>
  </div>;
}

export function QuoteLine({ line, children }: { line: QuoteItem; children?: ReactNode }) {
  return <article className="card p-4">
    <div className="flex items-start gap-4">
      <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted">
        {line.image_url ? <img src={getMediaUrl(line.image_url)} alt="" width={80} height={80} className="h-full w-full object-contain" /> : <span className="text-caption text-center">Không có ảnh</span>}
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <h3 className="break-words font-semibold">{line.slug ? <Link className="hover:text-primary hover:underline" to={`/products/${line.slug}`}>{line.product_name}</Link> : (line.product_name ?? 'Sản phẩm không khả dụng')}</h3>
        <p className="text-caption">SKU: {line.sku ?? 'Không có'}</p>
        {normalizeSpecs(line.attributes).map((row) => <p key={row.label} className="text-caption break-words">{row.label}: {row.value}</p>)}
        <p className="text-caption">Đơn giá: <MoneyValue value={line.unit_price} /> · Tồn kho: {line.stock}</p>
        <p className="font-semibold">{line.quantity} × sản phẩm · <MoneyValue value={line.line_total} /></p>
      </div>
    </div>
    {line.issue && <p role="alert" className="field-error">{line.issue}</p>}
    {children}
  </article>;
}

export function QuoteStatus({ loading, failed, quote, retry }: { loading: boolean; failed: boolean; quote?: CartQuote; retry: () => void }) {
  if (loading) return <p role="status" className="card p-4 text-muted-foreground">Đang kiểm tra giá và tồn kho…</p>;
  if (failed) return <div role="alert" className="card p-4"><p className="text-destructive">Không thể kiểm tra giỏ hàng. Chưa thể đặt hàng.</p><Button variant="secondary" className="mt-3" onClick={retry}>Kiểm tra lại</Button></div>;
  if (quote && !quote.can_checkout) return <p role="alert" className="rounded-md border border-destructive/30 bg-destructive-soft p-4 text-destructive">{quote.shipping_message ?? 'Giỏ hàng có sản phẩm hoặc số lượng không hợp lệ. Vui lòng điều chỉnh trước khi đặt hàng.'}</p>;
  return null;
}
