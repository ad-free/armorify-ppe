// src/components/order/TrackOrderForm.tsx
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { trackOrderSchema } from '@/lib/schemas';
import { trackOrder } from '@/api/order';
import type { OrderRead } from '@/types/api';

type TrackOrderFormValues = z.infer<typeof trackOrderSchema>;

export const TrackOrderForm: React.FC = () => {
  const [order, setOrder] = useState<OrderRead | null>(null);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<TrackOrderFormValues>({
    resolver: zodResolver(trackOrderSchema)
  });

  const onSubmit = async (values: TrackOrderFormValues) => {
    setLoading(true);
    setOrder(null);
    try {
      const data = await trackOrder(values.order_code, values.contact_phone);
      setOrder(data);
    } catch {
      toast.error('Không tìm thấy đơn hàng. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-6 bg-white border rounded-lg shadow-sm">
        <h2 className="text-2xl font-bold mb-2">Theo dõi đơn hàng</h2>
        <p className="text-gray-500 text-sm mb-6">Nhập mã đơn hàng và số điện thoại của bạn để kiểm tra trạng thái vận chuyển.</p>
        
        <div>
          <label className="block text-sm font-medium mb-1">Mã đơn hàng</label>
          <input
            {...register('order_code')}
            className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-primary/50 outline-none uppercase"
            placeholder="VD: ODR-A1B2C3D4E5F6"
          />
          {errors.order_code && <p className="text-red-500 text-xs mt-1">{errors.order_code.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Số điện thoại đặt hàng</label>
          <input
            {...register('contact_phone')}
            className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-primary/50 outline-none"
            placeholder="0987654321"
          />
          {errors.contact_phone && <p className="text-red-500 text-xs mt-1">{errors.contact_phone.message}</p>}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-primary-foreground py-2 mt-2 rounded-md font-bold hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {loading ? 'Đang tra cứu...' : 'TRA CỨU'}
        </button>
      </form>

      {order && (
        <div className="mt-8 p-6 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="text-lg font-bold text-green-800 mb-4">Thông tin đơn hàng</h3>
          <div className="space-y-2 text-sm text-green-900">
            <p><span className="font-semibold">Mã ĐH:</span> {order.order_code}</p>
            <p><span className="font-semibold">Tình trạng:</span> <span className="uppercase badge bg-green-200 px-2 py-0.5 rounded">{order.status}</span></p>
            <p><span className="font-semibold">Tổng tiền:</span> {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(order.total_amount))}</p>
            <p><span className="font-semibold">Ngày đặt:</span> {new Date(order.created_at).toLocaleString('vi-VN')}</p>
          </div>
        </div>
      )}
    </div>
  );
};
