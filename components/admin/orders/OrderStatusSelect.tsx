/**
 * Order Status Select Component
 * 
 * Reusable component để chuyển trạng thái đơn hàng
 * - Chỉ hiển thị các status hợp lệ (từ state machine)
 * - Auto-save khi chọn status mới
 * - Loading state và error handling
 * - Mobile-friendly
 */

'use client';

import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import {
  getValidNextStatuses,
  getStatusLabel,
  getStatusColor,
  type OrderStatus,
} from '@/lib/utils/orderStateMachine';
import { useToastContext } from '@/components/providers/ToastProvider';
import { useInvalidateDashboard } from '@/lib/hooks/useInvalidateDashboard';

interface OrderStatusSelectProps {
  orderId: string;
  orderNumber?: string;
  currentStatus: OrderStatus;
  onStatusChange?: () => void; // Callback sau khi update thành công
  disabled?: boolean;
  className?: string;
}

export function OrderStatusSelect({
  orderId,
  orderNumber,
  currentStatus,
  onStatusChange,
  disabled = false,
  className = '',
}: OrderStatusSelectProps) {
  const { showToast } = useToastContext();
  const { invalidateDashboard } = useInvalidateDashboard();
  const [loading, setLoading] = useState(false);
  const [localStatus, setLocalStatus] = useState<OrderStatus>(currentStatus);

  // Get valid next statuses from state machine
  const validNextStatuses = getValidNextStatuses(localStatus);

  const handleStatusChange = async (newStatus: OrderStatus) => {
    // Don't update if same status
    if (newStatus === localStatus) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Required for admin API
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        showToast(
          error.message || error.error || 'Có lỗi xảy ra khi cập nhật trạng thái',
          'error'
        );
        // Revert to current status on error
        setLocalStatus(currentStatus);
        return;
      }

      // Update local state
      setLocalStatus(newStatus);

      // Show success message
      const statusLabel = getStatusLabel(newStatus);
      showToast(`Đã cập nhật trạng thái đơn hàng ${orderNumber || orderId} thành "${statusLabel}"`, 'success');

      // Invalidate dashboard cache to reflect updated order stats
      invalidateDashboard();

      // Call callback to refresh data
      if (onStatusChange) {
        onStatusChange();
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      showToast('Có lỗi xảy ra khi cập nhật trạng thái', 'error');
      // Revert to current status on error
      setLocalStatus(currentStatus);
    } finally {
      setLoading(false);
    }
  };

  // If no valid transitions, show read-only badge
  if (validNextStatuses.length === 0) {
    return (
      <span
        className={`px-2 py-1 rounded text-xs inline-block ${getStatusColor(localStatus)} ${className}`}
      >
        {getStatusLabel(localStatus)}
      </span>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <Select
        value={localStatus}
        onValueChange={(value) => handleStatusChange(value as OrderStatus)}
        disabled={disabled || loading}
      >
        <SelectTrigger
          className={`min-h-[44px] ${loading ? 'opacity-50' : ''} ${className}`}
          aria-label="Thay đổi trạng thái đơn hàng"
        >
          <SelectValue>
            {loading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="hidden sm:inline">Đang cập nhật...</span>
              </div>
            ) : (
              <span className={`px-2 py-1 rounded text-xs ${getStatusColor(localStatus)}`}>
                {getStatusLabel(localStatus)}
              </span>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {/* Show current status as first option (no-op) */}
          <SelectItem value={localStatus}>
            {getStatusLabel(localStatus)} (Giữ nguyên)
          </SelectItem>
          {/* Show valid next statuses */}
          {validNextStatuses.map((status) => (
            <SelectItem key={status} value={status}>
              {getStatusLabel(status)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

