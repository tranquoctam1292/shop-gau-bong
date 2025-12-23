'use client';

import { useState, useCallback } from 'react';
import { useToastContext } from '@/components/providers/ToastProvider';
import type { MappedProduct } from '@/lib/utils/productMapper';

interface QuickUpdateOptions {
  name?: string;
  sku?: string;
  status?: 'draft' | 'publish' | 'trash';
  manageStock?: boolean;
  regularPrice?: number;
  salePrice?: number;
  stockQuantity?: number;
  stockStatus?: 'instock' | 'outofstock' | 'onbackorder';
  version?: number; // For optimistic locking
  variants?: Array<{
    id: string;
    sku?: string;
    price?: number;
    stock?: number;
    // stockStatus removed - variants don't have this field
  }>;
  // Backward compatibility: support old price field
  price?: number;
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
          credentials: 'include', // CRITICAL: Include auth cookies
          body: JSON.stringify(updates),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          
          // Handle version mismatch (409 Conflict)
          if (response.status === 409 && errorData.error === 'VERSION_MISMATCH') {
            throw new Error('VERSION_MISMATCH');
          }
          
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

