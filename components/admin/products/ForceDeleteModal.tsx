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
import { AlertTriangle } from 'lucide-react';
import type { MappedProduct } from '@/lib/utils/productMapper';

interface ForceDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  product: MappedProduct | null;
}

export function ForceDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  product,
}: ForceDeleteModalProps) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Error force deleting product:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!product) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md border-red-200">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            Xóa vĩnh viễn sản phẩm
          </DialogTitle>
          <DialogDescription className="text-red-600">
            Hành động này không thể hoàn tác!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm font-medium text-red-900 mb-2">
              ⚠️ Cảnh báo
            </p>
            <p className="text-sm text-red-800">
              Sản phẩm sẽ bị xóa vĩnh viễn khỏi hệ thống và không thể khôi phục.
            </p>
          </div>

          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-900">{product.name}</p>
            {product.sku && (
              <p className="text-xs text-gray-500 mt-1">SKU: {product.sku}</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Hủy
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={loading}
            className="min-h-[44px]"
          >
            {loading ? 'Đang xử lý...' : 'Xóa vĩnh viễn'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

