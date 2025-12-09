'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { mapWooCommerceProducts, type MappedProduct } from '@/lib/utils/productMapper';
import { useProductFilters } from './useProductFilters';

/**
 * Hook để fetch products từ WooCommerce REST API với filters
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

    // Category filter
    if (filters.category) {
      // REST API cần category ID hoặc slug
      // Nếu là slug, cần convert sang ID (hoặc dùng category endpoint)
      // Tạm thời giả sử filters.category là category ID
      params.category = filters.category;
    }

    // Search
    if (filters.search) {
      params.search = filters.search;
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

        // Fetch products từ Next.js API route (proxy)
        const queryString = new URLSearchParams(
          Object.entries(apiParams).reduce((acc, [key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
              acc[key] = String(value);
            }
            return acc;
          }, {} as Record<string, string>)
        ).toString();

        const response = await fetch(`/api/woocommerce/products?${queryString}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch products: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const productsData = data.products || [];
        const paginationInfo = data.pagination || {};
        
        // Map products sang frontend format
        const mappedProducts = mapWooCommerceProducts(productsData);
        
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
          setTotalPages(productsData.length < perPage ? currentPage : currentPage + 1);
        }
        
        // If this is page 1 or filters changed, replace products; otherwise append (for load more)
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

  // Client-side filtering cho price, material, size (vì REST API không support)
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Filter by price range
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      result = result.filter((product) => {
        const price = parseFloat(product.price.replace(/[^\d.]/g, '')) || 0;
        if (filters.minPrice !== undefined && price < filters.minPrice) return false;
        if (filters.maxPrice !== undefined && price > filters.maxPrice) return false;
        return true;
      });
    }

    // Filter by material
    if (filters.material && filters.material !== '') {
      result = result.filter((product) => {
        return product.material === filters.material;
      });
    }

    // Filter by size (based on length)
    if (filters.size && filters.size !== '') {
      result = result.filter((product) => {
        const length = product.length || 0;
        switch (filters.size) {
          case 'Nhỏ':
            return length < 30;
          case 'Vừa':
            return length >= 30 && length <= 50;
          case 'Lớn':
            return length > 50 && length <= 80;
          case 'Rất lớn':
            return length > 80;
          default:
            return true;
        }
      });
    }

    return result;
  }, [products, filters]);

  const loadMore = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  return {
    products: filteredProducts,
    loading,
    error,
    hasNextPage: currentPage < totalPages,
    loadMore,
    totalCount: totalProducts,
    currentPage,
    totalPages,
  };
}

