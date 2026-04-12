// src/components/order/GuestOrderForm.tsx
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { guestOrderSchema } from '@/lib/schemas';
import { useCreateGuestOrder } from '@/hooks/useOrder';

type GuestOrderFormValues = z.infer<typeof guestOrderSchema>;

// Mock items to make the component work for demonstration. In reality, you'd get these from the cart state
const mockCartItems = [
  { product_id: '123e4567-e89b-12d3-a456-426614174000', quantity: 2, unit_price: 150000, name: 'Sản phẩm mẫu 1' }
];

export const GuestOrderForm: React.FC = () => {
  const { mutate: createOrder, isPending } = useCreateGuestOrder();

  const { register, handleSubmit, formState: { errors } } = useForm<GuestOrderFormValues>({
    resolver: zodResolver(guestOrderSchema)
  });

  const onSubmit = (values: GuestOrderFormValues) => {
    // In a real application, you'd map the items from your global cart state (Zustand)
    const items = mockCartItems.map(item => ({
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
    }));

    createOrder(
      { contact_phone: values.contact_phone, items },
      {
        onSuccess: (data) => {
          toast.success(`Đặt hàng thành công! Mã đơn hàng của bạn là: ${data.order_code}`);
          // Clear cart logic would go here
        },
        onError: () => {
          toast.error('Có lỗi xảy ra trong quá trình đặt hàng.');
        }
      }
    );
  };

  const totalAmount = mockCartItems.reduce((acc, item) => acc + (item.quantity * item.unit_price), 0);

  return (
    <div className="w-full max-w-lg mx-auto p-6 bg-white border rounded-lg shadow-sm">
      <h2 className="text-2xl font-bold mb-6">Thông tin giao hàng</h2>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Số điện thoại liên hệ <span className="text-red-500">*</span></label>
          <input
            {...register('contact_phone')}
            className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-primary/50 outline-none"
            placeholder="0987654321"
          />
          {errors.contact_phone && <p className="text-red-500 text-xs mt-1">{errors.contact_phone.message}</p>}
        </div>

        <div className="mt-8 pt-6 border-t border-dashed">
          <h3 className="font-semibold mb-4 text-gray-700">Tóm tắt đơn hàng</h3>
          <ul className="space-y-3 mb-4 text-sm">
            {mockCartItems.map((item, idx) => (
              <li key={idx} className="flex justify-between border-b pb-2">
                <span>{item.quantity} x {item.name}</span>
                <span className="font-medium text-gray-900">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.quantity * item.unit_price)}
                </span>
              </li>
            ))}
          </ul>
          <div className="flex justify-between items-center text-lg font-bold text-primary">
            <span>Tổng cộng:</span>
            <span>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalAmount)}</span>
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-primary text-primary-foreground py-3 mt-4 rounded-md font-bold hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {isPending ? 'Đang xử lý...' : 'XÁC NHẬN ĐẶT HÀNG'}
        </button>
      </form>
    </div>
  );
};
