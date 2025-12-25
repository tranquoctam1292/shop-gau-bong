/**
 * Hook to fetch product change history
 */

import { useQuery } from '@tanstack/react-query';

interface ProductHistoryLog {
  _id: string;
  action: string;
  actionLabel: string;
  createdAt: string;
  metadata: Record<string, unknown>;
  admin: {
    _id: string;
    username: string;
    full_name: string;
    email: string;
  } | null;
  ip_address: string | null;
}

interface ProductHistoryResponse {
  productId: string;
  productName: string;
  logs: ProductHistoryLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function useProductHistory(
  productId: string | undefined,
  page: number = 1,
  limit: number = 50,
  enabled: boolean = true // Allow caller to control when to fetch
) {
  return useQuery<ProductHistoryResponse>({
    queryKey: ['product-history', productId, page, limit],
    queryFn: async () => {
      if (!productId) {
        throw new Error('Product ID is required');
      }

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      const response = await fetch(
        `/api/admin/products/${productId}/history?${params.toString()}`,
        {
          credentials: 'include',
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to fetch product history' }));
        throw new Error(error.error || 'Failed to fetch product history');
      }

      return response.json();
    },
    enabled: enabled && !!productId, // Only fetch when enabled and productId exists
    staleTime: 30000, // 30 seconds - history doesn't change frequently
  });
}

