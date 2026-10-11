import { GET, POST } from '@/lib/api';
import type { Money, OrderRead } from '@/types/api';

export type OrderAction = 'confirm' | 'process' | 'ship' | 'deliver' | 'pay' | 'cancel' | 'tracking' | 'note';
export interface AllowedOrderAction { action: OrderAction; allowed: boolean; reason: string | null }
export interface OrderState {
  status: string | null; payment_status: string | null; fulfillment_status: string | null;
  carrier_name?: string | null; tracking_number?: string | null;
  shipped_at?: string | null; delivered_at?: string | null;
}
export interface OrderEvent {
  id: string; actor_id: string | null; event_type: string;
  previous_state: OrderState | null; new_state: OrderState | null;
  metadata: { note?: string | null; carrier_name?: string | null; tracking_number?: string | null } | null;
  created_at: string;
}
export interface AdminOrderDetail extends OrderRead {
  carrier_name: string | null; tracking_number: string | null;
  shipped_at: string | null; delivered_at: string | null; version: number;
  allowed_actions: AllowedOrderAction[]; events: OrderEvent[];
}
export interface AdminOrderSummary extends OrderState {
  id: string; order_code: string; customer_name: string | null;
  contact_phone: string | null; total_amount: Money; created_at: string;
}
export interface AdminOrderList { items: AdminOrderSummary[]; total: number; page: number; page_size: number }
export interface OrderActionRequest {
  action: OrderAction; expected_version: number;
  carrier_name?: string | null; tracking_number?: string | null; note?: string;
}
export const getAdminOrders = (params: Record<string, string | number>, signal?: AbortSignal) =>
  GET<AdminOrderList>('/admin/orders', { params, signal });
export const getAdminOrder = (id: string, signal?: AbortSignal) =>
  GET<AdminOrderDetail>(`/admin/orders/${encodeURIComponent(id)}`, { signal });
export const actOnAdminOrder = (id: string, request: OrderActionRequest) =>
  POST<AdminOrderDetail>(`/admin/orders/${encodeURIComponent(id)}/actions`, request);
