import type { CartQuote, CheckoutCreate, OrderRead } from '@/types/api';

export const PENDING_CHECKOUT = 'armorify-checkout-pending';
export const CONFIRMED_ORDER = 'armorify-checkout-confirmed';

export interface PendingCheckout {
  payload: CheckoutCreate;
  endpoint: '/orders/guest' | '/orders';
  quote: CartQuote;
  owner_id: string | null;
  cart_revision: string;
}

export type PendingState = { pending: PendingCheckout | null; corrupt: boolean };

/** Never discard an uncertain request when session data is unreadable. */
export function readPendingCheckout(storage: Pick<Storage, 'getItem'>): PendingState {
  try {
    const raw = storage.getItem(PENDING_CHECKOUT);
    if (!raw) return { pending: null, corrupt: false };
    const value = JSON.parse(raw) as PendingCheckout;
    if (!value || !value.payload || !Array.isArray(value.payload.items) || !value.payload.idempotency_key || !value.payload.pricing_token || !value.quote || !Array.isArray(value.quote.items) || !['/orders', '/orders/guest'].includes(value.endpoint) || (value.owner_id !== null && typeof value.owner_id !== 'string') || (value.endpoint === '/orders') !== (typeof value.owner_id === 'string') || typeof value.cart_revision !== 'string') {
      return { pending: null, corrupt: true };
    }
    return { pending: value, corrupt: false };
  } catch {
    return { pending: null, corrupt: true };
  }
}

/** This write must succeed before any POST can start. */
export function persistPendingCheckout(storage: Pick<Storage, 'setItem'>, pending: PendingCheckout): void {
  storage.setItem(PENDING_CHECKOUT, JSON.stringify(pending));
}

export function readConfirmedOrder(storage: Pick<Storage, 'getItem'>): OrderRead | null {
  try {
    const raw = storage.getItem(CONFIRMED_ORDER);
    if (!raw) return null;
    const value = JSON.parse(raw) as OrderRead;
    return value && typeof value.id === 'string' && typeof value.order_code === 'string' && typeof value.contact_phone === 'string' && Array.isArray(value.items) ? value : null;
  } catch {
    return null;
  }
}

/** Only explicit validation/quote rejection means no order was created. */
export function isDefinitiveRejection(status: number, details: unknown): boolean {
  if (status === 422) return true;
  if (!Array.isArray(details) || !details.length) return false;
  return details.every((detail: unknown) => {
    if (!detail || typeof detail !== 'object') return false;
    const type = (detail as Record<string, unknown>).type;
    return (status === 409 && (type === 'stale_pricing' || type === 'checkout_unavailable')) || (status === 503 && type === 'shipping_unavailable');
  });
}

/** Old or incomplete quote data never enables checkout. */
export function canSubmitQuote(quote: CartQuote | undefined, fetching: boolean, failed: boolean): boolean {
  return !!quote && !fetching && !failed && quote.can_checkout && !!quote.pricing_token && quote.shipping !== null && quote.total !== null && quote.items.length > 0 && quote.items.every((item) => !item.issue && Number.isInteger(item.quantity) && item.quantity > 0 && item.quantity <= item.stock && item.unit_price !== null && item.line_total !== null);
}

/** A synchronous lock covers storage and POST, including repeated same-turn submits. */
export async function submitCheckout(
  lock: { current: boolean },
  storage: Pick<Storage, 'setItem' | 'removeItem'>,
  pending: PendingCheckout,
  post: (pending: PendingCheckout) => Promise<OrderRead>,
  clearCart: () => void,
): Promise<OrderRead | null> {
  if (lock.current) return null;
  lock.current = true;
  try {
    persistPendingCheckout(storage, pending);
    const order = await post(pending);
    storage.setItem(CONFIRMED_ORDER, JSON.stringify(order));
    storage.removeItem(PENDING_CHECKOUT);
    clearCart();
    return order;
  } finally {
    lock.current = false;
  }
}
