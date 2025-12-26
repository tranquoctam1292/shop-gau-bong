/**
 * Product Sync Hook for Quick Edit
 * 
 * PHASE 6: Extract Product Data Sync Logic
 * 
 * Handles syncing fetched product data to local state and version checking
 */

'use client';

import { useEffect, useRef } from 'react';
import type { QuickEditFormData } from '../types';

export interface UseQuickEditProductSyncOptions {
  open: boolean;
  productId: string | undefined;
  isBulkMode: boolean;
  product: { id?: string; version?: number } | null | undefined;
  fetchedProduct: any;
  isLoadingProduct: boolean;
  productError: unknown;
  setProductWithVariants: (product: any) => void;
  setLoadingProduct: (loading: boolean) => void;
  setLoadingStep: (step: 'idle' | 'fetching' | 'processing' | 'complete') => void;
  showToast: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

export function useQuickEditProductSync({
  open,
  productId,
  isBulkMode,
  product,
  fetchedProduct,
  isLoadingProduct,
  productError,
  setProductWithVariants,
  setLoadingProduct,
  setLoadingStep,
  showToast,
}: UseQuickEditProductSyncOptions) {
  // CRITICAL FIX: Track last fetched product ID to prevent infinite loop
  const lastFetchedProductIdRef = useRef<string | null>(null);
  // MEMORY LEAK FIX: Store timeout ID for cleanup
  const loadingStepTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // RACE CONDITION FIX: Track mounted state to prevent setState on unmounted component
  const isMountedRef = useRef(true);

  // MEMORY LEAK FIX + RACE CONDITION FIX: Cleanup timeout and track mounted state
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (loadingStepTimeoutRef.current) {
        clearTimeout(loadingStepTimeoutRef.current);
        loadingStepTimeoutRef.current = null;
      }
    };
  }, [open, productId, fetchedProduct]);

  useEffect(() => {
    if (!open || !productId || isBulkMode) {
      // Reset ref when dialog closes
      if (!open) {
        lastFetchedProductIdRef.current = null;
        setProductWithVariants(null);
      }
      return;
    }

    // Skip if we already processed this product
    if (lastFetchedProductIdRef.current === productId) {
      return;
    }

    // Update loading state based on React Query loading state
    if (isLoadingProduct) {
      setLoadingProduct(true);
      setLoadingStep('fetching');
      return;
    }

    // Handle error
    if (productError) {
      console.error('[ProductQuickEditDialog] Error fetching product:', productError);
      // Reset ref on error so we can retry
      lastFetchedProductIdRef.current = null;
      setProductWithVariants(product as any);
      setLoadingProduct(false);
      setLoadingStep('idle');
      return;
    }

    // Handle successful fetch
    if (fetchedProduct) {
      // PHASE 0: Concurrent Edit Conflict Check (7.1.1) - Simplified version
      // Check version khi mở dialog để detect concurrent edits
      const serverVersion = fetchedProduct.version || 0;
      const clientVersion = product?.version || 0;
      
      if (serverVersion !== clientVersion && clientVersion > 0) {
        // Version khác → product đã được update từ nơi khác
        showToast(
          `Sản phẩm đã được cập nhật (version ${serverVersion} vs ${clientVersion}). Đang tải dữ liệu mới...`,
          'warning'
        );
      }
      
      // Debug: Log variants structure
      if (process.env.NODE_ENV === 'development') {
        console.log('[ProductQuickEditDialog] API Response:', {
          hasVariants: !!fetchedProduct.variants,
          variantsCount: fetchedProduct.variants?.length || 0,
          firstVariant: fetchedProduct.variants?.[0],
          productDataMetaBox: fetchedProduct.productDataMetaBox ? {
            hasVariations: !!fetchedProduct.productDataMetaBox.variations,
            variationsCount: fetchedProduct.productDataMetaBox.variations?.length || 0,
            firstVariation: fetchedProduct.productDataMetaBox.variations?.[0],
            attributes: fetchedProduct.productDataMetaBox.attributes,
          } : null,
          version: {
            server: serverVersion,
            client: clientVersion,
            mismatch: serverVersion !== clientVersion,
          },
        });
      }
      
      // Mark as processed
      lastFetchedProductIdRef.current = productId;
      setProductWithVariants(fetchedProduct);
      setLoadingProduct(false);
      // MEMORY LEAK FIX + RACE CONDITION FIX: Store timeout ID and check mounted state
      // Delay reset to show completion briefly
      if (loadingStepTimeoutRef.current) {
        clearTimeout(loadingStepTimeoutRef.current);
      }
      loadingStepTimeoutRef.current = setTimeout(() => {
        loadingStepTimeoutRef.current = null;
        // RACE CONDITION FIX: Only setState if component is still mounted
        if (isMountedRef.current) {
          setLoadingStep('idle');
        }
      }, 300);
    } else {
      // Fallback to prop product if fetch returns null
      setProductWithVariants(product as any);
      setLoadingProduct(false);
      setLoadingStep('idle');
    }
  }, [open, productId, isBulkMode, product?.version, fetchedProduct, isLoadingProduct, productError, product, showToast, setProductWithVariants, setLoadingProduct, setLoadingStep]);

  return {
    lastFetchedProductIdRef,
  };
}

