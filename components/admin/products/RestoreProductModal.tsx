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
import { RotateCcw } from 'lucide-react';
import type { MappedProduct } from '@/lib/utils/productMapper';

interface RestoreProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  product: MappedProduct | null;
}

export function RestoreProductModal({
  isOpen,
  onClose,
  onConfirm,
  product,
}: RestoreProductModalProps) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Error restoring product:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!product) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-blue-600" />
            Khôi phục sản phẩm
          </DialogTitle>
          <DialogDescription>
            Bạn có chắc chắn muốn khôi phục sản phẩm này?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-900">{product.name}</p>
            {product.sku && (
              <p className="text-xs text-gray-500 mt-1">SKU: {product.sku}</p>
            )}
          </div>
          <p className="text-sm text-gray-600">
            Sản phẩm sẽ được khôi phục và chuyển về trạng thái <strong>Bản nháp</strong>.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Hủy
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={loading}
            className="min-h-[44px]"
          >
            {loading ? 'Đang xử lý...' : 'Khôi phục'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

