'use client';

import { useEffect, useRef, useCallback } from 'react';
import type { ProductWithVariants } from '@/lib/hooks/useProduct';
import type { MappedProduct } from '@/lib/utils/productMapper';

/**
 * Hook for Quick Edit Dialog Version Checking
 * 
 * PHASE 3.5: Extract Version Check Logic
 * 
 * Handles:
 * - Version polling (every 15 seconds)
 * - Version mismatch detection
 * - Auto-refresh product data when version changes (if form is not dirty)
 * - Warning when version changes but form is dirty
 * 
 * @param options - Configuration options for version checking
 */

interface UseQuickEditVersionCheckOptions {
  // Dialog state
  open: boolean;
  isBulkMode: boolean;
  
  // Product data
  product: MappedProduct | null | undefined;
  productWithVariants: ProductWithVariants | null;
  setProductWithVariants: React.Dispatch<React.SetStateAction<ProductWithVariants | null>>;
  
  // Form state
  isDirty: boolean;
  
  // React Query
  refetchProduct: (() => Promise<{ data?: ProductWithVariants | null; error?: unknown }>) | undefined;
  
  // Toast notification
  showToast: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

export function useQuickEditVersionCheck({
  open,
  isBulkMode,
  product,
  productWithVariants,
  setProductWithVariants,
  isDirty,
  refetchProduct,
  showToast,
}: UseQuickEditVersionCheckOptions) {
  
  // PHASE 3: Client State Sync (7.12.7) - Track polling interval
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  // PHASE 3: Client State Sync (7.12.7) - Track last checked version
  const lastCheckedVersionRef = useRef<number | null>(null);
  // PHASE 3: Client State Sync (7.12.7) - Track form dirty state for polling
  const isDirtyRef = useRef<boolean>(false);
  
  // Update isDirty ref when it changes
  useEffect(() => {
    isDirtyRef.current = isDirty;
  }, [isDirty]);
  
  // PHASE 3: Client State Sync (7.12.7) - Polling function to check version
  // PERFORMANCE OPTIMIZATION: Use React Query refetch instead of direct fetch
  const checkProductVersion = useCallback(async () => {
    const productId = product?.id;
    if (!open || !productId || isBulkMode || !refetchProduct) {
      return;
    }

    try {
      // PERFORMANCE OPTIMIZATION: Use React Query refetch instead of direct fetch
      // This benefits from React Query cache and deduplication
      const result = await refetchProduct();

      if (result.error) {
        // Silent fail for polling - don't interrupt user
        return;
      }

      if (!result.data) {
        return;
      }

      const serverVersion = result.data.version || 0;
      const currentVersion = lastCheckedVersionRef.current ?? (productWithVariants?.version || product?.version || 0);

      // Update last checked version
      lastCheckedVersionRef.current = serverVersion;

      // Only refresh if version changed
      if (serverVersion !== currentVersion && currentVersion > 0) {
        const isFormDirty = isDirtyRef.current;
        
        if (!isFormDirty) {
          // Version mismatch detected - refresh product data
          showToast(
            `Sản phẩm đã được cập nhật từ nơi khác (version ${serverVersion}). Đang tải dữ liệu mới...`,
            'warning'
          );
          
          // Refresh product data - this will trigger initialData recalculation and form reset
          // Note: fetchedProduct will also be updated via useEffect in main component, but we set it here
          // to ensure immediate update for version check
          setProductWithVariants(result.data as ProductWithVariants);
        } else {
          // Version changed but form is dirty - show warning but don't auto-refresh
          showToast(
            `Sản phẩm đã được cập nhật từ nơi khác (version ${serverVersion}). Bạn đang có thay đổi chưa lưu. Lưu ý: Lưu có thể ghi đè các thay đổi khác.`,
            'warning'
          );
        }
      }
    } catch (error) {
      // Silent fail for polling - don't interrupt user
      console.error('[ProductQuickEditDialog] Polling error:', error);
    }
  }, [open, product?.id, isBulkMode, productWithVariants, product?.version, showToast, refetchProduct, setProductWithVariants]);
  
  // PHASE 3: Client State Sync (7.12.7) - Setup polling when dialog opens
  useEffect(() => {
    if (!open || isBulkMode || !product?.id) {
      // Clear polling when dialog closes
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      lastCheckedVersionRef.current = null;
      return;
    }

    // Initialize last checked version after productWithVariants is loaded
    if (productWithVariants?.version !== undefined) {
      const currentVersion = productWithVariants.version || 0;
      if (lastCheckedVersionRef.current === null) {
        lastCheckedVersionRef.current = currentVersion;
      }
    } else if (product?.version !== undefined) {
      const currentVersion = product.version || 0;
      if (lastCheckedVersionRef.current === null) {
        lastCheckedVersionRef.current = currentVersion;
      }
    }

    // Poll every 15 seconds
    pollingIntervalRef.current = setInterval(() => {
      checkProductVersion();
    }, 15000); // 15 seconds interval

    // Cleanup on unmount
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [open, isBulkMode, product?.id, product?.version, productWithVariants?.version, checkProductVersion]);
}

