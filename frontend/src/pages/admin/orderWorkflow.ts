import type { OrderAction, OrderActionRequest } from '@/api/admin/orders';

export const orderFilters = {
  status: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
  payment_status: ['unpaid', 'paid', 'cancelled', 'unknown'],
  fulfillment_status: ['unfulfilled', 'processing', 'shipped', 'delivered', 'cancelled', 'unknown'],
} as const;
export const actionLabels: Record<OrderAction, string> = {
  confirm: 'Xác nhận đơn', process: 'Chuẩn bị hàng', ship: 'Bàn giao vận chuyển',
  deliver: 'Xác nhận đã giao', pay: 'Ghi nhận thanh toán COD', cancel: 'Hủy đơn',
  tracking: 'Lưu vận chuyển', note: 'Thêm ghi chú',
};
export const actionImplications: Record<OrderAction, string> = {
  confirm: 'Xác nhận tiếp nhận đơn hàng và chuyển sang trạng thái đã xác nhận.',
  process: 'Bắt đầu chuẩn bị hàng. Sau bước này không thể hủy đơn qua quy trình này.',
  ship: 'Xác nhận đã bàn giao hàng cho đơn vị vận chuyển. Không tự động đặt dịch vụ vận chuyển.',
  deliver: 'Xác nhận khách đã nhận hàng. Thao tác này không ghi nhận thanh toán.',
  pay: 'Chỉ xác nhận khi đã thực nhận tiền COD. Không thực hiện thu tiền qua cổng thanh toán.',
  cancel: 'Hủy đơn và hoàn lại tồn kho đã giữ. Không thực hiện hoàn tiền; chỉ áp dụng cho đơn chưa thanh toán và chưa chuẩn bị hàng.',
  tracking: 'Lưu thông tin vận chuyển nội bộ. Không tạo yêu cầu vận chuyển.',
  note: 'Ghi chú được lưu trong lịch sử đơn hàng.',
};

export function readOrderParams(params: URLSearchParams) {
  const request: Record<string, string | number> = {};
  const search = params.get('search')?.trim();
  if (search) request.search = search;
  for (const [field, values] of Object.entries(orderFilters)) {
    const value = params.get(field);
    if (value && (values as readonly string[]).includes(value)) request[field] = value;
  }
  let error: string | null = null;
  for (const field of ['from_date', 'to_date']) {
    const value = params.get(field);
    if (!value) continue;
    const parsed = new Date(`${value}T00:00:00Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
      error = 'Ngày lọc không hợp lệ.';
    } else request[field] = value;
  }
  if (request.from_date && request.to_date && String(request.from_date) > String(request.to_date)) error = 'Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.';
  const sort = params.get('sort_by');
  request.sort_by = sort && ['created_at', 'order_code', 'total_amount'].includes(sort) ? sort : 'created_at';
  request.sort_order = params.get('sort_order') === 'asc' ? 'asc' : 'desc';
  const page = Number(params.get('page') ?? 1);
  request.page = Number.isSafeInteger(page) && page > 0 ? page : 1;
  const size = Number(params.get('page_size') ?? 20);
  request.page_size = [20, 50, 100].includes(size) ? size : 20;
  return { request, error };
}

export function updateOrderParams(params: URLSearchParams, changes: Record<string, string | number | null>) {
  const next = new URLSearchParams(params);
  if (!Object.prototype.hasOwnProperty.call(changes, 'page')) next.delete('page');
  for (const [key, value] of Object.entries(changes)) {
    if (value === null || value === '') next.delete(key);
    else next.set(key, String(value));
  }
  return next;
}

export function orderActionRequest(action: OrderAction, version: number, fields: { note?: string; carrier_name?: string; tracking_number?: string } = {}): OrderActionRequest {
  const request: OrderActionRequest = { action, expected_version: version };
  if (action === 'note') request.note = fields.note?.trim() ?? '';
  if (action === 'ship' || action === 'tracking') {
    request.carrier_name = fields.carrier_name?.trim() || null;
    request.tracking_number = fields.tracking_number?.trim() || null;
  }
  return request;
}

export interface OrderMutationFailure { conflict: boolean; message: string; fields: Record<string, string> }

export function orderMutationFailure(error: unknown): OrderMutationFailure {
  const fields: Record<string, string> = {};
  const failure = error as { status?: unknown; details?: unknown } | null;
  const details = failure?.details;
  if (Array.isArray(details)) {
    for (const entry of details) {
      if (!entry || typeof entry !== 'object') continue;
      const field = Array.isArray(entry.loc) ? entry.loc[entry.loc.length - 1] : null;
      if (typeof field === 'string' && typeof entry.msg === 'string') fields[field] = entry.msg;
    }
  } else if (details && typeof details === 'object') {
    const detail = details as Record<string, unknown>;
    if (typeof detail.field === 'string' && typeof detail.message === 'string') fields[detail.field] = detail.message;
  }
  const conflict = failure?.status === 409;
  return { conflict, fields, message: conflict
    ? 'Đơn hàng đã thay đổi hoặc thao tác không còn hợp lệ. Tải lại thông tin và kiểm tra trước khi thao tác lại. Không có thao tác nào được tự động gửi lại.'
    : typeof details === 'string' ? details : 'Không thể lưu thay đổi. Vui lòng kiểm tra thông tin và thử lại.' };
}
