// src/api/order.ts
import { ApiError, GET, POST } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import type { CartQuote, CheckoutCreate, CheckoutItem, OrderRead } from '@/types/api';

export const quoteCart = (items: CheckoutItem[]) =>
  POST<CartQuote>('/orders/quote', { items });

export const createCheckoutOrder = (body: CheckoutCreate, endpoint: '/orders/guest' | '/orders', ownerId: string | null) => {
  const auth = useAuthStore.getState();
  const currentOwner = auth.accessToken ? auth.user?.id : null;
  if (currentOwner !== ownerId) {
    return Promise.reject(new ApiError(401, [{ type: 'checkout_owner_changed' }]));
  }
  // Recover explicitly after reauthentication; never refresh/replay under another session.
  return POST<OrderRead>(endpoint, body, { _retry: true });
};

export const trackOrder = (order_code: string, contact_phone: string) =>
  GET<OrderRead>('/orders/track', { params: { order_code, contact_phone } });

export const getMyOrders = () =>
  GET<OrderRead[]>('/orders/');
