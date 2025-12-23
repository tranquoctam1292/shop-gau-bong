/**
 * Cancel Order Modal
 * 
 * Modal để hủy đơn hàng với yêu cầu nhập lý do
 */

'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface CancelOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  orderNumber: string;
}

export function CancelOrderModal({
  isOpen,
  onClose,
  onConfirm,
  orderNumber,
}: CancelOrderModalProps) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!reason.trim()) {
      alert('Vui lòng nhập lý do hủy đơn hàng');
      return;
    }

    setLoading(true);
    try {
      onConfirm(reason.trim());
      setReason('');
    } catch (error) {
      console.error('Error cancelling order:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setReason('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Hủy đơn hàng</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            Bạn có chắc chắn muốn hủy đơn hàng <strong>{orderNumber}</strong>?
          </p>

          <div className="space-y-2">
            <Label htmlFor="cancel-reason">
              Lý do hủy đơn <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="cancel-reason"
              placeholder="Nhập lý do hủy đơn hàng..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              className="min-h-[100px]"
            />
            <p className="text-xs text-muted-foreground">
              Lý do hủy đơn sẽ được lưu lại trong lịch sử đơn hàng
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Hủy
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={loading || !reason.trim()}
            className="min-h-[44px]"
          >
            {loading ? 'Đang xử lý...' : 'Xác nhận hủy đơn'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

