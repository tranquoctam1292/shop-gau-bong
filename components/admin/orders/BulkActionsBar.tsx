/**
 * Bulk Actions Bar Component
 * 
 * Displays bulk action buttons when orders are selected:
 * - Bulk approve (Pending -> Confirmed)
 * - Bulk update status
 * - Bulk print shipping labels
 * - Export selected orders
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2, FileDown, Printer, RefreshCw, Loader2 } from 'lucide-react';
import { useToastContext } from '@/components/providers/ToastProvider';

interface BulkActionsBarProps {
  selectedOrders: string[];
  onActionComplete: () => void;
}

export function BulkActionsBar({ selectedOrders, onActionComplete }: BulkActionsBarProps) {
  const { showToast } = useToastContext();
  const [loading, setLoading] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState<string>('__none__');

  const handleBulkApprove = async () => {
    if (selectedOrders.length === 0) return;

    setLoading('approve');
    try {
      const response = await fetch('/api/admin/orders/bulk-approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderIds: selectedOrders }),
      });

      if (!response.ok) {
        const error = await response.json();
        showToast(error.error || 'Có lỗi xảy ra khi xác nhận đơn hàng', 'error');
        return;
      }

      showToast(`Đã xác nhận ${selectedOrders.length} đơn hàng thành công`, 'success');
      onActionComplete();
    } catch (error) {
      console.error('Error bulk approving orders:', error);
      showToast('Có lỗi xảy ra khi xác nhận đơn hàng', 'error');
    } finally {
      setLoading(null);
    }
  };

  const handleBulkUpdateStatus = async () => {
    if (selectedOrders.length === 0 || newStatus === '__none__' || !newStatus) {
      showToast('Vui lòng chọn trạng thái mới', 'error');
      return;
    }

    setLoading('update-status');
    try {
      const response = await fetch('/api/admin/orders/bulk-update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderIds: selectedOrders,
          status: newStatus,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        showToast(error.error || 'Có lỗi xảy ra khi cập nhật trạng thái', 'error');
        return;
      }

      showToast(`Đã cập nhật trạng thái ${selectedOrders.length} đơn hàng thành công`, 'success');
      setNewStatus('__none__');
      onActionComplete();
    } catch (error) {
      console.error('Error bulk updating status:', error);
      showToast('Có lỗi xảy ra khi cập nhật trạng thái', 'error');
    } finally {
      setLoading(null);
    }
  };

  const handleBulkPrintLabels = async () => {
    if (selectedOrders.length === 0) return;

    // Open print window for shipping labels
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showToast('Không thể mở cửa sổ in. Vui lòng kiểm tra popup blocker.', 'error');
      return;
    }

    setLoading('print');
    try {
      const response = await fetch('/api/admin/orders/bulk-print', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderIds: selectedOrders }),
      });

      if (!response.ok) {
        const error = await response.json();
        showToast(error.error || 'Có lỗi xảy ra khi in nhãn vận chuyển', 'error');
        return;
      }

      const html = await response.text();
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.print();
      showToast('Đã mở cửa sổ in', 'success');
    } catch (error) {
      console.error('Error printing labels:', error);
      showToast('Có lỗi xảy ra khi in nhãn vận chuyển', 'error');
    } finally {
      setLoading(null);
    }
  };

  const handleExport = async () => {
    if (selectedOrders.length === 0) return;

    setLoading('export');
    try {
      const params = new URLSearchParams({
        orderIds: selectedOrders.join(','),
      });

      const response = await fetch(`/api/admin/orders/export?${params}`);
      if (!response.ok) {
        const error = await response.json();
        showToast(error.error || 'Có lỗi xảy ra khi xuất đơn hàng', 'error');
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `orders-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      showToast('Đã xuất CSV thành công', 'success');
    } catch (error) {
      console.error('Error exporting orders:', error);
      showToast('Có lỗi xảy ra khi xuất đơn hàng', 'error');
    } finally {
      setLoading(null);
    }
  };

  if (selectedOrders.length === 0) {
    return null;
  }

  return (
    <div className="sticky top-[64px] z-40 bg-background/95 backdrop-blur border-b p-4 mb-4">
      <div className="flex flex-wrap items-center gap-2 md:gap-4">
        <div className="text-sm font-medium min-w-[120px]">
          Đã chọn: <span className="font-bold">{selectedOrders.length}</span> đơn hàng
        </div>

        <div className="flex flex-wrap gap-2 flex-1">
          {/* Bulk Approve */}
          <Button
            onClick={handleBulkApprove}
            disabled={loading !== null}
            variant="default"
            size="sm"
            className="min-h-[44px]"
          >
            {loading === 'approve' ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Xác nhận hàng loạt
              </>
            )}
          </Button>

          {/* Bulk Update Status */}
          <div className="flex gap-2 items-center">
            <Select
              value={newStatus}
              onValueChange={(value) => setNewStatus(value)}
            >
              <SelectTrigger className="min-w-[150px]">
                <SelectValue placeholder="Chọn trạng thái..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Chọn trạng thái...</SelectItem>
                <SelectItem value="confirmed">Đã xác nhận</SelectItem>
                <SelectItem value="processing">Đang xử lý</SelectItem>
                <SelectItem value="shipping">Đang giao hàng</SelectItem>
                <SelectItem value="completed">Hoàn thành</SelectItem>
                <SelectItem value="cancelled">Đã hủy</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={handleBulkUpdateStatus}
              disabled={loading !== null || newStatus === '__none__' || !newStatus}
              variant="outline"
              size="sm"
              className="min-h-[44px]"
            >
              {loading === 'update-status' ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Cập nhật trạng thái
                </>
              )}
            </Button>
          </div>

          {/* Bulk Print Labels */}
          <Button
            onClick={handleBulkPrintLabels}
            disabled={loading !== null}
            variant="outline"
            size="sm"
            className="min-h-[44px]"
          >
            {loading === 'print' ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              <>
                <Printer className="w-4 h-4 mr-2" />
                In nhãn vận chuyển
              </>
            )}
          </Button>

          {/* Export */}
          <Button
            onClick={handleExport}
            disabled={loading !== null}
            variant="outline"
            size="sm"
            className="min-h-[44px]"
          >
            {loading === 'export' ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              <>
                <FileDown className="w-4 h-4 mr-2" />
                Xuất CSV
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

