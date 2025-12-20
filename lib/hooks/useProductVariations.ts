'use client';

import { useQuery } from '@tanstack/react-query';

/**
 * MongoDB Variant format (from CMS API)
 * 
 * Note: stock and stockQuantity are optional to handle cases where data is missing after migration
 * If both are undefined/null, treat as out of stock for safety
 */
export interface MongoVariant {
  id: string;
  size: string;
  color?: string;
  colorCode?: string;
  price: number;
  stock?: number; // Optional: Support both stock and stockQuantity
  stockQuantity?: number; // Optional: Alternative field name for stock
  image?: string;
  sku?: string;
}

interface UseProductVariationsOptions {
  enabled?: boolean; // Chỉ fetch khi enabled = true
}

interface UseProductVariationsResult {
  variations: MongoVariant[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Fetch function cho React Query
 * 
 * @param productId - Product ID (MongoDB ObjectId string) or slug
 * @returns Promise với array of variations
 */
async function fetchProductVariations(productId: string | number): Promise<MongoVariant[]> {
  const response = await fetch(`/api/cms/products/${encodeURIComponent(String(productId))}/variations`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch variations: ${response.statusText}`);
  }

  const data = await response.json();
  // CMS API returns { variations: [...] }
  return Array.isArray(data.variations) ? data.variations : [];
}

/**
 * Hook để fetch product variations từ CMS API với React Query
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
  productId: string | number | null | undefined,
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

