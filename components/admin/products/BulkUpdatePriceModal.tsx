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

interface BulkUpdatePriceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (price: number) => Promise<void>;
  selectedCount: number;
}

export function BulkUpdatePriceModal({
  isOpen,
  onClose,
  onConfirm,
  selectedCount,
}: BulkUpdatePriceModalProps) {
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (!price || price.trim() === '') {
      setError('Vui lòng nhập giá');
      return;
    }

    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice < 0) {
      setError('Giá phải là số >= 0');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      await onConfirm(numPrice);
      setPrice('');
      onClose();
    } catch (error) {
      console.error('Error bulk updating price:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Cập nhật giá hàng loạt</DialogTitle>
          <DialogDescription>
            Cập nhật giá cho {selectedCount} sản phẩm đã chọn
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="bulk-price">Giá mới (VND)</Label>
            <Input
              id="bulk-price"
              type="number"
              placeholder="Nhập giá..."
              value={price}
              onChange={(e) => {
                setPrice(e.target.value);
                setError(null);
              }}
              min="0"
            />
            {error && (
              <p className="text-xs text-red-500">{error}</p>
            )}
            {price && !error && !isNaN(parseFloat(price)) && (
              <p className="text-xs text-gray-500">
                {formatPrice(parseFloat(price))}
              </p>
            )}
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>{selectedCount}</strong> sản phẩm sẽ được cập nhật với giá mới.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Hủy
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={loading || !price || !!error}
            className="min-h-[44px]"
          >
            {loading ? 'Đang xử lý...' : 'Cập nhật'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

