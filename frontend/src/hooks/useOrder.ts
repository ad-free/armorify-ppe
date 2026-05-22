// src/hooks/useOrder.ts
import { useMutation, useQuery } from '@tanstack/react-query';
import { createGuestOrder, trackOrder, getMyOrders } from '@/api/order';
import type { GuestOrderCreate } from '@/types/api';

export const useCreateGuestOrder = () => {
  return useMutation({
    mutationFn: (body: GuestOrderCreate) => createGuestOrder(body)
  });
};

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
