import { useQuery } from '@tanstack/react-query';
import type { MappedCategory } from '@/lib/utils/productMapper';

interface UseCategoriesOptions {
  type?: 'tree' | 'flat';
  status?: 'active' | 'inactive' | 'all';
  enabled?: boolean;
}

interface UseCategoriesResult {
  categories: MappedCategory[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Hook để fetch categories từ CMS API với React Query
 * 
 * **Tính năng:**
 * - ✅ Tự động cache: Data được cache 5 phút
 * - ✅ Deduplication: Nếu nhiều components cùng fetch, chỉ 1 request được gửi
 * - ✅ Background refetch: Tự động refetch khi data stale
 * - ✅ Error handling: Tự động retry 1 lần nếu fail
 * 
 * @param options - Options (type, status, enabled)
 * @returns Object với categories, loading state, error, và refetch function
 * 
 * @example
 * ```tsx
 * const { categories, isLoading } = useCategories({ 
 *   type: 'tree',
 *   status: 'active',
 *   enabled: true
 * });
 * ```
 */
async function fetchCategories(options: UseCategoriesOptions = {}): Promise<MappedCategory[]> {
  const { type = 'flat', status = 'all' } = options;
  
  const params = new URLSearchParams();
  if (type) params.append('type', type);
  if (status && status !== 'all') params.append('status', status);

  const response = await fetch(`/api/admin/categories?${params.toString()}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch categories: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return Array.isArray(data.categories) ? data.categories : [];
}

export function useCategories(options: UseCategoriesOptions = {}): UseCategoriesResult {
  const { type = 'flat', status = 'all', enabled = true } = options;
  
  const {
    data: categories = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['categories', type, status],
    queryFn: () => fetchCategories({ type, status }),
    enabled,
    staleTime: 5 * 60 * 1000, // Cache 5 phút
    gcTime: 10 * 60 * 1000, // Giữ trong cache 10 phút
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  return {
    categories,
    isLoading,
    error: error instanceof Error ? error : error ? new Error(String(error)) : null,
    refetch: () => {
      refetch();
    },
  };
}

