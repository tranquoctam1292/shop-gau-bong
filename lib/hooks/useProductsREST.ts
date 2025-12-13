'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { type MappedProduct } from '@/lib/utils/productMapper';
import { useProductFilters } from './useProductFilters';

/**
 * Hook để fetch products từ CMS API với filters
 * 
 * @param perPage - Số products mỗi page (default: 12)
 * @returns Products, loading, error, pagination info
 */
export function useProductsREST(perPage: number = 12) {
  const { filters } = useProductFilters();
  const [products, setProducts] = useState<MappedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  
  // Track previous filters to detect changes
  const prevFiltersRef = useRef<string>('');

  // Build REST API params từ filters
  const apiParams = useMemo(() => {
    const params: Record<string, any> = {
      per_page: perPage,
      page: currentPage,
      status: 'publish', // Chỉ lấy published products
    };

    // Category filter - hỗ trợ nhiều categories (comma-separated)
    // WooCommerce REST API hỗ trợ nhiều categories qua comma-separated IDs/slugs
    if (filters.category) {
      // filters.category có thể là comma-separated string: "slug1,slug2,slug3"
      params.category = filters.category;
    }

    // Search
    if (filters.search) {
      params.search = filters.search;
    }

    // Custom filters - gửi lên API route để filter server-side
    if (filters.minPrice !== undefined) {
      params.min_price = filters.minPrice;
    }
    if (filters.maxPrice !== undefined) {
      params.max_price = filters.maxPrice;
    }
    if (filters.material) {
      params.material = filters.material;
    }
    if (filters.size) {
      params.size = filters.size;
    }
    if (filters.color) {
      params.color = filters.color;
    }

    // Order by
    if (filters.sortBy) {
      switch (filters.sortBy) {
        case 'price_asc':
          params.orderby = 'price';
          params.order = 'asc';
          break;
        case 'price_desc':
          params.orderby = 'price';
          params.order = 'desc';
          break;
        case 'name_asc':
          params.orderby = 'title';
          params.order = 'asc';
          break;
        case 'name_desc':
          params.orderby = 'title';
          params.order = 'desc';
          break;
        case 'newest':
          params.orderby = 'date';
          params.order = 'desc';
          break;
        default:
          params.orderby = 'date';
          params.order = 'desc';
      }
    } else {
      params.orderby = 'date';
      params.order = 'desc';
    }

    return params;
  }, [filters, perPage, currentPage]);

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        setError(null);

        // Check if filters changed (excluding page number)
        const currentFiltersKey = JSON.stringify({
          ...apiParams,
          page: undefined, // Exclude page from filter comparison
        });
        const filtersChanged = prevFiltersRef.current !== currentFiltersKey;
        
        // If filters changed, reset to page 1
        if (filtersChanged && currentPage !== 1) {
          setCurrentPage(1);
          prevFiltersRef.current = currentFiltersKey;
          return; // Will trigger another fetch with page 1
        }
        
        prevFiltersRef.current = currentFiltersKey;

        // Fetch products từ CMS API
        const queryString = new URLSearchParams(
          Object.entries(apiParams).reduce((acc, [key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
              acc[key] = String(value);
            }
            return acc;
          }, {} as Record<string, string>)
        ).toString();

        const response = await fetch(`/api/cms/products?${queryString}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch products: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        // CMS API đã map products rồi, không cần map lại
        const mappedProducts: MappedProduct[] = data.products || [];
        const paginationInfo = data.pagination || {};
        
        // Use pagination info from API (accurate) instead of estimating
        if (paginationInfo.total !== undefined) {
          setTotalProducts(paginationInfo.total);
        } else {
          // Fallback: estimate based on current page results
          setTotalProducts(mappedProducts.length);
        }
        
        if (paginationInfo.totalPages !== undefined) {
          setTotalPages(paginationInfo.totalPages);
        } else {
          // Fallback: estimate based on current page results
          setTotalPages(mappedProducts.length < perPage ? currentPage : currentPage + 1);
        }
        
        // If this is page 1 or filters changed, replace products; otherwise append (for load more)
        // Note: When using custom filters, API handles pagination correctly, so we replace on page 1
        if (currentPage === 1 || filtersChanged) {
          setProducts(mappedProducts);
        } else {
          // Append new products for "load more" functionality
          setProducts(prev => [...prev, ...mappedProducts]);
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch products'));
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(apiParams), currentPage, perPage]);

  // No need for client-side filtering anymore - API route handles all filtering
  // Products returned from API are already filtered

  const loadMore = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  return {
    products,
    loading,
    error,
    hasNextPage: currentPage < totalPages,
    loadMore,
    totalCount: totalProducts,
    currentPage,
    totalPages,
  };
}

