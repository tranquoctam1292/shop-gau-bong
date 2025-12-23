/**
 * Order Action Bar Component
 * 
 * Dynamic action buttons based on current order status (State Machine):
 * - "Xác nhận đơn" (Pending -> Confirmed)
 * - "Chuyển sang xử lý" (Confirmed -> Processing)
 * - "Tạo vận đơn" (Processing -> Shipping)
 * - "Hoàn thành" (Shipping -> Completed)
 * - "Hủy đơn" (với modal nhập lý do)
 * - "Hoàn tiền" (với modal nhập số tiền)
 * - Disable buttons nếu transition không hợp lệ
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2,
  Package,
  Truck,
  XCircle,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import {
  getValidNextStatuses,
  getStatusLabel,
  type OrderStatus,
} from '@/lib/utils/orderStateMachine';
import { CancelOrderModal } from './CancelOrderModal';
import { RefundOrderModal } from './RefundOrderModal';
import { useToastContext } from '@/components/providers/ToastProvider';

interface OrderActionBarProps {
  orderId: string;
  orderNumber?: string; // For display in modals
  currentStatus: OrderStatus;
  paymentStatus: string;
  grandTotal: number;
  onStatusChange: () => void; // Callback to refresh order data
  onCreateShipment?: () => void; // Callback to create shipment
}

export function OrderActionBar({
  orderId,
  orderNumber,
  currentStatus,
  paymentStatus,
  grandTotal,
  onStatusChange,
  onCreateShipment,
}: OrderActionBarProps) {
  const { showToast } = useToastContext();
  const [loading, setLoading] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);

  const validNextStatuses = getValidNextStatuses(currentStatus);

  const handleStatusChange = async (newStatus: OrderStatus, metadata?: any) => {
    setLoading(newStatus);
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          ...metadata,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        showToast(error.error || 'Có lỗi xảy ra khi cập nhật trạng thái đơn hàng', 'error');
        return;
      }

      const statusLabels: Record<OrderStatus, string> = {
        pending: 'Đã xác nhận đơn hàng',
        awaiting_payment: 'Đã cập nhật trạng thái đơn hàng',
        confirmed: 'Đã chuyển sang xử lý',
        processing: 'Đã tạo vận đơn',
        shipping: 'Đã hoàn thành đơn hàng',
        completed: 'Đã hoàn thành đơn hàng',
        cancelled: 'Đã hủy đơn hàng',
        refunded: 'Đã hoàn tiền',
        failed: 'Đã cập nhật trạng thái đơn hàng',
      };

      showToast(statusLabels[newStatus] || 'Đã cập nhật trạng thái đơn hàng', 'success');

      // Refresh order data
      onStatusChange();
    } catch (error) {
      console.error('Error updating order status:', error);
      showToast('Có lỗi xảy ra khi cập nhật trạng thái đơn hàng', 'error');
    } finally {
      setLoading(null);
    }
  };

  const handleConfirm = () => {
    handleStatusChange('confirmed');
  };

  const handleProcess = () => {
    handleStatusChange('processing');
  };

  const handleShip = () => {
    handleStatusChange('shipping');
  };

  const handleComplete = () => {
    handleStatusChange('completed');
  };

  const handleCancel = (reason: string) => {
    handleStatusChange('cancelled', { cancelledReason: reason });
    setShowCancelModal(false);
  };

  const handleRefund = async (amount: number, reason?: string) => {
    setLoading('refund');
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          reason,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        showToast(error.error || error.message || 'Có lỗi xảy ra khi hoàn tiền', 'error');
        return;
      }

      showToast(`Đã hoàn tiền ${amount.toLocaleString('vi-VN')} đ thành công`, 'success');

      // Refresh order data
      onStatusChange();
      setShowRefundModal(false);
    } catch (error) {
      console.error('Error processing refund:', error);
      showToast('Có lỗi xảy ra khi hoàn tiền', 'error');
    } finally {
      setLoading(null);
    }
  };

  // Check if action is available
  const canConfirm = validNextStatuses.includes('confirmed');
  const canProcess = validNextStatuses.includes('processing');
  const canShip = validNextStatuses.includes('shipping');
  const canComplete = validNextStatuses.includes('completed');
  const canCancel = validNextStatuses.includes('cancelled');
  // Refund is available if payment status is 'paid' (regardless of order status)
  const canRefund = paymentStatus === 'paid';

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {/* Confirm Order Button */}
        {canConfirm && (
          <Button
            onClick={handleConfirm}
            disabled={loading !== null}
            variant="default"
            className="min-h-[44px]"
          >
            {loading === 'confirmed' ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Xác nhận đơn
              </>
            )}
          </Button>
        )}

        {/* Process Order Button */}
        {canProcess && (
          <Button
            onClick={handleProcess}
            disabled={loading !== null}
            variant="default"
            className="min-h-[44px]"
          >
            {loading === 'processing' ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              <>
                <Package className="w-4 h-4 mr-2" />
                Chuyển sang xử lý
              </>
            )}
          </Button>
        )}

        {/* Ship Order Button */}
        {canShip && (
          <Button
            onClick={onCreateShipment || handleShip}
            disabled={loading !== null}
            variant="default"
            className="min-h-[44px]"
          >
            {loading === 'shipping' ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              <>
                <Truck className="w-4 h-4 mr-2" />
                Tạo vận đơn
              </>
            )}
          </Button>
        )}

        {/* Complete Order Button */}
        {canComplete && (
          <Button
            onClick={handleComplete}
            disabled={loading !== null}
            variant="default"
            className="min-h-[44px]"
          >
            {loading === 'completed' ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Hoàn thành
              </>
            )}
          </Button>
        )}

        {/* Cancel Order Button */}
        {canCancel && (
          <Button
            onClick={() => setShowCancelModal(true)}
            disabled={loading !== null}
            variant="destructive"
            className="min-h-[44px]"
          >
            <XCircle className="w-4 h-4 mr-2" />
            Hủy đơn
          </Button>
        )}

        {/* Refund Order Button */}
        {canRefund && (
          <Button
            onClick={() => setShowRefundModal(true)}
            disabled={loading !== null}
            variant="outline"
            className="min-h-[44px]"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Hoàn tiền
          </Button>
        )}

        {/* No actions available */}
        {!canConfirm && !canProcess && !canShip && !canComplete && !canCancel && !canRefund && (
          <div className="text-sm text-muted-foreground py-2">
            Không có thao tác nào khả dụng cho trạng thái &quot;{getStatusLabel(currentStatus)}&quot;
          </div>
        )}
      </div>

      {/* Cancel Order Modal */}
      <CancelOrderModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleCancel}
        orderNumber={orderNumber || orderId}
      />

      {/* Refund Order Modal */}
      <RefundOrderModal
        isOpen={showRefundModal}
        onClose={() => setShowRefundModal(false)}
        onConfirm={handleRefund}
        orderNumber={orderNumber || orderId}
        maxAmount={grandTotal}
      />
    </>
  );
}

