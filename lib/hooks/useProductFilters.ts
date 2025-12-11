'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useCallback, useMemo } from 'react';

export interface ProductFilters {
  category?: string; // Comma-separated category IDs/slugs for multiple categories
  minPrice?: number;
  maxPrice?: number;
  material?: string;
  size?: string;
  color?: string;
  sortBy?: 'price_asc' | 'price_desc' | 'name_asc' | 'name_desc' | 'newest';
  search?: string;
}

export function useProductFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filters = useMemo<ProductFilters>(() => {
    return {
      category: searchParams.get('category') || undefined,
      minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
      maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
      material: searchParams.get('material') || undefined,
      size: searchParams.get('size') || undefined,
      color: searchParams.get('color') || undefined,
      sortBy: (searchParams.get('sortBy') as ProductFilters['sortBy']) || undefined,
      search: searchParams.get('search') || undefined,
    };
  }, [searchParams]);

  const updateFilters = useCallback(
    (newFilters: Partial<ProductFilters>) => {
      const params = new URLSearchParams(searchParams.toString());
      
      // Update filters
      Object.entries(newFilters).forEach(([key, value]) => {
        if (value === undefined || value === '' || value === null) {
          params.delete(key);
        } else {
          params.set(key, String(value));
        }
      });

      // Reset pagination when filters change
      params.delete('after');

      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  const clearFilters = useCallback(() => {
    router.push(pathname);
  }, [router, pathname]);

  return {
    filters,
    updateFilters,
    clearFilters,
  };
}

