/**
 * Order State Machine Utility
 * 
 * Manages order status transitions according to business rules.
 * Ensures data integrity by validating all status changes.
 * 
 * Valid Statuses:
 * - pending: Đơn mới tạo, chưa thanh toán (hoặc COD)
 * - awaiting_payment: Dành cho thanh toán Online. Đang chờ callback từ cổng thanh toán
 * - confirmed: Đã thanh toán hoặc Admin xác nhận COD hợp lệ
 * - processing: Kho đang nhặt hàng, đóng gói
 * - shipping: Đã bàn giao cho đơn vị vận chuyển
 * - completed: Khách đã nhận hàng và đối soát thành công
 * - cancelled: Hủy bởi khách hoặc Admin
 * - refunded: Đã trả lại tiền cho khách
 * - failed: Giao hàng thất bại hoặc thanh toán lỗi
 */

export type OrderStatus =
  | 'pending'
  | 'awaiting_payment'
  | 'confirmed'
  | 'processing'
  | 'shipping'
  | 'completed'
  | 'cancelled'
  | 'refunded'
  | 'failed';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

/**
 * Valid status transitions
 * Key: current status
 * Value: array of valid next statuses
 */
const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['confirmed', 'cancelled', 'awaiting_payment'],
  awaiting_payment: ['confirmed', 'failed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['shipping', 'cancelled'],
  shipping: ['completed', 'failed'],
  completed: ['refunded'], // Can only refund completed orders
  cancelled: [], // Terminal state - no transitions allowed
  refunded: [], // Terminal state - no transitions allowed
  failed: ['cancelled', 'refunded'], // Can cancel or refund failed orders
};

/**
 * Check if a status transition is valid
 * 
 * @param fromStatus - Current order status
 * @param toStatus - Desired new status
 * @returns true if transition is valid, false otherwise
 */
export function canTransition(
  fromStatus: OrderStatus,
  toStatus: OrderStatus
): boolean {
  // Same status is always valid (no-op)
  if (fromStatus === toStatus) {
    return true;
  }

  const validNextStatuses = VALID_TRANSITIONS[fromStatus] || [];
  return validNextStatuses.includes(toStatus);
}

/**
 * Get all valid next statuses for a given current status
 * 
 * @param currentStatus - Current order status
 * @returns Array of valid next statuses
 */
export function getValidNextStatuses(
  currentStatus: OrderStatus
): OrderStatus[] {
  return VALID_TRANSITIONS[currentStatus] || [];
}

/**
 * Validate a status transition
 * Throws error if transition is invalid
 * 
 * @param fromStatus - Current order status
 * @param toStatus - Desired new status
 * @throws Error if transition is invalid
 */
export function validateTransition(
  fromStatus: OrderStatus,
  toStatus: OrderStatus
): void {
  if (!canTransition(fromStatus, toStatus)) {
    throw new Error(
      `Invalid status transition: Cannot change from "${fromStatus}" to "${toStatus}". ` +
        `Valid next statuses: ${getValidNextStatuses(fromStatus).join(', ') || 'none (terminal state)'}`
    );
  }
}

/**
 * Check if an order can be cancelled
 * Orders cannot be cancelled once they are shipping or completed
 * 
 * @param currentStatus - Current order status
 * @returns true if order can be cancelled
 */
export function canCancelOrder(currentStatus: OrderStatus): boolean {
  // Cannot cancel if already shipping, completed, cancelled, or refunded
  const nonCancellableStatuses: OrderStatus[] = [
    'shipping',
    'completed',
    'cancelled',
    'refunded',
  ];
  return !nonCancellableStatuses.includes(currentStatus);
}

/**
 * Check if an order can be edited
 * Orders can only be edited when in Pending or Confirmed status
 * 
 * @param currentStatus - Current order status
 * @returns true if order can be edited
 */
export function canEditOrder(currentStatus: OrderStatus): boolean {
  return currentStatus === 'pending' || currentStatus === 'confirmed';
}

/**
 * Get status label in Vietnamese
 * 
 * @param status - Order status
 * @returns Vietnamese label
 */
export function getStatusLabel(status: OrderStatus): string {
  const labels: Record<OrderStatus, string> = {
    pending: 'Chờ xử lý',
    awaiting_payment: 'Chờ thanh toán',
    confirmed: 'Đã xác nhận',
    processing: 'Đang xử lý',
    shipping: 'Đang giao hàng',
    completed: 'Hoàn thành',
    cancelled: 'Đã hủy',
    refunded: 'Đã hoàn tiền',
    failed: 'Thất bại',
  };
  return labels[status] || status;
}

/**
 * Get status color class for UI
 * 
 * @param status - Order status
 * @returns Tailwind CSS color classes
 */
export function getStatusColor(status: OrderStatus): string {
  const colors: Record<OrderStatus, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    awaiting_payment: 'bg-orange-100 text-orange-800',
    confirmed: 'bg-blue-100 text-blue-800',
    processing: 'bg-blue-100 text-blue-800',
    shipping: 'bg-indigo-100 text-indigo-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-gray-100 text-gray-800',
    refunded: 'bg-gray-100 text-gray-800',
    failed: 'bg-red-100 text-red-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

/**
 * Check if status is a terminal state (no further transitions allowed)
 * 
 * @param status - Order status
 * @returns true if status is terminal
 */
export function isTerminalStatus(status: OrderStatus): boolean {
  return status === 'cancelled' || status === 'refunded';
}

