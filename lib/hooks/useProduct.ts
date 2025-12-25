/**
 * Hook to fetch single product from CMS API with React Query
 * 
 * PERFORMANCE OPTIMIZATION (2.1.0): Created React Query hook for product fetching
 * to enable caching and pre-fetching capabilities
 * 
 * **Features:**
 * - ✅ Automatic caching: Data cached for 5 minutes
 * - ✅ Deduplication: If multiple components fetch same product, only 1 request is sent
 * - ✅ Background refetch: Automatically refetch when data becomes stale
 * - ✅ Error handling: Automatic retry 1 time if fails
 * 
 * @param productId - Product ID (ObjectId or slug)
 * @param options - Options (enabled: only fetch when true)
 * @returns Object with product, loading state, error, and refetch function
 * 
 * @example
 * ```tsx
 * const { product, isLoading } = useProduct(productId, { 
 *   enabled: !!productId
 * });
 * ```
 */

import { useQuery } from '@tanstack/react-query';

// Product type matching the API response structure
export interface ProductWithVariants {
  id: string;
  name: string;
  sku?: string;
  status: 'draft' | 'publish' | 'trash';
  visibility?: 'public' | 'private' | 'password';
  version?: number;
  productDataMetaBox?: {
    productType?: 'simple' | 'variable' | 'grouped' | 'external';
    regularPrice?: number;
    salePrice?: number;
    costPrice?: number;
    manageStock?: boolean;
    stockQuantity?: number;
    stockStatus?: 'instock' | 'outofstock' | 'onbackorder';
    lowStockThreshold?: number;
    backorders?: 'no' | 'notify' | 'yes';
    soldIndividually?: boolean;
    weight?: number;
    length?: number;
    width?: number;
    height?: number;
    shippingClass?: string;
    attributes?: Array<{
      id: string;
      name: string;
      values: string[];
      visible?: boolean;
    }>;
    variations?: Array<{
      id: string;
      attributes?: Record<string, string>;
      regularPrice?: number;
      salePrice?: number;
      stockQuantity?: number;
      image?: string;
      sku?: string;
      colorCode?: string;
    }>;
  };
  variants?: Array<{
    id: string;
    size: string;
    color?: string;
    colorCode?: string;
    price: number;
    stock: number;
    image?: string;
    sku?: string;
  }>;
  _thumbnail_id?: string;
  _product_image_gallery?: string;
  categories?: Array<{
    id: string;
    name: string;
  }>;
  [key: string]: unknown; // Allow additional fields
}

interface UseProductOptions {
  enabled?: boolean;
  useLightweight?: boolean; // Use lightweight endpoint for Quick Edit
}

interface UseProductResult {
  product: ProductWithVariants | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<{ data: ProductWithVariants | null; error: Error | null }>;
}

/**
 * Fetch product from API
 * 
 * PERFORMANCE OPTIMIZATION (2.1.1): Exported for use in prefetching
 * 
 * @param productId - Product ID (ObjectId or slug)
 * @returns Promise<ProductWithVariants>
 */
export interface FetchProductOptions {
  useLightweight?: boolean; // Use lightweight endpoint for Quick Edit
}

/**
 * Fetch product from API
 * 
 * PERFORMANCE OPTIMIZATION (2.1.2): Support lightweight endpoint for Quick Edit
 * 
 * @param productId - Product ID (ObjectId or slug)
 * @param options - Options (useLightweight: use /quick-edit endpoint)
 * @returns Promise<ProductWithVariants>
 */
export async function fetchProduct(productId: string, options: FetchProductOptions = {}): Promise<ProductWithVariants> {
  const { useLightweight = false } = options;
  
  // PERFORMANCE OPTIMIZATION (2.1.2): Use lightweight endpoint for Quick Edit
  const endpoint = useLightweight 
    ? `/api/admin/products/${productId}/quick-edit`
    : `/api/admin/products/${productId}`;
  
  const response = await fetch(endpoint, {
    credentials: 'include',
  });

  if (!response.ok) {
    // If lightweight endpoint fails, fallback to full endpoint (only for non-404 errors)
    if (useLightweight && response.status !== 404) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[useProduct] Lightweight endpoint failed, falling back to full endpoint');
      }
      // Fallback to full endpoint
      return fetchProduct(productId, { useLightweight: false });
    }
    
    throw new Error(`Failed to fetch product: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  
  if (!data.product) {
    throw new Error('Product not found');
  }

  return data.product as ProductWithVariants;
}

export function useProduct(
  productId: string | null | undefined,
  options: UseProductOptions = {}
): UseProductResult {
  const { enabled = true, useLightweight = false } = options;

  const {
    data: product = null,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['product', productId, useLightweight ? 'lightweight' : 'full'],
    queryFn: () => fetchProduct(productId!, { useLightweight }),
    enabled: !!productId && enabled,
    staleTime: 5 * 60 * 1000, // Cache 5 minutes - Data considered "fresh" for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache 10 minutes after no components use it
    retry: 1, // Automatically retry 1 time if fails
    refetchOnWindowFocus: false, // Don't refetch when user returns to tab
    refetchOnMount: false, // Don't refetch on mount if data already in cache
  });

  return {
    product,
    isLoading,
    error: error instanceof Error ? error : error ? new Error(String(error)) : null,
    refetch: async () => {
      const result = await refetch();
      return {
        data: result.data || null,
        error: result.error instanceof Error ? result.error : result.error ? new Error(String(result.error)) : null,
      };
    },
  };
}

