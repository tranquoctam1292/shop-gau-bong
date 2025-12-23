'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToastContext } from '@/components/providers/ToastProvider';

interface BulkUpdateStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (value: number, operation: 'set' | 'add' | 'subtract') => Promise<void>;
  selectedCount: number;
}

export function BulkUpdateStockModal({
  isOpen,
  onClose,
  onConfirm,
  selectedCount,
}: BulkUpdateStockModalProps) {
  const { showToast } = useToastContext();
  const [operation, setOperation] = useState<'set' | 'add' | 'subtract'>('set');
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (!value || value.trim() === '') {
      setError('Vui lòng nhập số lượng');
      return;
    }

    const numValue = parseInt(value, 10);
    if (isNaN(numValue) || numValue < 0) {
      setError('Số lượng phải là số nguyên >= 0');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      await onConfirm(numValue, operation);
      const operationLabels = {
        set: 'Đặt thành',
        add: 'Thêm vào',
        subtract: 'Trừ đi',
      };
      showToast(
        `Đã cập nhật kho cho ${selectedCount} sản phẩm: ${operationLabels[operation]} ${numValue}`,
        'success'
      );
      setValue('');
      setOperation('set');
      onClose();
    } catch (error: any) {
      console.error('Error bulk updating stock:', error);
      showToast(error?.message || 'Có lỗi xảy ra khi cập nhật kho', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getOperationLabel = () => {
    switch (operation) {
      case 'set':
        return 'Đặt thành';
      case 'add':
        return 'Thêm vào';
      case 'subtract':
        return 'Trừ đi';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Cập nhật kho hàng loạt</DialogTitle>
          <DialogDescription>
            Cập nhật số lượng kho cho {selectedCount} sản phẩm đã chọn
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="bulk-stock-operation">Thao tác</Label>
            <Select
              value={operation}
              onValueChange={(value) => setOperation(value as 'set' | 'add' | 'subtract')}
            >
              <SelectTrigger id="bulk-stock-operation">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="set">Đặt thành (Set to value)</SelectItem>
                <SelectItem value="add">Thêm vào (Add value)</SelectItem>
                <SelectItem value="subtract">Trừ đi (Subtract value)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bulk-stock-value">Số lượng</Label>
            <Input
              id="bulk-stock-value"
              type="number"
              placeholder="Nhập số lượng..."
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setError(null);
              }}
              min="0"
            />
            {error && (
              <p className="text-xs text-red-500">{error}</p>
            )}
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>{selectedCount}</strong> sản phẩm sẽ được cập nhật: <strong>{getOperationLabel()}</strong> {value || '0'} đơn vị.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Hủy
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={loading || !value || !!error}
            className="min-h-[44px]"
          >
            {loading ? 'Đang xử lý...' : 'Cập nhật'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

