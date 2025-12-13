'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export interface ProductFilters {
  category?: string | null;
  brand?: string | null;
  priceMin?: number | null;
  priceMax?: number | null;
  stockStatus?: 'instock' | 'outofstock' | 'onbackorder' | null;
  search?: string;
}

interface UseProductFiltersOptions {
  onFiltersChange?: (filters: ProductFilters) => void;
}

export function useProductFilters(options: UseProductFiltersOptions = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { onFiltersChange } = options;

  // Initialize filters from URL params
  const getInitialFilters = useCallback((): ProductFilters => {
    return {
      category: searchParams.get('category') || null,
      brand: searchParams.get('brand') || null,
      priceMin: searchParams.get('price_min') ? parseFloat(searchParams.get('price_min')!) : null,
      priceMax: searchParams.get('price_max') ? parseFloat(searchParams.get('price_max')!) : null,
      stockStatus: (searchParams.get('stock_status') as ProductFilters['stockStatus']) || null,
      search: searchParams.get('search') || undefined,
    };
  }, [searchParams]);

  const [filters, setFilters] = useState<ProductFilters>(getInitialFilters);

  // Sync with URL params
  useEffect(() => {
    setFilters(getInitialFilters());
  }, [getInitialFilters]);

  // Update URL when filters change
  const updateURL = useCallback((newFilters: ProductFilters) => {
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

    if (newFilters.priceMin !== null && newFilters.priceMin !== undefined) {
      params.set('price_min', newFilters.priceMin.toString());
    } else {
      params.delete('price_min');
    }

    if (newFilters.priceMax !== null && newFilters.priceMax !== undefined) {
      params.set('price_max', newFilters.priceMax.toString());
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

    router.push(`/admin/products?${params.toString()}`);
  }, [router, searchParams]);

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
      stockStatus: null,
      search: undefined,
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
      filters.stockStatus ||
      filters.search
    );
  }, [filters]);

  return {
    filters,
    updateFilter,
    clearFilters,
    hasActiveFilters: hasActiveFilters(),
  };
}
