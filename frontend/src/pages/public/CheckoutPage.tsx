import { SeoHead } from '@/components/common/SeoHead';
import { CheckoutForm } from '@/components/order/CheckoutForm';

export default function CheckoutPage() {
  return <main className="container py-6 md:py-8">
    <SeoHead title="Đặt hàng | Armorify" />
    <header className="mb-6 md:mb-8">
      <p className="mb-3 font-bold text-primary">Armorify · Đặt hàng</p>
      <h1 className="page-heading">Hoàn tất đơn hàng</h1>
      <p className="text-body mt-2">Điền thông tin giao hàng và kiểm tra tổng tiền trước khi xác nhận.</p>
    </header>
    <CheckoutForm />
  </main>;
}
