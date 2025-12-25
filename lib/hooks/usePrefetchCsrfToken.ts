/**
 * Hook to pre-fetch CSRF token on hover with debounce
 * 
 * PERFORMANCE OPTIMIZATION (1.1.1): Pre-fetch CSRF token when user hovers over Quick Edit button
 * 
 * @param debounceMs - Debounce delay in milliseconds (default: 400ms)
 * @returns Object with prefetch function and cleanup function
 * 
 * @example
 * ```tsx
 * const { handleMouseEnter, handleMouseLeave } = usePrefetchCsrfToken();
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
import { prefetchCsrfToken } from '@/lib/utils/csrfClient';

interface UsePrefetchCsrfTokenOptions {
  debounceMs?: number;
}

interface UsePrefetchCsrfTokenResult {
  handleMouseEnter: () => void;
  handleMouseLeave: () => void;
}

export function usePrefetchCsrfToken(
  options: UsePrefetchCsrfTokenOptions = {}
): UsePrefetchCsrfTokenResult {
  const { debounceMs = 400 } = options;
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const prefetchPromiseRef = useRef<Promise<string | null> | null>(null);

  const handleMouseEnter = useCallback(() => {
    // Clear any existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    // Debounce pre-fetch
    debounceTimerRef.current = setTimeout(() => {
      // Only pre-fetch if not already fetching
      if (!prefetchPromiseRef.current) {
        prefetchPromiseRef.current = prefetchCsrfToken();
        // Clear ref after promise resolves (success or failure)
        prefetchPromiseRef.current.finally(() => {
          prefetchPromiseRef.current = null;
        });
      }
    }, debounceMs);
  }, [debounceMs]);

  const handleMouseLeave = useCallback(() => {
    // Clear debounce timer if user leaves before debounce completes
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    // Note: We don't cancel the fetch promise if it's already started
    // This is intentional - we want to complete the fetch even if user leaves
    // The token will be cached and available when dialog opens
  }, []);

  return {
    handleMouseEnter,
    handleMouseLeave,
  };
}

