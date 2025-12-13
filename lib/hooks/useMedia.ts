/**
 * Media Library Hooks
 * 
 * React Query hooks for Media Library data fetching
 * 
 * Features:
 * - Automatic caching (5 minutes)
 * - Request deduplication
 * - Background refetching
 * - Error handling with retry
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { MediaType, MediaSort } from '@/types/media';

export interface UseMediaListOptions {
  page?: number;
  limit?: number;
  type?: MediaType;
  search?: string;
  sort?: MediaSort;
  folder?: string;
  enabled?: boolean;
}

export interface UseMediaListResult {
  data: any[];
  pagination: {
    total: number;
    pages: number;
    page: number;
    limit: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Fetch media list from API
 */
async function fetchMediaList(options: UseMediaListOptions = {}): Promise<{
  data: any[];
  pagination: any;
}> {
  const {
    page = 1,
    limit = 20,
    type,
    search,
    sort = 'newest',
    folder,
  } = options;

  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    sort,
    ...(type && { type }),
    ...(search && { search }),
    ...(folder && { folder }),
  });

  const response = await fetch(`/api/admin/media?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch media: ${response.status} ${response.statusText}`);
  }

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'Failed to fetch media');
  }

  return {
    data: result.data || [],
    pagination: result.pagination || {
      total: 0,
      pages: 0,
      page: 1,
      limit: 20,
      hasNext: false,
      hasPrev: false,
    },
  };
}

/**
 * Hook để fetch media list với React Query
 * 
 * @param options - Query options
 * @returns Media list với pagination và loading state
 */
export function useMediaList(options: UseMediaListOptions = {}): UseMediaListResult {
  const {
    page = 1,
    limit = 20,
    type,
    search,
    sort = 'newest',
    folder,
    enabled = true,
  } = options;

  const {
    data = { data: [], pagination: { total: 0, pages: 0, page: 1, limit: 20, hasNext: false, hasPrev: false } },
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['media-list', page, limit, type, search, sort, folder],
    queryFn: () => fetchMediaList({ page, limit, type, search, sort, folder }),
    enabled,
    staleTime: 2 * 60 * 1000, // Cache 2 phút (media list changes frequently)
    gcTime: 5 * 60 * 1000, // Giữ trong cache 5 phút
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  return {
    data: data.data,
    pagination: data.pagination,
    isLoading,
    error: error instanceof Error ? error : error ? new Error(String(error)) : null,
    refetch: () => {
      refetch();
    },
  };
}

/**
 * Hook để fetch single media detail
 */
export function useMedia(id: string | null | undefined) {
  return useQuery({
    queryKey: ['media', id],
    queryFn: async () => {
      if (!id) return null;

      const response = await fetch(`/api/admin/media/${id}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch media: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch media');
      }

      return result.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // Cache 5 phút
    gcTime: 10 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook để update media metadata
 */
export function useUpdateMedia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const response = await fetch(`/api/admin/media/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update media');
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidate media list queries
      queryClient.invalidateQueries({ queryKey: ['media-list'] });
      // Update media detail cache
      queryClient.setQueryData(['media', variables.id], data.data);
    },
  });
}

/**
 * Hook để delete media
 */
export function useDeleteMedia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/media/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete media');
      }

      return response.json();
    },
    onSuccess: (_, id) => {
      // Invalidate media list queries
      queryClient.invalidateQueries({ queryKey: ['media-list'] });
      // Remove media detail from cache
      queryClient.removeQueries({ queryKey: ['media', id] });
    },
  });
}
