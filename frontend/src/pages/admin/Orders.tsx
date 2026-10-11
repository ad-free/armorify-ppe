import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getAdminOrders } from '@/api/admin/orders';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button, FeedbackState } from '@/components/ui/Primitives';
import { orderStatusLabel } from '@/lib/orderStatus';
import { orderFilters, readOrderParams, updateOrderParams } from './orderWorkflow';
import { MoneyValue, OrderDate, OrderLoading, OrderStatuses } from './OrderShared';

const filterLabels: Record<string, string> = { search: 'Tìm kiếm', status: 'Đơn hàng', payment_status: 'Thanh toán', fulfillment_status: 'Giao hàng', from_date: 'Từ ngày', to_date: 'Đến ngày' };

export default function Orders() {
  const [params, setParams] = useSearchParams();
  const { request, error } = readOrderParams(params);
  const [search, setSearch] = useState(params.get('search') ?? '');
  useEffect(() => { setSearch(params.get('search') ?? ''); }, [params]);
  const query = useQuery({
    queryKey: ['admin-orders', request],
    queryFn: ({ signal }) => getAdminOrders(request, signal),
    enabled: !error, retry: false,
  });
  const change = (changes: Record<string, string | number | null>) => setParams(updateOrderParams(params, changes));
  const filters = Object.keys(filterLabels).filter((field) => params.get(field));
  const page = Number(request.page);
  const pages = Math.max(1, Math.ceil((query.data?.total ?? 0) / Number(request.page_size)));
  const detailSearch = params.toString() ? `?${params.toString()}` : '';

  return <AdminLayout title="Đơn hàng" subtitle="Tiếp nhận, xử lý và theo dõi đơn hàng từ thông tin đã lưu khi đặt hàng.">
    <div className="space-y-6 min-w-0">
      <section className="card space-y-4 p-4 sm:p-6" aria-labelledby="orders-filter-title">
        <h2 id="orders-filter-title" className="section-heading">Tìm và lọc đơn hàng</h2>
        <form role="search" className="flex flex-wrap items-end gap-3" onSubmit={(event) => { event.preventDefault(); change({ search: search.trim() || null }); }}>
          <div className="min-w-0 flex-1 basis-64"><label className="field-label" htmlFor="order-search">Mã đơn, tên khách hoặc số điện thoại</label><input id="order-search" type="search" className="field" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nhập thông tin cần tìm" /></div>
          <Button type="submit">Tìm kiếm</Button>
        </form>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {Object.entries(orderFilters).map(([field, values]) => <div key={field}><label htmlFor={`filter-${field}`} className="field-label">{filterLabels[field]}</label><select id={`filter-${field}`} className="field" value={String(request[field] ?? '')} onChange={(event) => change({ [field]: event.target.value || null })}><option value="">Tất cả</option>{values.map((value) => <option key={value} value={value}>{orderStatusLabel(value)}</option>)}</select></div>)}
          {['from_date', 'to_date'].map((field) => <div key={field}><label htmlFor={`filter-${field}`} className="field-label">{filterLabels[field]}</label><input id={`filter-${field}`} className="field" type="date" value={params.get(field) ?? ''} onChange={(event) => change({ [field]: event.target.value || null })} aria-invalid={Boolean(error)} aria-describedby={error ? 'order-date-error' : undefined} /></div>)}
        </div>
        {error && <p id="order-date-error" className="field-error" role="alert">{error}</p>}
        {filters.length > 0 && <div className="flex flex-wrap gap-2" aria-label="Bộ lọc đang áp dụng">
          {filters.map((field) => <Button key={field} variant="secondary" className="max-w-full text-left [overflow-wrap:anywhere]" onClick={() => change({ [field]: null })} aria-label={`Bỏ bộ lọc ${filterLabels[field]}`}><span className="min-w-0 break-words">{filterLabels[field]}: {field.endsWith('status') ? orderStatusLabel(params.get(field)) : params.get(field)}</span><span aria-hidden="true">×</span></Button>)}
          <Button variant="ghost" onClick={() => change(Object.fromEntries(Object.keys(filterLabels).map((key) => [key, null])))}>Xóa bộ lọc</Button>
        </div>}
      </section>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <p role="status" aria-live="polite" className="font-semibold">{query.data ? `${query.data.total} đơn hàng` : 'Danh sách đơn hàng'}</p>
        <div className="flex flex-wrap gap-3">
          <div><label className="field-label" htmlFor="order-sort">Sắp xếp</label><select id="order-sort" className="field" value={String(request.sort_by)} onChange={(event) => change({ sort_by: event.target.value })}><option value="created_at">Ngày đặt</option><option value="order_code">Mã đơn</option><option value="total_amount">Tổng tiền</option></select></div>
          <div><label className="field-label" htmlFor="order-sort-order">Thứ tự</label><select id="order-sort-order" className="field" value={String(request.sort_order)} onChange={(event) => change({ sort_order: event.target.value })}><option value="desc">Giảm dần</option><option value="asc">Tăng dần</option></select></div>
          <div><label className="field-label" htmlFor="order-page-size">Mỗi trang</label><select id="order-page-size" className="field" value={Number(request.page_size)} onChange={(event) => change({ page_size: event.target.value })}>{[20, 50, 100].map((size) => <option key={size} value={size}>{size} đơn</option>)}</select></div>
        </div>
      </div>
      {!error && query.isPending && <OrderLoading />}
      {!error && query.isError && <FeedbackState variant="error" title="Không tải được đơn hàng" description="Vui lòng kiểm tra kết nối và thử lại."><Button onClick={() => void query.refetch()}>Thử lại</Button></FeedbackState>}
      {!error && query.data && (query.data.items.length ? <>
        <div className="space-y-3 md:hidden">{query.data.items.map((order) => <article key={order.id} className="card space-y-4 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3"><Link className="btn btn-ghost px-0 font-bold text-primary [overflow-wrap:anywhere]" to={`/admin/orders/${encodeURIComponent(order.id)}${detailSearch}`}>{order.order_code}</Link><span className="font-semibold"><MoneyValue value={order.total_amount} /></span></div>
          <div className="break-words"><p>{order.customer_name || 'Khách hàng chưa xác định'}</p><p className="text-caption">{order.contact_phone || 'Số điện thoại chưa xác định'}</p><p className="text-caption"><OrderDate value={order.created_at} /></p></div>
          <OrderStatuses order={order} />
        </article>)}</div>
        <div className="table-shell hidden md:block"><table className="w-full text-left text-sm"><caption className="sr-only">Danh sách đơn hàng và trạng thái</caption><thead className="border-b border-border bg-muted"><tr>{['Đơn hàng', 'Khách hàng', 'Tổng tiền', 'Trạng thái'].map((label) => <th key={label} scope="col" className="p-4">{label}</th>)}</tr></thead><tbody className="divide-y divide-border">{query.data.items.map((order) => <tr key={order.id} className="align-top"><td className="p-4"><Link className="btn btn-ghost px-0 text-primary [overflow-wrap:anywhere]" to={`/admin/orders/${encodeURIComponent(order.id)}${detailSearch}`}>{order.order_code}</Link><p className="text-caption"><OrderDate value={order.created_at} /></p></td><td className="p-4 break-words"><p>{order.customer_name || 'Chưa xác định'}</p><p className="text-caption">{order.contact_phone || 'Chưa xác định'}</p></td><td className="p-4 font-semibold"><MoneyValue value={order.total_amount} /></td><td className="p-4"><OrderStatuses order={order} /></td></tr>)}</tbody></table></div>
      </> : <FeedbackState title={filters.length ? 'Không có đơn phù hợp' : 'Chưa có đơn hàng'} description={filters.length ? 'Thử thay đổi hoặc xóa bộ lọc để xem thêm đơn hàng.' : 'Đơn hàng mới sẽ xuất hiện tại đây.'}>{filters.length > 0 && <Button variant="secondary" onClick={() => change(Object.fromEntries(Object.keys(filterLabels).map((key) => [key, null])))}>Xóa bộ lọc</Button>}</FeedbackState>)}
      {!error && query.data && <nav aria-label="Phân trang đơn hàng" className="flex flex-wrap items-center justify-between gap-3"><p className="text-caption">Trang {page} / {pages} · {query.data.total} đơn hàng</p><div className="flex flex-wrap gap-2"><Button variant="secondary" disabled={page <= 1 || query.isFetching} onClick={() => change({ page: page - 1 })}>Trang trước</Button><Button variant="secondary" disabled={page >= pages || query.isFetching} onClick={() => change({ page: page + 1 })}>Trang sau</Button></div>{page > pages && <Button variant="secondary" onClick={() => change({ page: pages })}>Về trang cuối</Button>}</nav>}
    </div>
  </AdminLayout>;
}
