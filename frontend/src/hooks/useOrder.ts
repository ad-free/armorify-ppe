// src/hooks/useOrder.ts
import { useQuery } from '@tanstack/react-query';
import { trackOrder, getMyOrders } from '@/api/order';

export const useTrackOrder = (order_code: string, contact_phone: string, enabled = false) => {
  return useQuery({
    queryKey: ['track-order', order_code, contact_phone],
    queryFn: () => trackOrder(order_code, contact_phone),
    enabled
  });
};

export const useMyOrders = () => {
  return useQuery({
    queryKey: ['my-orders'],
    queryFn: () => getMyOrders()
  });
};
