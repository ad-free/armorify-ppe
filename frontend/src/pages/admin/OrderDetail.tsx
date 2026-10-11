import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { actOnAdminOrder, getAdminOrder } from '@/api/admin/orders';
import type { OrderAction, OrderActionRequest, OrderState } from '@/api/admin/orders';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button, FeedbackState } from '@/components/ui/Primitives';
import { QuoteTotals } from '@/components/order/QuoteReview';
import { orderStatusLabel } from '@/lib/orderStatus';
import { actionImplications, actionLabels, orderActionRequest, orderMutationFailure } from './orderWorkflow';
import type { OrderMutationFailure } from './orderWorkflow';
import { MoneyValue, OrderDate, OrderLoading, OrderStatuses, SnapshotField } from './OrderShared';

const transitions: OrderAction[] = ['confirm', 'process', 'ship', 'deliver', 'pay', 'cancel'];

function AuditState({ state }: { state: OrderState | null }) {
  return <>{state ? [state.status, state.payment_status, state.fulfillment_status].map(orderStatusLabel).join(' · ') : 'Chưa xác định'}</>;
}

export default function OrderDetail() {
  const { orderId = '' } = useParams();
  return <OrderDetailJourney key={orderId} orderId={orderId} />;
}

function OrderDetailJourney({ orderId }: { orderId: string }) {
  const { search } = useLocation();
  const client = useQueryClient();
  const query = useQuery({ queryKey: ['admin-order', orderId], queryFn: ({ signal }) => getAdminOrder(orderId, signal), retry: false, refetchOnWindowFocus: false });
  const order = query.data;
  const [pending, setPending] = useState<OrderActionRequest | null>(null);
  const [saving, setSaving] = useState(false);
  const [failure, setFailure] = useState<OrderMutationFailure | null>(null);
  const [success, setSuccess] = useState('');
  const [note, setNote] = useState('');
  const [carrier, setCarrier] = useState('');
  const [tracking, setTracking] = useState('');
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLElement | null>(null);
  const actionsHeading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (order) { setCarrier(order.carrier_name ?? ''); setTracking(order.tracking_number ?? ''); }
  }, [order]);
  useEffect(() => {
    if (pending && dialog.current && !dialog.current.open) dialog.current.showModal();
    if (!pending && dialog.current?.open) dialog.current.close();
  }, [pending]);

  const submit = async (request: OrderActionRequest) => {
    if (saving || failure?.conflict) return;
    setSaving(true); setFailure(null); setSuccess('');
    try {
      const updated = await actOnAdminOrder(orderId, request);
      client.setQueryData(['admin-order', orderId], updated);
      void client.invalidateQueries({ queryKey: ['admin-orders'] });
      void client.invalidateQueries({ queryKey: ['admin-dashboard'] });
      if (request.action === 'note') setNote('');
      setSuccess(`${actionLabels[request.action]} thành công.`);
      setPending(null);
    } catch (error) {
      const problem = orderMutationFailure(error);
      setFailure(problem);
      if (problem.conflict) setPending(null);
    } finally { setSaving(false); }
  };
  const reload = async () => {
    const result = await query.refetch();
    if (result.isSuccess) { setFailure(null); setPending(null); setSuccess('Đã tải lại đơn hàng. Vui lòng kiểm tra trạng thái và chọn lại thao tác.'); }
  };
  const ask = (action: OrderAction) => {
    if (!order || saving || failure?.conflict) return;
    trigger.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setFailure(null); setSuccess('');
    setPending(orderActionRequest(action, order.version, { carrier_name: carrier, tracking_number: tracking }));
  };
  const permissions = new Map(order?.allowed_actions.map((item) => [item.action, item]));
  const blocked = saving || Boolean(failure?.conflict);
  const events = [...(order?.events ?? [])].sort((a, b) => a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id));

  return <AdminLayout title={order ? `Đơn hàng ${order.order_code}` : 'Chi tiết đơn hàng'} subtitle="Thông tin khách hàng, sản phẩm và giá được lưu tại thời điểm đặt hàng.">
    <div className="space-y-6 min-w-0">
      <Link to={`/admin/orders${search}`} className="btn btn-secondary">← Quay lại danh sách</Link>
      {query.isPending && <OrderLoading />}
      {query.isError && <FeedbackState variant="error" title="Không tải được đơn hàng" description="Đơn hàng có thể không tồn tại hoặc kết nối bị gián đoạn."><Button onClick={() => void query.refetch()}>Thử lại</Button></FeedbackState>}
      {failure && !pending && <div role="alert" className="card space-y-3 border-destructive bg-destructive-soft p-4"><p className="font-semibold">{failure.message}</p>{Object.entries(failure.fields).map(([field, message]) => <p key={field} className="text-sm break-words">{field}: {message}</p>)}{failure.conflict && <Button loading={query.isFetching} onClick={() => void reload()}>Tải lại đơn hàng</Button>}</div>}
      {success && <p role="status" className="rounded-md border border-success/20 bg-success-soft p-4 text-success">{success}</p>}
      {order && <>
        <section className="card p-4 sm:p-6 space-y-4" aria-labelledby="order-summary-title"><div className="flex flex-wrap items-start justify-between gap-4"><div><h2 id="order-summary-title" className="section-heading [overflow-wrap:anywhere]">{order.order_code}</h2><p className="text-caption">Đặt lúc <OrderDate value={order.created_at} /></p></div><p className="text-xl font-bold text-primary"><MoneyValue value={order.total_amount} /></p></div><OrderStatuses order={order} /><p className="text-caption">Phiên bản {order.version}</p></section>
        <div className="grid min-w-0 gap-6 xl:grid-cols-3">
          <div className="min-w-0 space-y-6 xl:col-span-2">
            <section className="card p-4 sm:p-6 space-y-4" aria-labelledby="order-customer-title"><h2 id="order-customer-title" className="section-heading">Khách hàng & giao nhận</h2><dl className="grid gap-4 sm:grid-cols-2">
              <SnapshotField label="Khách hàng" value={order.customer_name} /><SnapshotField label="Số điện thoại" value={order.contact_phone} /><SnapshotField label="Email" value={order.email} /><SnapshotField label="Địa chỉ" value={order.address} /><SnapshotField label="Tỉnh / thành phố" value={order.province} /><SnapshotField label="Quận / huyện" value={order.district} /><SnapshotField label="Phường / xã" value={order.ward} /><SnapshotField label="Phương thức giao hàng" value={order.shipping_method === 'standard' ? 'Giao hàng tiêu chuẩn' : order.shipping_method} /><SnapshotField label="Phương thức thanh toán" value={order.payment_method === 'cod' ? 'Thanh toán khi nhận hàng (COD)' : order.payment_method} />
            </dl><div className="border-t border-border pt-4"><h3 className="font-semibold">Lưu ý giao hàng đã lưu</h3><p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{order.delivery_note || 'Chưa có thông tin'}</p></div><p className="text-caption">Dữ liệu thiếu của đơn cũ được hiển thị là chưa xác định; không thay thế bằng hồ sơ khách hàng hiện tại.</p></section>
            <section className="card p-4 sm:p-6 space-y-4" aria-labelledby="order-items-title"><h2 id="order-items-title" className="section-heading">Sản phẩm đã đặt</h2>{order.items.length ? <ul className="divide-y divide-border">{order.items.map((item) => <li key={item.id} className="min-w-0 py-4 first:pt-0"><div className="flex flex-wrap justify-between gap-3"><div className="min-w-0 flex-1 basis-48"><h3 className="font-semibold break-words [overflow-wrap:anywhere]">{item.product_name || 'Tên sản phẩm chưa xác định'}</h3><p className="text-caption break-words">SKU đã lưu: {item.sku || 'Chưa xác định'}</p>{item.attributes ? Object.entries(item.attributes).map(([key, value]) => <p key={key} className="text-caption break-words [overflow-wrap:anywhere]">{key}: {typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' ? String(value) : 'Chưa xác định'}</p>) : <p className="text-caption">Thuộc tính chưa xác định</p>}</div><div className="text-sm"><p>{item.quantity} × <MoneyValue value={item.unit_price} /></p><p className="font-semibold"><MoneyValue value={item.unit_price == null ? null : Number(item.unit_price) * item.quantity} /></p></div></div></li>)}</ul> : <p className="text-body">Thông tin sản phẩm của đơn cũ chưa xác định.</p>}<div className="border-t border-border pt-4"><QuoteTotals quote={{ subtotal: order.subtotal, discount: order.discount, shipping: order.shipping, total: order.total_amount }} /></div></section>
            <section className="card p-4 sm:p-6 space-y-4" aria-labelledby="order-audit-title"><h2 id="order-audit-title" className="section-heading">Lịch sử đơn hàng</h2><p className="text-caption">Theo thứ tự thời gian từ cũ đến mới. Lịch sử trước khi áp dụng quy trình này có thể không có dữ liệu.</p>{events.length ? <ol className="space-y-4">{events.map((event) => <li key={event.id} className="border-l-2 border-border pl-4 min-w-0"><h3 className="font-semibold break-words">{actionLabels[event.event_type as OrderAction] ?? event.event_type}</h3><p className="text-caption"><OrderDate value={event.created_at} /> · Người thao tác: <span className="[overflow-wrap:anywhere]">{event.actor_id ?? 'Chưa xác định'}</span></p><p className="text-sm break-words">Trước: <AuditState state={event.previous_state} /></p><p className="text-sm break-words">Sau: <AuditState state={event.new_state} /></p>{event.metadata?.note && <p className="mt-2 whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{event.metadata.note}</p>}{event.metadata?.carrier_name && <p className="text-sm break-words [overflow-wrap:anywhere]">Đơn vị vận chuyển: {event.metadata.carrier_name}</p>}{event.metadata?.tracking_number && <p className="text-sm break-words [overflow-wrap:anywhere]">Mã vận đơn: {event.metadata.tracking_number}</p>}</li>)}</ol> : <p className="text-body">Chưa có lịch sử được ghi nhận.</p>}</section>
          </div>
          <div className="min-w-0 space-y-6">
            <section className="card p-4 sm:p-6 space-y-4" aria-labelledby="order-actions-title"><h2 ref={actionsHeading} tabIndex={-1} id="order-actions-title" className="section-heading">Thao tác tiếp theo</h2><p className="text-caption">Chỉ các thao tác được hệ thống cho phép mới có thể thực hiện.</p><ul className="space-y-3">{transitions.map((action) => { const permission = permissions.get(action); return <li key={action}><Button className="w-full" variant={action === 'cancel' ? 'danger' : 'secondary'} disabled={blocked || !permission?.allowed} aria-describedby={!permission?.allowed ? `reason-${action}` : undefined} onClick={() => ask(action)}>{actionLabels[action]}</Button>{!permission?.allowed && <p id={`reason-${action}`} className="text-caption mt-1 break-words">{permission?.reason || 'Không được phép với trạng thái hiện tại hoặc dữ liệu lịch sử chưa xác định.'}</p>}</li>; })}</ul></section>
            <section className="card p-4 sm:p-6 space-y-4" aria-labelledby="order-shipment-title"><h2 id="order-shipment-title" className="section-heading">Vận chuyển</h2><dl className="space-y-3"><SnapshotField label="Bàn giao lúc" value={<OrderDate value={order.shipped_at} />} /><SnapshotField label="Đã giao lúc" value={<OrderDate value={order.delivered_at} />} /></dl><form className="space-y-4" onSubmit={(event) => { event.preventDefault(); if (permissions.get('tracking')?.allowed) void submit(orderActionRequest('tracking', order.version, { carrier_name: carrier, tracking_number: tracking })); }}>
              <div><label htmlFor="order-carrier" className="field-label">Đơn vị vận chuyển</label><input id="order-carrier" className="field" placeholder="Chưa xác định" maxLength={120} value={carrier} onChange={(event) => setCarrier(event.target.value)} disabled={blocked || !permissions.get('tracking')?.allowed} aria-invalid={Boolean(failure?.fields.carrier_name)} aria-describedby={failure?.fields.carrier_name ? 'carrier-error' : undefined} />{failure?.fields.carrier_name && <p id="carrier-error" className="field-error">{failure.fields.carrier_name}</p>}</div>
              <div><label htmlFor="order-tracking" className="field-label">Mã vận đơn</label><input id="order-tracking" className="field" placeholder="Chưa xác định" maxLength={160} value={tracking} onChange={(event) => setTracking(event.target.value)} disabled={blocked || !permissions.get('tracking')?.allowed} aria-invalid={Boolean(failure?.fields.tracking_number)} aria-describedby={failure?.fields.tracking_number ? 'tracking-error' : undefined} />{failure?.fields.tracking_number && <p id="tracking-error" className="field-error">{failure.fields.tracking_number}</p>}</div>
              <Button type="submit" variant="secondary" className="w-full" loading={saving} disabled={blocked || !permissions.get('tracking')?.allowed} aria-describedby="tracking-reason">Lưu thông tin vận chuyển</Button><p id="tracking-reason" className="text-caption">{permissions.get('tracking')?.allowed ? 'Chỉ lưu thông tin nội bộ, không kết nối với đơn vị vận chuyển.' : permissions.get('tracking')?.reason || 'Không thể sửa vận chuyển cho đơn hàng này.'}</p>
            </form></section>
            <section className="card p-4 sm:p-6 space-y-4" aria-labelledby="order-note-title">
              <h2 id="order-note-title" className="section-heading">Ghi chú nội bộ</h2>
              <form className="space-y-3" onSubmit={(event) => {
                event.preventDefault();
                if (note.trim() && permissions.get('note')?.allowed) void submit(orderActionRequest('note', order.version, { note }));
              }}>
                <label htmlFor="order-note" className="field-label">Nội dung ghi chú</label>
                <textarea id="order-note" className="field" value={note} onChange={(event) => setNote(event.target.value)} required maxLength={2000}
                  disabled={blocked || !permissions.get('note')?.allowed} aria-invalid={Boolean(failure?.fields.note)}
                  aria-describedby={failure?.fields.note ? 'note-error' : 'note-hint'} />
                {failure?.fields.note && <p id="note-error" className="field-error">{failure.fields.note}</p>}
                <p id="note-hint" className="text-caption">{permissions.get('note')?.allowed ? 'Ghi chú được lưu vào lịch sử, không thay đổi lưu ý giao hàng của khách.' : permissions.get('note')?.reason || 'Không được phép thêm ghi chú.'}</p>
                <Button type="submit" className="w-full" loading={saving} disabled={blocked || !note.trim() || !permissions.get('note')?.allowed}>Thêm ghi chú</Button>
              </form>
            </section>
          </div>
        </div>
      </>}
      <dialog ref={dialog} className="dialog-panel w-full sm:w-[32rem] max-h-[calc(100dvh-2rem)] overflow-y-auto" aria-labelledby="action-dialog-title" aria-describedby="action-dialog-description" onCancel={(event) => { if (saving) event.preventDefault(); else setPending(null); }} onClose={() => { setPending(null); if (trigger.current?.isConnected && !trigger.current.matches(':disabled')) trigger.current.focus(); else actionsHeading.current?.focus(); }} onKeyDown={(event) => {
        if (event.key !== 'Tab') return;
        const controls = event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled)');
        const first = controls[0]; const last = controls[controls.length - 1];
        if (!first) { event.preventDefault(); event.currentTarget.focus(); }
        else if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }}>
        {pending && <form className="space-y-4" onSubmit={(event) => {
          event.preventDefault();
          void submit(orderActionRequest(pending.action, pending.expected_version, {
            carrier_name: pending.carrier_name ?? '', tracking_number: pending.tracking_number ?? '',
          }));
        }}>
          <h2 id="action-dialog-title" className="section-heading">{actionLabels[pending.action]}?</h2>
          <p className="font-semibold break-words">{order?.order_code}</p>
          <p id="action-dialog-description" className="text-body">{actionImplications[pending.action]}</p>
          {pending.action === 'ship' && <div className="space-y-3">
            <div><label className="field-label" htmlFor="ship-carrier">Đơn vị vận chuyển (tùy chọn)</label>
              <input id="ship-carrier" className="field" maxLength={120} value={pending.carrier_name ?? ''} disabled={saving}
                onChange={(event) => setPending({ ...pending, carrier_name: event.target.value })}
                aria-invalid={Boolean(failure?.fields.carrier_name)} aria-describedby={failure?.fields.carrier_name ? 'ship-carrier-error' : undefined} />
              {failure?.fields.carrier_name && <p className="field-error" id="ship-carrier-error">{failure.fields.carrier_name}</p>}
            </div>
            <div><label className="field-label" htmlFor="ship-tracking">Mã vận đơn (tùy chọn)</label>
              <input id="ship-tracking" className="field" maxLength={160} value={pending.tracking_number ?? ''} disabled={saving}
                onChange={(event) => setPending({ ...pending, tracking_number: event.target.value })}
                aria-invalid={Boolean(failure?.fields.tracking_number)} aria-describedby={failure?.fields.tracking_number ? 'ship-tracking-error' : undefined} />
              {failure?.fields.tracking_number && <p className="field-error" id="ship-tracking-error">{failure.fields.tracking_number}</p>}
            </div>
          </div>}
          <p className="text-caption">Áp dụng cho phiên bản {pending.expected_version}. Vui lòng kiểm tra thông tin trước khi xác nhận.</p>
          {failure && <div role="alert" className="field-error"><p>{failure.message}</p>{Object.entries(failure.fields).map(([field, message]) => <p key={field}>{field}: {message}</p>)}</div>}
          <div className="flex flex-wrap justify-end gap-3">
            <Button autoFocus variant="secondary" disabled={saving} onClick={() => setPending(null)}>Quay lại</Button>
            <Button type="submit" variant={pending.action === 'cancel' ? 'danger' : 'primary'} loading={saving}>Xác nhận {actionLabels[pending.action].toLowerCase()}</Button>
          </div>
        </form>}
      </dialog>
    </div>
  </AdminLayout>;
}
