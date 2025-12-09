'use client';

interface OrderStatusBadgeProps {
  status: string;
  className?: string;
}

export function OrderStatusBadge({ status, className = '' }: OrderStatusBadgeProps) {
  const statusLabels: Record<string, string> = {
    PENDING: 'Chờ xử lý',
    PROCESSING: 'Đang xử lý',
    ON_HOLD: 'Tạm giữ',
    COMPLETED: 'Hoàn thành',
    CANCELLED: 'Đã hủy',
    REFUNDED: 'Đã hoàn tiền',
    FAILED: 'Thất bại',
  };

  const statusColors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    PROCESSING: 'bg-blue-100 text-blue-800',
    ON_HOLD: 'bg-orange-100 text-orange-800',
    COMPLETED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800',
    REFUNDED: 'bg-gray-100 text-gray-800',
    FAILED: 'bg-red-100 text-red-800',
  };

  const label = statusLabels[status] || status;
  const color = statusColors[status] || 'bg-gray-100 text-gray-800';

  return (
    <span
      className={`text-xs font-semibold px-2 py-1 rounded-full ${color} ${className}`}
    >
      {label}
    </span>
  );
}

