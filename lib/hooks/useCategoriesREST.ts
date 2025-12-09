'use client';

import { useState, useEffect } from 'react';
import { mapWooCommerceCategories, type MappedCategory } from '@/lib/utils/productMapper';

/**
 * Hook để fetch product categories từ WooCommerce REST API
 * 
 * @param params - Optional query parameters (per_page, page, orderby, order, etc.)
 * @returns Categories, loading, error
 */
export function useCategoriesREST(params?: {
  per_page?: number;
  page?: number;
  orderby?: 'id' | 'name' | 'slug' | 'count';
  order?: 'asc' | 'desc';
  hide_empty?: boolean;
}) {
  const [categories, setCategories] = useState<MappedCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchCategories() {
      try {
        setLoading(true);
        setError(null);

        // Default params
        const apiParams = {
          per_page: params?.per_page || 100,
          page: params?.page || 1,
          orderby: params?.orderby || 'name',
          order: params?.order || 'asc',
          hide_empty: params?.hide_empty !== undefined ? params.hide_empty : false,
        };

        // Fetch categories từ Next.js API route (proxy)
        const queryString = new URLSearchParams(
          Object.entries(apiParams).reduce((acc, [key, value]) => {
            if (value !== undefined && value !== null && String(value) !== '') {
              acc[key] = String(value);
            }
            return acc;
          }, {} as Record<string, string>)
        ).toString();

        const response = await fetch(`/api/woocommerce/categories?${queryString}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch categories: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const categoriesData = data.categories || [];

        // Map categories sang frontend format
        const mappedCategories = mapWooCommerceCategories(categoriesData);
        setCategories(mappedCategories);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch categories'));
        setCategories([]);
      } finally {
        setLoading(false);
      }
    }

    fetchCategories();
  }, [JSON.stringify(params)]);

  return {
    categories,
    loading,
    error,
  };
}

