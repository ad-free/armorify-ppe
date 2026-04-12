// src/api/order.ts
import { GET, POST } from '@/lib/api';
import type { 
  GuestOrderCreate, 
  OrderRead 
} from '@/types/api';

export const createGuestOrder = (body: GuestOrderCreate) =>
  POST<OrderRead>('/orders/guest', body);

export const trackOrder = (order_code: string, contact_phone: string) =>
  GET<OrderRead>('/orders/track', { params: { order_code, contact_phone } });
