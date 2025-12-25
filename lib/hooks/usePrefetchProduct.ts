/**
 * Hook to pre-fetch product data on hover with debounce
 * 
 * PERFORMANCE OPTIMIZATION (2.1.1): Pre-fetch product data when user hovers over Quick Edit button
 * Uses React Query prefetching API to cache product data before dialog opens
 * 
 * @param productId - Product ID to pre-fetch
 * @param debounceMs - Debounce delay in milliseconds (default: 400ms)
 * @returns Object with prefetch handlers
 * 
 * @example
 * ```tsx
 * const { handleMouseEnter, handleMouseLeave } = usePrefetchProduct(productId);
 * 
 * <button
 *   onMouseEnter={handleMouseEnter}
 *   onMouseLeave={handleMouseLeave}
 *   onClick={handleClick}
 * >
 *   Quick Edit
 * </button>
 * ```
 */

import { useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface UsePrefetchProductOptions {
  debounceMs?: number;
}

interface UsePrefetchProductResult {
  handleMouseEnter: () => void;
  handleMouseLeave: () => void;
}

/**
 * Pre-fetch product data using React Query prefetching API
 * This will cache the product data so it's available immediately when dialog opens
 */
export function usePrefetchProduct(
  productId: string | null | undefined,
  options: UsePrefetchProductOptions = {}
): UsePrefetchProductResult {
  const { debounceMs = 400 } = options;
  const queryClient = useQueryClient();
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const prefetchAbortControllerRef = useRef<AbortController | null>(null);

  const handleMouseEnter = useCallback(() => {
    // Only pre-fetch if we have a valid productId
    if (!productId) {
      return;
    }

    // Clear any existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    // Debounce pre-fetch
    debounceTimerRef.current = setTimeout(() => {
      // Cancel any existing prefetch
      if (prefetchAbortControllerRef.current) {
        prefetchAbortControllerRef.current.abort();
      }

      // Create new AbortController for this prefetch
      const abortController = new AbortController();
      prefetchAbortControllerRef.current = abortController;

      // Check if data already exists in cache and is fresh (check both lightweight and full)
      const cachedLightweight = queryClient.getQueryData(['product', productId, 'lightweight']);
      const cachedFull = queryClient.getQueryData(['product', productId, 'full']);
      const cachedData = cachedLightweight || cachedFull;
      if (cachedData) {
        // Data already in cache, no need to prefetch
        if (process.env.NODE_ENV === 'development') {
          console.log('[usePrefetchProduct] Product already in cache, skipping prefetch');
        }
        prefetchAbortControllerRef.current = null;
        return;
      }

      // Pre-fetch product data using React Query prefetching API
      // PERFORMANCE OPTIMIZATION (2.1.2): Use lightweight endpoint for pre-fetching
      // This will cache the data for immediate use when dialog opens
      queryClient
        .prefetchQuery({
          queryKey: ['product', productId, 'lightweight'],
          queryFn: async () => {
            // Check if aborted
            if (abortController.signal.aborted) {
              throw new Error('Prefetch aborted');
            }
            // Import fetchProduct dynamically to avoid circular dependency
            const useProductModule = await import('./useProduct');
            // fetchProduct is exported from useProduct.ts
            return useProductModule.fetchProduct(productId, { useLightweight: true });
          },
          staleTime: 5 * 60 * 1000, // Cache 5 minutes (same as useProduct)
        })
        .catch((error) => {
          // Silent fail for pre-fetch - don't interrupt user
          if (process.env.NODE_ENV === 'development' && !abortController.signal.aborted) {
            console.warn('[usePrefetchProduct] Pre-fetch failed (non-blocking):', error);
          }
        })
        .finally(() => {
          // Clear abort controller ref
          if (prefetchAbortControllerRef.current === abortController) {
            prefetchAbortControllerRef.current = null;
          }
        });
    }, debounceMs);
  }, [productId, debounceMs, queryClient]);

  const handleMouseLeave = useCallback(() => {
    // Clear debounce timer if user leaves before debounce completes
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    // Cancel prefetch if it hasn't started yet (debounce timer cleared)
    // Note: If prefetch already started, we let it complete to benefit from cache
    // This is intentional - we want to cache data even if user leaves
  }, []);

  return {
    handleMouseEnter,
    handleMouseLeave,
  };
}

