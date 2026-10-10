import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { checkoutSchema } from '@/lib/schemas';
import { ApiError } from '@/lib/api';
import { createCheckoutOrder } from '@/api/order';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { useCartQuote } from '@/hooks/useCartQuote';
import { Button, FeedbackState } from '@/components/ui/Primitives';
import { PriceChangeNotice, QuoteLine, QuoteStatus, QuoteTotals } from './QuoteReview';
import { PENDING_CHECKOUT, isDefinitiveRejection, readPendingCheckout, submitCheckout } from './checkoutRecovery';
import type { PendingCheckout } from './checkoutRecovery';

type CheckoutValues = z.infer<typeof checkoutSchema>;
const labels: Record<keyof CheckoutValues, string> = {
  customer_name: 'Họ và tên', contact_phone: 'Số điện thoại', email: 'Email (không bắt buộc)',
  province: 'Tỉnh / thành phố', district: 'Quận / huyện', ward: 'Phường / xã',
  address: 'Số nhà, tên đường', delivery_note: 'Ghi chú giao hàng (không bắt buộc)',
};

export const CheckoutForm = () => {
  const [recovery] = useState(() => {
    try { return readPendingCheckout(window.sessionStorage); }
    catch { return { pending: null, corrupt: true }; }
  });
  const [pending, setPending] = useState<PendingCheckout | null>(recovery.pending);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const lock = useRef(false);
  const pendingRef = useRef(pending);
  const errorRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const currentOwner = accessToken ? user?.id : null;
  const ownerMatches = pending ? pending.owner_id === currentOwner : currentOwner !== undefined;
  const cartItems = useCartStore((state) => state.items);
  const cartRevision = useCartStore((state) => state.revision);
  const clearCart = useCartStore((state) => state.clearCart);
  const quote = useCartQuote(!pending && !recovery.corrupt);
  const saved = pending?.payload;
  const { register, handleSubmit, setError, clearErrors, formState: { errors } } = useForm<CheckoutValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      customer_name: saved?.customer_name ?? (user ? `${user.lastname} ${user.firstname}`.trim() : ''),
      contact_phone: saved?.contact_phone ?? user?.phone ?? '', email: saved?.email ?? user?.email ?? '',
      province: saved?.province ?? '', district: saved?.district ?? '', ward: saved?.ward ?? '',
      address: saved?.address ?? user?.address ?? '', delivery_note: saved?.delivery_note ?? '',
    },
  });

  const send = async (attempt: PendingCheckout) => {
    if (lock.current || recovery.corrupt) return;
    setBusy(true);
    setMessage('');
    clearErrors();
    setPending(attempt);
    pendingRef.current = attempt;
    let sent = false;
    try {
      const order = await submitCheckout(lock, window.sessionStorage, attempt, (exact) => {
        sent = true;
        return createCheckoutOrder(exact.payload, exact.endpoint, exact.owner_id);
      }, () => clearCart(attempt.cart_revision));
      if (order) navigate('/order-success', { replace: true });
    } catch (error) {
      if (error instanceof ApiError && isDefinitiveRejection(error.status, error.details)) {
        // The server explicitly rejected creation. Only now may a new key be used.
        try {
          window.sessionStorage.removeItem(PENDING_CHECKOUT);
          setPending(null);
          pendingRef.current = null;
        } catch {
          setMessage('Máy chủ đã từ chối đơn nhưng không thể cập nhật phiên lưu. Vui lòng thử kiểm tra lại cùng yêu cầu.');
          window.setTimeout(() => errorRef.current?.focus(), 0);
          return;
        }
        if (Array.isArray(error.details)) {
          for (const detail of error.details as unknown[]) {
            if (!detail || typeof detail !== 'object') continue;
            const entry = detail as { loc?: unknown; type?: unknown };
            if (!Array.isArray(entry.loc)) continue;
            const field = entry.loc[1];
            if (typeof field === 'string' && Object.prototype.hasOwnProperty.call(labels, field)) {
              const key = field as keyof CheckoutValues;
              setError(key, { type: 'server', message: `${labels[key]} chưa hợp lệ. Vui lòng kiểm tra lại.` });
            }
          }
        }
        setMessage('Đơn chưa được tạo. Vui lòng kiểm tra thông tin, giá và tồn kho mới trước khi xác nhận lại.');
        void quote.refetch();
      } else if (error instanceof ApiError && error.status === 401) {
        setMessage(attempt.owner_id === null ? 'Yêu cầu này được gửi khi chưa đăng nhập. Đăng xuất trước khi kiểm tra lại đúng yêu cầu đã gửi.' : 'Đăng nhập lại đúng tài khoản đã gửi yêu cầu trước khi kiểm tra kết quả. Không tạo yêu cầu mới.');
      } else {
        setMessage(sent ? 'Chưa xác định được kết quả đặt hàng. Không tạo yêu cầu mới: hãy kiểm tra lại đúng đơn đã gửi bằng nút bên dưới. Sản phẩm và thông tin đã được giữ nguyên.' : 'Không thể lưu yêu cầu trong phiên trình duyệt nên chưa gửi đơn. Cho phép lưu trữ phiên rồi thử lại đúng yêu cầu này.');
      }
      window.setTimeout(() => errorRef.current?.focus(), 0);
    } finally {
      setBusy(false);
    }
  };

  const onSubmit = (values: CheckoutValues) => {
    if (lock.current || pendingRef.current || !quote.canCheckout || !quote.data?.pricing_token || recovery.corrupt || useCartStore.getState().revision !== cartRevision) return;
    const auth = useAuthStore.getState();
    const ownerId = auth.accessToken ? auth.user?.id : null;
    if (ownerId === undefined) return;
    const attempt: PendingCheckout = {
      endpoint: ownerId === null ? '/orders/guest' : '/orders',
      owner_id: ownerId,
      cart_revision: cartRevision,
      quote: quote.data,
      payload: {
        ...values, email: values.email || null, delivery_note: values.delivery_note || null,
        shipping_method: 'standard', payment_method: 'cod', items: quote.requestItems,
        pricing_token: quote.data.pricing_token, idempotency_key: crypto.randomUUID(),
      },
    };
    void send(attempt);
  };

  const field = (name: keyof CheckoutValues, options: { type?: string; autoComplete?: string; maxLength: number; required?: boolean }) => <div key={name}>
    <label className="field-label" htmlFor={`checkout-${name}`}>{labels[name]}{options.required && <span aria-hidden="true"> *</span>}</label>
    <input id={`checkout-${name}`} {...register(name)} className="field" type={options.type ?? 'text'} autoComplete={options.autoComplete} maxLength={options.maxLength} required={options.required} aria-invalid={!!errors[name]} aria-describedby={errors[name] ? `error-${name}` : undefined} />
    {errors[name] && <p id={`error-${name}`} className="field-error">{errors[name]?.message}</p>}
  </div>;

  if (recovery.corrupt) return <FeedbackState variant="error" title="Không thể khôi phục yêu cầu đặt hàng" description="Để tránh tạo đơn trùng, trang này không gửi một yêu cầu mới. Giữ phiên trình duyệt và liên hệ Armorify với mã đơn nếu đã nhận được xác nhận." />;
  if (!pending && !cartItems.length) return <FeedbackState title="Giỏ hàng đang trống" description="Thêm sản phẩm trước khi đặt hàng."><Link to="/categories" className="btn btn-primary">Xem sản phẩm</Link></FeedbackState>;
  const review = pending?.quote ?? quote.data;
  const frozen = busy || !!pending;
  return <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-4">
    {message && <div ref={errorRef} tabIndex={-1} role="alert" className="rounded-md border border-destructive/30 bg-destructive-soft p-4 text-destructive">{message}</div>}
    {pending && <p role="status" className="rounded-md border border-warning/30 bg-warning-soft p-4 text-warning">Yêu cầu đặt hàng đã được lưu. Thông tin không thể thay đổi cho đến khi biết kết quả. Kiểm tra lại sẽ dùng chính xác mã yêu cầu cũ, không tạo một đơn mới.</p>}
    {!ownerMatches && <div role="alert" className="card space-y-3 border-warning p-4">
      <p>{!pending ? 'Phiên đăng nhập chưa có thông tin tài khoản. Đăng nhập lại trước khi đặt hàng.' : pending.owner_id === null ? 'Đăng xuất để kiểm tra lại yêu cầu khách đã gửi.' : 'Đăng nhập đúng tài khoản đã gửi yêu cầu trước khi tiếp tục.'}</p>
      {pending?.owner_id === null ? <Button variant="secondary" disabled={busy} onClick={() => useAuthStore.getState().logout()}>Đăng xuất để kiểm tra lại</Button> : <Link to="/login" className="btn btn-secondary">Đăng nhập</Link>}
    </div>}
    <PriceChangeNotice />
    {!pending && <QuoteStatus loading={quote.isFetching || quote.isPending} failed={quote.isError} quote={quote.data} retry={() => void quote.refetch()} />}
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
      <div className="space-y-6">
        <fieldset disabled={frozen} className="card min-w-0 p-4 sm:p-6">
          <legend className="px-2 text-xl font-bold">1. Thông tin liên hệ</legend>
          <div className="mt-2 grid gap-4 sm:grid-cols-2">
            {field('customer_name', { autoComplete: 'name', maxLength: 128, required: true })}
            {field('contact_phone', { type: 'tel', autoComplete: 'tel', maxLength: 32, required: true })}
            <div className="sm:col-span-2">{field('email', { type: 'email', autoComplete: 'email', maxLength: 254 })}</div>
          </div>
          <p className="text-caption mt-4">Các trường có dấu * là bắt buộc.</p>
        </fieldset>
        <fieldset disabled={frozen} className="card min-w-0 p-4 sm:p-6">
          <legend className="px-2 text-xl font-bold">2. Địa chỉ giao hàng</legend>
          <div className="mt-2 grid gap-4 sm:grid-cols-2">
            {field('province', { autoComplete: 'address-level1', maxLength: 128, required: true })}
            {field('district', { autoComplete: 'address-level2', maxLength: 128, required: true })}
            {field('ward', { autoComplete: 'address-level3', maxLength: 128, required: true })}
            {field('address', { autoComplete: 'street-address', maxLength: 512, required: true })}
            <div className="sm:col-span-2"><label className="field-label" htmlFor="checkout-delivery_note">{labels.delivery_note}</label><textarea id="checkout-delivery_note" {...register('delivery_note')} className="field" rows={3} maxLength={1000} aria-invalid={!!errors.delivery_note} aria-describedby={errors.delivery_note ? 'error-delivery_note' : undefined} />{errors.delivery_note && <p id="error-delivery_note" className="field-error">{errors.delivery_note.message}</p>}</div>
          </div>
          <label className="mt-4 flex min-h-11 items-center gap-3"><input type="radio" name="shipping_method" value="standard" checked readOnly /><span>Giao hàng tiêu chuẩn · <span className="text-caption">Phí được hiển thị trong phần kiểm tra đơn</span></span></label>
        </fieldset>
        <fieldset disabled={frozen} className="card min-w-0 p-4 sm:p-6">
          <legend className="px-2 text-xl font-bold">3. Thanh toán</legend>
          <div className="mt-2 space-y-4">
            <label className="flex min-h-11 items-center gap-3"><input type="radio" name="payment_method" value="cod" checked readOnly /><span>Thanh toán khi nhận hàng (COD)</span></label>
            <p className="text-caption">Không cần chuyển khoản trước. Việc đặt hàng không có nghĩa là đơn đã thanh toán hoặc đã giao.</p>
          </div>
        </fieldset>
      </div>
      <section aria-labelledby="checkout-review" className="card min-w-0 space-y-4 p-4 sm:p-6">
        <h2 id="checkout-review" className="text-xl font-bold">4. Kiểm tra & đặt hàng</h2>
        {review && <><div className="space-y-3">{review.items.map((line) => <QuoteLine key={`${line.product_id}:${line.variant_id ?? ''}`} line={line} />)}</div><QuoteTotals quote={review} /></>}
        <p className="text-caption">Kiểm tra thông tin và tổng tiền trước khi xác nhận. Máy chủ sẽ kiểm tra lại giá và tồn kho.</p>
        {pending ? <Button className="w-full" loading={busy} disabled={!ownerMatches} onClick={() => void send(pending)}>{busy ? 'Đang kiểm tra kết quả…' : 'Kiểm tra lại đơn đã gửi'}</Button> : <Button type="submit" className="w-full" loading={busy} disabled={!quote.canCheckout || !ownerMatches}>Xác nhận đặt hàng · COD</Button>}
        {!pending && <Link to="/cart" className="btn btn-secondary w-full">Chỉnh sửa giỏ hàng</Link>}
      </section>
    </div>
  </form>;
};
