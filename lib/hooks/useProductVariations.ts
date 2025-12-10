'use client';

import { useQuery } from '@tanstack/react-query';
import type { WooCommerceVariation } from '@/types/woocommerce';

interface UseProductVariationsOptions {
  enabled?: boolean; // Chỉ fetch khi enabled = true
}

interface UseProductVariationsResult {
  variations: WooCommerceVariation[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Fetch function cho React Query
 * 
 * @param productId - Product ID
 * @returns Promise với array of variations
 */
async function fetchProductVariations(productId: number): Promise<WooCommerceVariation[]> {
  const response = await fetch(`/api/woocommerce/products/${productId}/variations`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch variations: ${response.statusText}`);
  }

  const data = await response.json();
  return Array.isArray(data) ? data : [];
}

/**
 * Hook để fetch product variations từ WooCommerce API với React Query
 * 
 * **Tính năng:**
 * - ✅ Tự động cache: Data được cache 5 phút
 * - ✅ Deduplication: Nếu nhiều components cùng fetch cùng productId, chỉ 1 request được gửi
 * - ✅ Background refetch: Tự động refetch khi data stale
 * - ✅ Error handling: Tự động retry 1 lần nếu fail
 * 
 * @param productId - Product ID
 * @param options - Options (enabled: chỉ fetch khi true)
 * @returns Object với variations, loading state, error, và refetch function
 * 
 * @example
 * ```tsx
 * const { variations, isLoading, error } = useProductVariations(productId, { 
 *   enabled: product.type === 'variable' && isHovered 
 * });
 * ```
 */
export function useProductVariations(
  productId: number | null | undefined,
  options: UseProductVariationsOptions = {}
): UseProductVariationsResult {
  const { enabled = true } = options;
  
  const {
    data: variations = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['product-variations', productId],
    queryFn: () => fetchProductVariations(productId!),
    enabled: !!productId && enabled,
    staleTime: 5 * 60 * 1000, // Cache 5 phút - Data được coi là "fresh" trong 5 phút
    gcTime: 10 * 60 * 1000, // Giữ trong cache 10 phút sau khi không còn component nào sử dụng
    retry: 1, // Tự động retry 1 lần nếu fail
    refetchOnWindowFocus: false, // Không refetch khi user quay lại tab
    refetchOnMount: false, // Không refetch khi component mount nếu data đã có trong cache
  });

  return {
    variations,
    isLoading,
    error: error instanceof Error ? error : error ? new Error(String(error)) : null,
    refetch: () => {
      refetch();
    },
  };
}

