const labels: Record<string, string> = {
  pending: 'Chờ xử lý',
  confirmed: 'Đã xác nhận',
  shipped: 'Đang giao',
  delivered: 'Đã giao',
  cancelled: 'Đã hủy',
  unpaid: 'Chưa thanh toán',
  paid: 'Đã thanh toán',
  unfulfilled: 'Chưa hoàn tất giao hàng',
  processing: 'Đang chuẩn bị hàng',
  unknown: 'Chưa xác định',
};

export function orderStatusLabel(status: string | null | undefined): string {
  return status ? labels[status] ?? status : 'Chưa có thông tin';
}
