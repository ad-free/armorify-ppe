import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { trackOrderSchema } from '@/lib/schemas';
import { trackOrder } from '@/api/order';
import { Button } from '@/components/ui/Primitives';
import { MoneyValue } from './QuoteReview';
import type { OrderRead } from '@/types/api';
import { orderStatusLabel } from '@/lib/orderStatus';

type TrackOrderValues = z.infer<typeof trackOrderSchema>;

export function TrackOrderForm({ initialValues }: { initialValues?: TrackOrderValues }) {
  const [order, setOrder] = useState<OrderRead | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const { register, handleSubmit, formState: { errors } } = useForm<TrackOrderValues>({ resolver: zodResolver(trackOrderSchema), defaultValues: initialValues });
  const onSubmit = async (values: TrackOrderValues) => {
    if (loading) return;
    setLoading(true);
    setOrder(null);
    setMessage('');
    try {
      setOrder(await trackOrder(values.order_code, values.contact_phone));
    } catch {
      setMessage('Không thể tra cứu đơn hàng. Kiểm tra mã đơn và số điện thoại rồi thử lại.');
    } finally {
      setLoading(false);
    }
  };
  return <div className="space-y-4">
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <p className="text-caption">Nhập mã đơn và số điện thoại đã đặt hàng để kiểm tra tình trạng hiện tại.</p>
      <div><label htmlFor="track-code" className="field-label">Mã đơn hàng</label><input id="track-code" {...register('order_code')} className="field" autoComplete="off" aria-invalid={!!errors.order_code} aria-describedby={errors.order_code ? 'track-code-error' : undefined} />{errors.order_code && <p id="track-code-error" className="field-error">{errors.order_code.message}</p>}</div>
      <div><label htmlFor="track-phone" className="field-label">Số điện thoại đặt hàng</label><input id="track-phone" {...register('contact_phone')} className="field" type="tel" autoComplete="tel" aria-invalid={!!errors.contact_phone} aria-describedby={errors.contact_phone ? 'track-phone-error' : undefined} />{errors.contact_phone && <p id="track-phone-error" className="field-error">{errors.contact_phone.message}</p>}</div>
      {message && <p role="alert" className="field-error">{message}</p>}
      <Button type="submit" loading={loading}>Tra cứu đơn hàng</Button>
    </form>
    {order && <div role="status" className="rounded-md border border-border bg-muted p-4 text-sm"><p className="font-semibold break-all">{order.order_code}</p><p>Tình trạng đơn: {orderStatusLabel(order.status)}</p><p>Thanh toán: {orderStatusLabel(order.payment_status)}</p><p>Giao hàng: {orderStatusLabel(order.fulfillment_status)}</p><p>Tổng tiền: <MoneyValue value={order.total_amount} /></p><p>Ngày đặt: {new Date(order.created_at).toLocaleString('vi-VN')}</p></div>}
  </div>;
}
