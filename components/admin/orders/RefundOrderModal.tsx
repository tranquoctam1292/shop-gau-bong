/**
 * Refund Order Modal
 * 
 * Modal để hoàn tiền đơn hàng (partial/full refund)
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';

interface RefundOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (amount: number, reason?: string) => void;
  orderNumber: string;
  maxAmount: number;
}

export function RefundOrderModal({
  isOpen,
  onClose,
  onConfirm,
  orderNumber,
  maxAmount,
}: RefundOrderModalProps) {
  const [isFullRefund, setIsFullRefund] = useState(true);
  const [amount, setAmount] = useState<string>(maxAmount.toString());
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAmountChange = (value: string) => {
    const numValue = parseFloat(value) || 0;
    if (numValue > maxAmount) {
      setAmount(maxAmount.toString());
    } else if (numValue < 0) {
      setAmount('0');
    } else {
      setAmount(value);
    }
  };

  const handleFullRefundToggle = (checked: boolean) => {
    setIsFullRefund(checked);
    if (checked) {
      setAmount(maxAmount.toString());
    }
  };

  const handleConfirm = async () => {
    const refundAmount = isFullRefund ? maxAmount : parseFloat(amount) || 0;

    if (refundAmount <= 0) {
      alert('Số tiền hoàn lại phải lớn hơn 0');
      return;
    }

    if (refundAmount > maxAmount) {
      alert(`Số tiền hoàn lại không được vượt quá ${new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
      }).format(maxAmount)}`);
      return;
    }

    setLoading(true);
    try {
      await onConfirm(refundAmount, reason.trim() || undefined);
      setIsFullRefund(true);
      setAmount(maxAmount.toString());
      setReason('');
    } catch (error) {
      console.error('Error refunding order:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setIsFullRefund(true);
    setAmount(maxAmount.toString());
    setReason('');
    onClose();
  };

  const refundAmount = isFullRefund ? maxAmount : parseFloat(amount) || 0;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Hoàn tiền đơn hàng</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            Đơn hàng: <strong>{orderNumber}</strong>
          </p>

          <div className="space-y-2">
            <Label htmlFor="refund-full">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="refund-full"
                  checked={isFullRefund}
                  onCheckedChange={handleFullRefundToggle}
                />
                <span>Hoàn tiền toàn bộ</span>
              </div>
            </Label>
            <p className="text-xs text-muted-foreground ml-6">
              Tổng tiền đơn hàng:{' '}
              {new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND',
              }).format(maxAmount)}
            </p>
          </div>

          {!isFullRefund && (
            <div className="space-y-2">
              <Label htmlFor="refund-amount">
                Số tiền hoàn lại <span className="text-red-500">*</span>
              </Label>
              <Input
                id="refund-amount"
                type="number"
                min="0"
                max={maxAmount}
                step="1000"
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder="Nhập số tiền hoàn lại..."
              />
              <p className="text-xs text-muted-foreground">
                Tối đa:{' '}
                {new Intl.NumberFormat('vi-VN', {
                  style: 'currency',
                  currency: 'VND',
                }).format(maxAmount)}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="refund-reason">Lý do hoàn tiền (tùy chọn)</Label>
            <Textarea
              id="refund-reason"
              placeholder="Nhập lý do hoàn tiền..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>

          <div className="p-3 bg-muted rounded-lg">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Số tiền sẽ hoàn lại:</span>
              <span className="font-bold text-lg">
                {new Intl.NumberFormat('vi-VN', {
                  style: 'currency',
                  currency: 'VND',
                }).format(refundAmount)}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Hủy
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={loading || refundAmount <= 0}
            className="min-h-[44px]"
          >
            {loading ? 'Đang xử lý...' : 'Xác nhận hoàn tiền'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

