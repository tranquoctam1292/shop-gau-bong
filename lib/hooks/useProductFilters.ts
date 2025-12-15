'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

export interface ProductFilters {
  category?: string | null;
  brand?: string | null;
  priceMin?: number | null;
  priceMax?: number | null;
  minPrice?: number | null; // Alias for priceMin
  maxPrice?: number | null; // Alias for priceMax
  stockStatus?: 'instock' | 'outofstock' | 'onbackorder' | null;
  search?: string;
  material?: string | null;
  size?: string | null;
  sortBy?: string | null;
  color?: string | null;
}

interface UseProductFiltersOptions {
  onFiltersChange?: (filters: ProductFilters) => void;
}

export function useProductFilters(options: UseProductFiltersOptions = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { onFiltersChange } = options;
  
  // Detect current route để redirect đúng
  const isAdminRoute = pathname?.startsWith('/admin');
  const basePath = isAdminRoute ? '/admin/products' : '/products';

  // Initialize filters from URL params
  const getInitialFilters = useCallback((): ProductFilters => {
    return {
      category: searchParams.get('category') || null,
      brand: searchParams.get('brand') || null,
      priceMin: searchParams.get('price_min') ? parseFloat(searchParams.get('price_min')!) : null,
      priceMax: searchParams.get('price_max') ? parseFloat(searchParams.get('price_max')!) : null,
      minPrice: searchParams.get('price_min') ? parseFloat(searchParams.get('price_min')!) : null,
      maxPrice: searchParams.get('price_max') ? parseFloat(searchParams.get('price_max')!) : null,
      stockStatus: (searchParams.get('stock_status') as ProductFilters['stockStatus']) || null,
      search: searchParams.get('search') || undefined,
      material: searchParams.get('material') || null,
      size: searchParams.get('size') || null,
      color: searchParams.get('color') || null,
      sortBy: searchParams.get('sort') || searchParams.get('sortBy') || null,
    };
  }, [searchParams]);

  const [filters, setFilters] = useState<ProductFilters>(getInitialFilters);

  // Sync with URL params
  useEffect(() => {
    setFilters(getInitialFilters());
  }, [getInitialFilters]);

  // Update URL when filters change
  const updateURL = useCallback((newFilters: ProductFilters) => {
    try {
      const params = new URLSearchParams(searchParams.toString());
      
      // Remove page param when filters change
      params.delete('page');

      // Update or remove filter params
      if (newFilters.category) {
        params.set('category', newFilters.category);
      } else {
        params.delete('category');
      }

      if (newFilters.brand) {
        params.set('brand', newFilters.brand);
      } else {
        params.delete('brand');
      }

      // Handle price filters (support both priceMin/priceMax and minPrice/maxPrice)
      const minPrice = newFilters.priceMin ?? newFilters.minPrice;
      const maxPrice = newFilters.priceMax ?? newFilters.maxPrice;
      
      if (minPrice !== null && minPrice !== undefined) {
        params.set('price_min', minPrice.toString());
      } else {
        params.delete('price_min');
      }

      if (maxPrice !== null && maxPrice !== undefined) {
        params.set('price_max', maxPrice.toString());
      } else {
        params.delete('price_max');
      }

      if (newFilters.stockStatus) {
        params.set('stock_status', newFilters.stockStatus);
      } else {
        params.delete('stock_status');
      }

      if (newFilters.search) {
        params.set('search', newFilters.search);
      } else {
        params.delete('search');
      }

      // Handle material, size, color, sortBy (for frontend)
      if (newFilters.material) {
        params.set('material', newFilters.material);
      } else {
        params.delete('material');
      }

      if (newFilters.size) {
        params.set('size', newFilters.size);
      } else {
        params.delete('size');
      }

      if (newFilters.color) {
        params.set('color', newFilters.color);
      } else {
        params.delete('color');
      }

      if (newFilters.sortBy) {
        params.set('sort', newFilters.sortBy);
      } else {
        params.delete('sort');
        params.delete('sortBy');
      }

      // Build URL safely
      const queryString = params.toString();
      const newUrl = queryString ? `${basePath}?${queryString}` : basePath;
      
      // Use replace instead of push để tránh thêm history entry
      // Và redirect đến đúng path (products hoặc admin/products)
      router.replace(newUrl);
    } catch (error: any) {
      console.error('[useProductFilters] Error updating URL:', error);
      // Fallback: chỉ update state, không update URL
      // Không throw error để tránh crash app
    }
  }, [router, searchParams, basePath]);

  const updateFilter = useCallback((key: keyof ProductFilters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    updateURL(newFilters);
    onFiltersChange?.(newFilters);
  }, [filters, updateURL, onFiltersChange]);

  const clearFilters = useCallback(() => {
    const emptyFilters: ProductFilters = {
      category: null,
      brand: null,
      priceMin: null,
      priceMax: null,
      minPrice: null,
      maxPrice: null,
      stockStatus: null,
      search: undefined,
      material: null,
      size: null,
      color: null,
      sortBy: null,
    };
    setFilters(emptyFilters);
    updateURL(emptyFilters);
    onFiltersChange?.(emptyFilters);
  }, [updateURL, onFiltersChange]);

  const hasActiveFilters = useCallback(() => {
    return !!(
      filters.category ||
      filters.brand ||
      filters.priceMin !== null ||
      filters.priceMax !== null ||
      filters.minPrice !== null ||
      filters.maxPrice !== null ||
      filters.stockStatus ||
      filters.search ||
      filters.material ||
      filters.size ||
      filters.color ||
      filters.sortBy
    );
  }, [filters]);

  return {
    filters,
    updateFilter,
    clearFilters,
    hasActiveFilters: hasActiveFilters(),
  };
}
