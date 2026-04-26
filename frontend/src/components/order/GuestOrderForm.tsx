// src/components/order/GuestOrderForm.tsx
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { guestOrderSchema } from '@/lib/schemas';
import { useCreateGuestOrder } from '@/hooks/useOrder';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { useNavigate } from 'react-router-dom';
import { UserCheck, ShoppingBag, Truck, CreditCard, ChevronRight } from 'lucide-react';

type GuestOrderFormValues = z.infer<typeof guestOrderSchema>;

const fmt = (value: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value);

export const GuestOrderForm: React.FC = () => {
  const { mutate: createOrder, isPending } = useCreateGuestOrder();
  const { items: cartItems, getTotalPrice, clearCart } = useCartStore();
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors }, watch, reset } = useForm<GuestOrderFormValues>({
    resolver: zodResolver(guestOrderSchema),
    defaultValues: { payment_method: 'cod' },
  });

  const paymentMethod = watch('payment_method');

  // Auto-fill form with logged-in user's info
  useEffect(() => {
    if (user) {
      reset({
        fullname: `${user.firstname} ${user.lastname}`.trim(),
        contact_phone: user.phone || '',
        payment_method: 'cod',
      });
    }
  }, [user, reset]);

  const onSubmit = (values: GuestOrderFormValues) => {
    if (cartItems.length === 0) {
      toast.error('Giỏ hàng của bạn đang trống!');
      return;
    }
    const items = cartItems.map(item => ({
      product_id: item.product.id,
      variant_id: item.variant_id || null,
      quantity: item.quantity,
      unit_price: item.unit_price ?? item.product.price,
    }));
    createOrder(
      { 
        contact_phone: values.contact_phone,
        customer_name: values.fullname || null,
        items,
      },
      {
        onSuccess: (data) => {
          toast.success(`Đặt hàng thành công! Mã: ${data.order_code}`);
          clearCart();
          navigate('/order-success', { state: { orderCode: data.order_code } });
        },
        onError: () => toast.error('Có lỗi xảy ra. Vui lòng thử lại sau.'),
      }
    );
  };

  const totalAmount = getTotalPrice();

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col lg:flex-row gap-8 w-full">

      {/* ── LEFT: Delivery info ── */}
      <div className="flex-1 min-w-0 space-y-6">

        {/* Logged-in banner */}
        {user && (
          <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-4">
            <UserCheck size={22} className="text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-emerald-800">Đã đăng nhập: {user.firstname} {user.lastname}</p>
              <p className="text-xs text-emerald-600 mt-0.5">Thông tin đã được điền tự động. Vui lòng bổ sung địa chỉ nhận hàng.</p>
            </div>
          </div>
        )}

        {/* Section: Contact info */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-black text-gray-900 text-base uppercase tracking-widest mb-5 flex items-center gap-2">
            <span className="w-7 h-7 bg-primary text-white rounded-full flex items-center justify-center text-xs font-black">1</span>
            Thông tin liên hệ
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Họ và tên <span className="text-red-500">*</span>
              </label>
              <input
                {...register('fullname')}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all bg-gray-50 focus:bg-white"
                placeholder="Nguyễn Văn A"
              />
              {errors.fullname && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.fullname.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Số điện thoại <span className="text-red-500">*</span>
              </label>
              <input
                {...register('contact_phone')}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all bg-gray-50 focus:bg-white"
                placeholder="0987 654 321"
              />
              {errors.contact_phone && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.contact_phone.message}</p>}
            </div>
          </div>
        </div>

        {/* Section: Delivery address */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-black text-gray-900 text-base uppercase tracking-widest mb-5 flex items-center gap-2">
            <span className="w-7 h-7 bg-primary text-white rounded-full flex items-center justify-center text-xs font-black">2</span>
            <Truck size={16} className="text-primary" />
            Địa chỉ giao hàng
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Địa chỉ đầy đủ <span className="text-red-500">*</span>
              </label>
              <input
                {...register('address')}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all bg-gray-50 focus:bg-white"
                placeholder="Số nhà, Tên đường, Phường/Xã, Quận/Huyện, Tỉnh/TP"
              />
              {errors.address && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.address.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Ghi chú đơn hàng (Tuỳ chọn)
              </label>
              <textarea
                {...register('note')}
                rows={3}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all bg-gray-50 focus:bg-white resize-none"
                placeholder="Giao giờ hành chính, để tại bảo vệ..."
              />
            </div>
          </div>
        </div>

        {/* Section: Payment method */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-black text-gray-900 text-base uppercase tracking-widest mb-5 flex items-center gap-2">
            <span className="w-7 h-7 bg-primary text-white rounded-full flex items-center justify-center text-xs font-black">3</span>
            <CreditCard size={16} className="text-primary" />
            Phương thức thanh toán
          </h2>

          <div className="space-y-3">
            {[
              { value: 'cod', label: 'Thanh toán khi nhận hàng (COD)', desc: 'Thanh toán bằng tiền mặt khi giao hàng tận nơi.', icon: '💵' },
              { value: 'transfer', label: 'Chuyển khoản ngân hàng', desc: 'Chuyển khoản vào tài khoản ngân hàng của chúng tôi trước khi giao.', icon: '🏦' },
            ].map((m) => (
              <label
                key={m.value}
                className={`flex items-center gap-4 p-4 border rounded-xl cursor-pointer transition-all ${
                  paymentMethod === m.value
                    ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                    : 'border-gray-200 hover:border-primary/40 hover:bg-gray-50'
                }`}
              >
                <input type="radio" value={m.value} {...register('payment_method')} className="sr-only" />
                <span className="text-2xl shrink-0">{m.icon}</span>
                <div className="flex-1">
                  <p className="font-bold text-gray-900 text-sm">{m.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{m.desc}</p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                  paymentMethod === m.value ? 'border-primary' : 'border-gray-300'
                }`}>
                  {paymentMethod === m.value && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* ── RIGHT: Order summary (sticky on desktop) ── */}
      <div className="w-full lg:w-[400px] xl:w-[440px] shrink-0">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 lg:sticky lg:top-[100px]">

          <h2 className="font-black text-gray-900 text-base uppercase tracking-widest mb-5 flex items-center gap-2">
            <ShoppingBag size={18} className="text-primary" />
            Tóm tắt đơn hàng
            <span className="ml-auto text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-bold">
              {cartItems.length} sp
            </span>
          </h2>

          {/* Items list — scrollable if too many */}
          <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent mb-5">
            {cartItems.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">Giỏ hàng trống</p>
            ) : (
              cartItems.map((item, idx) => (
                <div key={idx} className="flex gap-3">
                  <div className="w-14 h-14 rounded-xl bg-gray-100 border border-gray-200 overflow-hidden shrink-0">
                    <img
                      src={item.product.cover_image_url || 'https://via.placeholder.com/56'}
                      alt={item.product.name}
                      className="w-full h-full object-contain p-1 bg-white"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 leading-snug line-clamp-2">{item.product.name}</p>
                    <p className="text-xs text-gray-500 mt-1">SL: {item.quantity}</p>
                  </div>
                  <span className="text-sm font-black text-gray-900 shrink-0">
                    {fmt(item.quantity * (item.unit_price ?? item.product.price))}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Price breakdown */}
          <div className="space-y-2.5 text-sm border-t border-dashed border-gray-200 pt-5">
            <div className="flex justify-between text-gray-600">
              <span>Tạm tính</span>
              <span className="font-semibold">{fmt(totalAmount)}</span>
            </div>
            <div className="flex justify-between text-emerald-600">
              <span>Phí vận chuyển</span>
              <span className="font-semibold">Miễn phí</span>
            </div>
            <div className="flex justify-between text-emerald-600">
              <span>Giảm giá</span>
              <span className="font-semibold">- 0đ</span>
            </div>
          </div>

          <div className="flex items-end justify-between mt-5 pt-5 border-t border-gray-200">
            <span className="text-sm font-bold text-gray-600">Tổng thanh toán</span>
            <span className="text-2xl font-black text-rose-600 tracking-tight">{fmt(totalAmount)}</span>
          </div>
          <p className="text-right text-xs text-gray-400 mt-1">(Đã bao gồm VAT nếu có)</p>

          {/* CTA button */}
          <button
            type="submit"
            disabled={isPending || cartItems.length === 0}
            className="w-full mt-6 bg-primary text-white py-4 rounded-xl font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-primary/90 transition-all active:scale-[0.98] shadow-lg shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
          >
            {isPending ? (
              <><span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />Đang xử lý...</>
            ) : (
              <>XÁC NHẬN ĐẶT HÀNG <ChevronRight size={18} /></>
            )}
          </button>

          <p className="text-center text-xs text-gray-400 mt-4 flex items-center justify-center gap-1.5">
            🔒 Thông tin được mã hoá & bảo mật tuyệt đối
          </p>
        </div>
      </div>

    </form>
  );
};
