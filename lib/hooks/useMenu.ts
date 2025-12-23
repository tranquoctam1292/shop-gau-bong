/**
 * Menu Hook
 * 
 * Hook để fetch menu từ CMS API với React Query
 * 
 * **Tính năng:**
 * - ✅ Tự động cache: Data được cache 5 phút
 * - ✅ Deduplication: Nếu nhiều components cùng fetch cùng location, chỉ 1 request được gửi
 * - ✅ Background refetch: Tự động refetch khi data stale
 * - ✅ Error handling: Tự động retry 1 lần nếu fail
 * 
 * @param location - Menu location (e.g., 'primary', 'footer', 'mobile')
 * @param options - Options (enabled: chỉ fetch khi true)
 * @returns Object với menu, loading state, error, và refetch function
 * 
 * @example
 * ```tsx
 * const { menu, isLoading, error } = useMenu('primary');
 * ```
 */

import { useQuery } from '@tanstack/react-query';

export interface MenuItem {
  id: string;
  title: string;
  url: string;
  target: '_self' | '_blank';
  iconClass: string | null;
  cssClass: string | null;
  children?: MenuItem[];
}

export interface Menu {
  id: string;
  name: string;
  location: string;
  items: MenuItem[];
}

interface UseMenuOptions {
  enabled?: boolean;
}

interface UseMenuResult {
  menu: Menu | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

async function fetchMenu(location: string): Promise<Menu | null> {
  const response = await fetch(`/api/cms/menus/location/${location}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch menu for location: ${location}`);
  }
  
  const data = await response.json();
  
  // If no menu found, return null
  if (!data.menu) {
    return null;
  }
  
  return data.menu;
}

export function useMenu(
  location: string | null | undefined,
  options: UseMenuOptions = {}
): UseMenuResult {
  const { enabled = true } = options;
  
  const {
    data: menu = null,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['menu', location],
    queryFn: () => fetchMenu(location!),
    enabled: !!location && enabled,
    staleTime: 5 * 60 * 1000, // Cache 5 phút - Data được coi là "fresh" trong 5 phút
    gcTime: 10 * 60 * 1000, // Giữ trong cache 10 phút sau khi không còn component nào sử dụng
    retry: 1, // Tự động retry 1 lần nếu fail
    refetchOnWindowFocus: false, // Không refetch khi user quay lại tab
    refetchOnMount: false, // Không refetch khi component mount nếu data đã có trong cache
  });

  return {
    menu,
    isLoading,
    error: error instanceof Error ? error : error ? new Error(String(error)) : null,
    refetch: () => {
      refetch();
    },
  };
}

