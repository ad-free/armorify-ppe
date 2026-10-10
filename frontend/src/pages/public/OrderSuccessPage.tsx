import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { SeoHead } from '@/components/common/SeoHead';
import { FeedbackState } from '@/components/ui/Primitives';
import { MoneyValue, QuoteTotals } from '@/components/order/QuoteReview';
import { TrackOrderForm } from '@/components/order/TrackOrderForm';
import { readConfirmedOrder } from '@/components/order/checkoutRecovery';
import { normalizeSpecs } from '@/components/catalog/productFacts';
import { orderStatusLabel } from '@/lib/orderStatus';
import { useCartStore } from '@/store/cartStore';

export default function OrderSuccessPage() {
  const [order] = useState(() => {
    try { return readConfirmedOrder(window.sessionStorage); }
    catch { return null; }
  });
  const retainedCart = useCartStore((state) => state.items.length > 0);
  if (!order) return <main className="container py-8"><SeoHead title="Thông tin đơn hàng | Armorify" /><h1 className="page-heading mb-6">Thông tin đơn hàng</h1><FeedbackState title="Chưa có đơn hàng được xác nhận" description="Trang này chỉ hiển thị đơn đã được máy chủ ghi nhận trong phiên trình duyệt. Không có đơn mới nào được tạo khi bạn mở trang."><Link to="/cart" className="btn btn-primary">Về giỏ hàng</Link><Link to="/contact" className="btn btn-secondary">Liên hệ hỗ trợ</Link></FeedbackState></main>;
  return <main className="container max-w-4xl py-6 md:py-8">
    <SeoHead title="Đã ghi nhận đơn hàng | Armorify" />
    <header className="mb-6 space-y-3">
      <p className="font-bold text-primary">Armorify · Thông tin đơn hàng</p>
      <CheckCircle className="text-success" size={40} aria-hidden="true" />
      <h1 className="page-heading">Đơn hàng đã được ghi nhận</h1>
      <p className="text-body">Máy chủ đã tiếp nhận đơn hàng. Tình trạng bên dưới là thông tin đã lưu; tra cứu để kiểm tra cập nhật mới nhất.</p>
      <p className="break-all font-semibold">Mã đơn hàng: {order.order_code}</p>
      <p className="text-caption">Ngày đặt: {new Date(order.created_at).toLocaleString('vi-VN')}</p>
    </header>
    {retainedCart && <div role="status" className="card mb-6 space-y-3 border-warning p-4">
      <p>Giỏ hàng có những thay đổi được giữ lại. Kiểm tra các sản phẩm đã đặt trước khi đặt tiếp để tránh đặt lặp.</p>
      <Link to="/cart" reloadDocument className="btn btn-secondary">Kiểm tra giỏ hàng</Link>
    </div>}
    <div className="grid gap-6 md:grid-cols-2">
      <section className="card space-y-3 p-4 sm:p-6" aria-labelledby="success-contact">
        <h2 id="success-contact" className="section-heading">Thông tin giao hàng</h2>
        <dl className="space-y-2 break-words text-sm">
          <div><dt className="text-muted-foreground">Người nhận</dt><dd className="font-semibold">{order.customer_name}</dd></div>
          <div><dt className="text-muted-foreground">Điện thoại</dt><dd>{order.contact_phone}</dd></div>
          {order.email && <div><dt className="text-muted-foreground">Email</dt><dd>{order.email}</dd></div>}
          <div><dt className="text-muted-foreground">Địa chỉ</dt><dd>{[order.address, order.ward, order.district, order.province].filter(Boolean).join(', ')}</dd></div>
          {order.delivery_note && <div><dt className="text-muted-foreground">Ghi chú</dt><dd className="whitespace-pre-wrap">{order.delivery_note}</dd></div>}
          <div><dt className="text-muted-foreground">Giao hàng</dt><dd>{order.shipping_method === 'standard' ? 'Tiêu chuẩn' : order.shipping_method ?? 'Chưa có thông tin'}</dd></div>
          <div><dt className="text-muted-foreground">Thanh toán</dt><dd>{order.payment_method === 'cod' ? 'Thanh toán khi nhận hàng (COD)' : order.payment_method ?? 'Chưa có thông tin'} · {orderStatusLabel(order.payment_status)}</dd></div>
          <div><dt className="text-muted-foreground">Xử lý đơn</dt><dd>{orderStatusLabel(order.status)}</dd></div>
          <div><dt className="text-muted-foreground">Hoàn tất giao hàng</dt><dd>{orderStatusLabel(order.fulfillment_status)}</dd></div>
        </dl>
      </section>
      <section className="card space-y-4 p-4 sm:p-6" aria-labelledby="success-total">
        <h2 id="success-total" className="section-heading">Tổng tiền đã xác nhận</h2>
        <QuoteTotals quote={{ subtotal: order.subtotal, discount: order.discount, shipping: order.shipping, total: order.total_amount }} />
        {order.payment_method === 'cod' && order.payment_status === 'unpaid' && <p className="text-caption">Thanh toán tổng tiền này khi nhận hàng theo phương thức COD đã chọn.</p>}
      </section>
      <section className="card space-y-4 p-4 md:col-span-2 sm:p-6" aria-labelledby="success-items">
        <h2 id="success-items" className="section-heading">Sản phẩm đã đặt</h2>
        <ul className="divide-y divide-border">{order.items.map((item) => <li key={item.id} className="space-y-1 py-4 first:pt-0 last:pb-0">
          <h3 className="break-words font-semibold">{item.product_name ?? 'Tên sản phẩm chưa được lưu'}</h3>
          <p className="text-caption">SKU: {item.sku ?? 'Không có'}</p>
          {normalizeSpecs(item.attributes).map((row) => <p key={row.label} className="text-caption break-words">{row.label}: {row.value}</p>)}
          <div className="flex flex-wrap justify-between gap-2 text-sm"><span>{item.quantity} × <MoneyValue value={item.unit_price} /></span><strong><MoneyValue value={Number(item.unit_price) * item.quantity} /></strong></div>
        </li>)}</ul>
      </section>
      <section className="card space-y-4 p-4 md:col-span-2 sm:p-6" aria-labelledby="success-next">
        <h2 id="success-next" className="section-heading">Theo dõi đơn hàng</h2>
        <p className="text-body">Giữ mã đơn <strong className="break-all text-foreground">{order.order_code}</strong> và số điện thoại đặt hàng. Bạn có thể tra cứu bên dưới hoặc cung cấp hai thông tin này khi liên hệ hỗ trợ. Thông tin xác nhận được lưu trong phiên trình duyệt để xem lại khi tải lại trang.</p>
        <details className="rounded-md border border-border p-4"><summary className="min-h-11 cursor-pointer font-semibold">Tra cứu tình trạng hiện tại</summary><div className="mt-4"><TrackOrderForm initialValues={{ order_code: order.order_code, contact_phone: order.contact_phone }} /></div></details>
        <div className="flex flex-wrap gap-3"><Link to="/categories" className="btn btn-primary">Tiếp tục mua sắm</Link><Link to="/contact" className="btn btn-secondary">Liên hệ hỗ trợ</Link></div>
      </section>
    </div>
  </main>;
}
