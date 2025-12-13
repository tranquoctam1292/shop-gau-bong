'use client';

import { useState, useCallback } from 'react';
import { useToastContext } from '@/components/providers/ToastProvider';
import type { MappedProduct } from '@/lib/utils/productMapper';

interface QuickUpdateOptions {
  price?: number;
  stockQuantity?: number;
  status?: 'draft' | 'publish' | 'trash';
}

interface UseQuickUpdateProductOptions {
  onSuccess?: (updatedProduct: MappedProduct) => void;
  onError?: (error: Error) => void;
  optimisticUpdate?: boolean;
}

export function useQuickUpdateProduct(options: UseQuickUpdateProductOptions = {}) {
  const { showToast } = useToastContext();
  const [isLoading, setIsLoading] = useState(false);
  const { onSuccess, onError, optimisticUpdate = true } = options;

  const quickUpdate = useCallback(
    async (productId: string, updates: QuickUpdateOptions): Promise<MappedProduct | null> => {
      setIsLoading(true);
      
      try {
        const response = await fetch(`/api/admin/products/${productId}/quick-update`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Không thể cập nhật sản phẩm');
        }

        const data = await response.json();
        const updatedProduct = data.product as MappedProduct;

        showToast('Đã cập nhật thành công', 'success');
        onSuccess?.(updatedProduct);

        return updatedProduct;
      } catch (error: any) {
        const errorMessage = error.message || 'Có lỗi xảy ra khi cập nhật sản phẩm';
        showToast(errorMessage, 'error');
        onError?.(error);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [showToast, onSuccess, onError]
  );

  return {
    quickUpdate,
    isLoading,
  };
}

