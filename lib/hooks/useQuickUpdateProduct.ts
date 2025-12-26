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
    async (productId: string, updates: QuickUpdateOptions, retryCount = 0): Promise<MappedProduct | null> => {
      setIsLoading(true);
      
      // PHASE 0: Network Timeout (7.6.1) - Add AbortController với timeout
      const controller = new AbortController();
      let timeoutId: NodeJS.Timeout | null = null;
      
      try {
        timeoutId = setTimeout(() => controller.abort(), 30000); // 30 seconds timeout
        
        // PHASE 1: CSRF Protection (7.12.2) - Include CSRF token in headers
        // CRITICAL FIX: Clear cache on retry to ensure fresh token
        const { getCsrfTokenHeader, clearCsrfTokenCache } = await import('@/lib/utils/csrfClient');
        if (retryCount > 0) {
          // Clear cache on retry to ensure we get a fresh token
          clearCsrfTokenCache();
        }
        
        let csrfToken: string;
        try {
          csrfToken = await getCsrfTokenHeader();
          if (!csrfToken || csrfToken.trim() === '') {
            throw new Error('CSRF token is empty');
          }
        } catch (tokenError: any) {
          console.error('[useQuickUpdateProduct] Failed to get CSRF token:', tokenError);
          // Clear cache and try one more time
          clearCsrfTokenCache();
          try {
            csrfToken = await getCsrfTokenHeader();
            if (!csrfToken || csrfToken.trim() === '') {
              throw new Error('CSRF token is still empty after retry');
            }
          } catch (retryError: any) {
            showToast('Không thể lấy CSRF token. Vui lòng tải lại trang', 'error');
            throw new Error('CSRF_TOKEN_FETCH_FAILED');
          }
        }
        
        const response = await fetch(`/api/admin/products/${productId}/quick-update`, {
          method: 'PATCH',
          headers: { 
            'Content-Type': 'application/json',
            'X-CSRF-Token': csrfToken, // PHASE 1: CSRF Protection (7.12.2)
          },
          credentials: 'include', // CRITICAL: Include auth cookies
          body: JSON.stringify(updates),
          signal: controller.signal, // Add abort signal for timeout
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          
          // Log error for debugging (always log to help user debug)
          console.error('[useQuickUpdateProduct] Error response:', {
            status: response.status,
            statusText: response.statusText,
            errorCode: errorData.code,
            errorMessage: errorData.message || errorData.error,
            errorData: JSON.stringify(errorData, null, 2), // Full error data as JSON
            url: `/api/admin/products/${productId}/quick-update`,
          });
          
          // Handle version mismatch (409 Conflict) - Don't retry
          if (response.status === 409 && errorData.error === 'VERSION_MISMATCH') {
            throw new Error('VERSION_MISMATCH');
          }
          
        // PHASE 4: CSRF Protection (7.12.2) - Handle CSRF token errors (403)
        // If CSRF token is invalid, clear cache and retry once with new token
        // CRITICAL: Next.js hot reload can reset in-memory cache, so we always retry on CSRF errors
        if (response.status === 403 && (errorData.code === 'CSRF_TOKEN_INVALID' || errorData.code === 'CSRF_TOKEN_MISSING' || errorData.code === 'CSRF_ORIGIN_INVALID')) {
          if (retryCount < 2) {
            // Clear CSRF token cache and retry
            const { clearCsrfTokenCache } = await import('@/lib/utils/csrfClient');
            clearCsrfTokenCache();
            // CRITICAL FIX: Longer delay on retry to ensure new token is generated and cached on server
            // Server needs time to store token in MongoDB after hot reload
            const delay = retryCount === 0 ? 500 : 1000; // Increased delay: 500ms, 1000ms
            await new Promise(resolve => setTimeout(resolve, delay));
            if (timeoutId) clearTimeout(timeoutId);
            return quickUpdate(productId, updates, retryCount + 1);
          } else {
            // Retry failed after 2 attempts - show clear error message
            const csrfErrorMessage = 'CSRF token không hợp lệ sau nhiều lần thử. Vui lòng tải lại trang và thử lại.';
            showToast(csrfErrorMessage, 'error');
            throw new Error('CSRF_TOKEN_INVALID_AFTER_RETRY');
          }
        }
          
          // PHASE 0: Network Retry Mechanism (7.6.2) - Retry for transient errors
          const isTransientError = response.status === 500 || response.status === 503 || response.status === 504;
          if (isTransientError && retryCount < 1) {
            // Exponential backoff: 1s, 2s
            const delay = Math.pow(2, retryCount) * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
            if (timeoutId) clearTimeout(timeoutId);
            return quickUpdate(productId, updates, retryCount + 1);
          }
          
          // Show specific error message from server with error code
          const errorCode = errorData.code || errorData.error || 'UNKNOWN_ERROR';
          const errorMessage = errorData.message || errorData.error || 'Không thể cập nhật sản phẩm';
          const fullErrorMessage = errorCode !== 'UNKNOWN_ERROR' ? `[${errorCode}] ${errorMessage}` : errorMessage;
          throw new Error(fullErrorMessage);
        }

        const data = await response.json();
        const updatedProduct = data.product as MappedProduct;

        showToast('Đã cập nhật thành công', 'success');
        onSuccess?.(updatedProduct);

        return updatedProduct;
      } catch (error: any) {
        // PHASE 0: Network Timeout Handling (7.6.1)
        if (error.name === 'AbortError' || controller.signal.aborted) {
          // PHASE 0: Network Retry Mechanism (7.6.2) - Retry timeout once
          if (retryCount < 1) {
            const delay = Math.pow(2, retryCount) * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
            if (timeoutId) clearTimeout(timeoutId);
            return quickUpdate(productId, updates, retryCount + 1);
          }
          
          const timeoutMessage = 'Request timeout. Vui lòng thử lại.';
          showToast(timeoutMessage, 'error');
          onError?.(new Error('NETWORK_TIMEOUT'));
          return null;
        }
        
        // PHASE 0: Network Retry Mechanism (7.6.2) - Retry network errors
        if (error.message === 'Failed to fetch' || error.message === 'NetworkError' || error.name === 'TypeError') {
          if (retryCount < 1) {
            const delay = Math.pow(2, retryCount) * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
            if (timeoutId) clearTimeout(timeoutId);
            return quickUpdate(productId, updates, retryCount + 1);
          }
        }
        
        const errorMessage = error.message || 'Có lỗi xảy ra khi cập nhật sản phẩm';
        showToast(errorMessage, 'error');
        onError?.(error);
        return null;
      } finally {
        if (timeoutId) clearTimeout(timeoutId); // Clear timeout
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

