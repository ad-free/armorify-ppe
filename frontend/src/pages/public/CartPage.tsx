import { useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { SeoHead } from '@/components/common/SeoHead';
import { Breadcrumb } from '@/components/common/Breadcrumb';
import { Button, FeedbackState } from '@/components/ui/Primitives';
import { PriceChangeNotice, QuoteLine, QuoteStatus, QuoteTotals } from '@/components/order/QuoteReview';
import { useCartQuote } from '@/hooks/useCartQuote';
import { useCartStore } from '@/store/cartStore';
import type { QuoteItem } from '@/types/api';

function QuantityControls({ line, disabled }: { line: QuoteItem; disabled: boolean }) {
  const id = useId();
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const [message, setMessage] = useState('');
  const update = (quantity: number) => {
    if (!Number.isInteger(quantity) || quantity < 1 || line.stock < 1) {
      setMessage('Số lượng phải là số nguyên từ 1 đến tồn kho hiện tại.');
      return;
    }
    const bounded = Math.min(quantity, line.stock);
    setMessage(bounded !== quantity ? `Tồn kho chỉ còn ${line.stock}. Số lượng đã được điều chỉnh về ${bounded}.` : '');
    updateQuantity(line.product_id, bounded, line.variant_id ?? undefined);
  };
  return <div className="mt-4 border-t border-border pt-4">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <label htmlFor={id} className="field-label">Số lượng {line.product_name ?? 'sản phẩm'}</label>
        <div className="flex items-center gap-2">
          <Button variant="secondary" className="btn-icon" aria-label={`Giảm số lượng ${line.product_name ?? 'sản phẩm'}`} disabled={disabled || line.quantity <= 1 || line.stock < 1} onClick={() => update(line.quantity - 1)}>−</Button>
          <input id={id} className="field w-20 text-center" type="number" inputMode="numeric" min={1} max={line.stock} step={1} value={line.quantity} disabled={disabled || line.stock < 1} aria-invalid={line.quantity > line.stock || undefined} aria-describedby={`${id}-stock`} onChange={(event) => update(Number(event.target.value))} />
          <Button variant="secondary" className="btn-icon" aria-label={`Tăng số lượng ${line.product_name ?? 'sản phẩm'}`} disabled={disabled || line.quantity >= line.stock} onClick={() => update(line.quantity + 1)}>+</Button>
        </div>
      </div>
      <Button variant="ghost" onClick={() => removeItem(line.product_id, line.variant_id ?? undefined)} aria-label={`Xóa ${line.product_name ?? 'sản phẩm'} khỏi giỏ hàng`}>Xóa sản phẩm</Button>
    </div>
    <p id={`${id}-stock`} className="text-caption mt-2" role={message ? 'status' : undefined}>{message || `Tối đa ${line.stock} sản phẩm theo tồn kho hiện tại.`}</p>
  </div>;
}

export default function CartPage() {
  const items = useCartStore((state) => state.items);
  const remove = useCartStore((state) => state.removeItem);
  const quote = useCartQuote();
  return <div className="container py-6 md:py-8">
    <SeoHead title="Giỏ hàng | Armorify" />
    <Breadcrumb items={[{ label: 'Trang chủ', href: '/' }, { label: 'Giỏ hàng' }]} />
    <header className="mb-6 mt-6"><h1 className="page-heading">Giỏ hàng</h1><p className="text-body mt-2">Giá, ưu đãi và tồn kho được kiểm tra lại trước khi đặt hàng.</p></header>
    {!items.length ? <FeedbackState title="Giỏ hàng đang trống" description="Chọn sản phẩm và phiên bản phù hợp để bắt đầu."><Link to="/categories" className="btn btn-primary">Xem sản phẩm</Link></FeedbackState> : <>
      <div className="mb-4"><PriceChangeNotice /></div>
      <div className="mb-4"><QuoteStatus loading={quote.isFetching || quote.isPending} failed={quote.isError} quote={quote.data} retry={() => void quote.refetch()} /></div>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <section aria-label="Sản phẩm trong giỏ" className="space-y-4">
          <h2 className="sr-only">Sản phẩm trong giỏ</h2>
          {quote.data ? quote.data.items.map((line) => {
            const snapshot = items.find((item) => item.product.id === line.product_id && (item.variant_id ?? null) === (line.variant_id ?? null));
            const stale = !line.product_name && snapshot;
            return <QuoteLine key={`${line.product_id}:${line.variant_id ?? ''}`} line={line}>{stale ? <p role="alert" className="field-error">Dòng này không còn mua được (sản phẩm đã đổi cấu hình, bị ẩn hoặc hết hàng). {snapshot.product.slug ? <Link className="underline" to={`/products/${snapshot.product.slug}`}>Chọn lại phân loại</Link> : null} Bạn có thể xóa dòng này bên dưới.</p> : null}<QuantityControls line={line} disabled={quote.isFetching} /></QuoteLine>;
          }) : items.map((item) => <article key={`${item.product.id}:${item.variant_id ?? ''}`} className="card p-4"><h2 className="font-semibold">Đang chờ kiểm tra sản phẩm</h2><p className="text-caption">Số lượng: {item.quantity} · Chưa có giá và tồn kho mới.</p><Button variant="ghost" className="mt-2" onClick={() => remove(item.product.id, item.variant_id)}>Xóa sản phẩm khỏi giỏ</Button></article>)}
          <Link to="/categories" className="btn btn-secondary">Tiếp tục chọn sản phẩm</Link>
        </section>
        <section className="card space-y-4 p-4 sm:p-6" aria-labelledby="cart-summary">
          <h2 id="cart-summary" className="section-heading">Tóm tắt giỏ hàng</h2>
          {quote.data && <QuoteTotals quote={quote.data} />}
          <p className="text-caption">Giao hàng tiêu chuẩn. Thanh toán khi nhận hàng (COD).</p>
          {quote.canCheckout ? <Link className="btn btn-primary w-full" to="/checkout">Tiến hành đặt hàng</Link> : <Button className="w-full" disabled>Chưa thể đặt hàng</Button>}
          <p className="text-caption">Đơn hàng chỉ được ghi nhận sau khi máy chủ xác nhận.</p>
        </section>
      </div>
    </>}
  </div>;
}
