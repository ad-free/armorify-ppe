import type { ReactNode } from 'react';
import { orderStatusLabel } from '@/lib/orderStatus';
import { MoneyValue } from '@/components/order/QuoteReview';
import { Skeleton } from '@/components/ui/Primitives';
import type { OrderState } from '@/api/admin/orders';
import { formatShipmentEvidence, shipmentFields } from './orderWorkflow';

export function OrderStatuses({ order }: { order: OrderState }) {
  return <dl className="flex flex-wrap gap-3 text-sm">
    {([['Đơn hàng', order.status], ['Thanh toán', order.payment_status], ['Giao hàng', order.fulfillment_status]] as const).map(([label, status]) =>
      <div key={label}><dt className="mb-1 text-caption">{label}</dt><dd className={`badge ${status === 'cancelled' ? 'badge-error' : status === 'paid' || status === 'delivered' ? 'badge-success' : status === 'pending' || status === 'unpaid' ? 'badge-warning' : 'badge-neutral'}`}>{orderStatusLabel(status)}</dd></div>)}
  </dl>;
}

export function OrderDate({ value }: { value: string | null | undefined }) {
  if (!value || !Number.isFinite(new Date(value).getTime())) return <>Chưa xác định</>;
  return <time dateTime={value}>{new Date(value).toLocaleString('vi-VN')}</time>;
}

export function ShipmentEvidence({ previous, next }: { previous: OrderState | null; next: OrderState | null }) {
  return <dl className="mt-2 space-y-2 text-sm">{shipmentFields.map(([field, label]) =>
    <div key={field} className="min-w-0"><dt className="text-caption">{label}</dt>
      <dd className="break-words [overflow-wrap:anywhere]">
        Trước: {formatShipmentEvidence(previous, field)} → Sau: {formatShipmentEvidence(next, field)}
      </dd>
    </div>)}</dl>;
}

export function OrderLoading() {
  return <div className="card space-y-4 p-6" role="status"><p>Đang tải đơn hàng…</p><Skeleton className="h-24" /><Skeleton className="h-40" /></div>;
}

export function SnapshotField({ label, value }: { label: string; value: ReactNode }) {
  return <div className="min-w-0"><dt className="text-caption">{label}</dt><dd className="break-words [overflow-wrap:anywhere]">{value || 'Chưa xác định'}</dd></div>;
}

export { MoneyValue };
