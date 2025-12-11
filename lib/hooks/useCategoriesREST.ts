'use client';

import { useState, useEffect } from 'react';
import { type MappedCategory } from '@/lib/utils/productMapper';

/**
 * Hook để fetch product categories từ CMS API
 * 
 * @param params - Optional query parameters (parent: '0' for top-level, parent ID for children)
 * @returns Categories, loading, error
 */
export function useCategoriesREST(params?: {
  parent?: string | number | null; // '0' or null for top-level, parent ID for children
}) {
  const [categories, setCategories] = useState<MappedCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchCategories() {
      try {
        setLoading(true);
        setError(null);

        // Build API params for CMS API
        const apiParams: Record<string, string> = {};
        
        // Parent filter: '0' or null for top-level, parent ID for children
        if (params?.parent !== undefined) {
          if (params.parent === '0' || params.parent === null) {
            apiParams.parent = '0';
          } else {
            apiParams.parent = String(params.parent);
          }
        }

        // Fetch categories từ CMS API
        const queryString = new URLSearchParams(apiParams).toString();
        const url = queryString 
          ? `/api/cms/categories?${queryString}`
          : '/api/cms/categories';

        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch categories: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        // CMS API đã map categories rồi, không cần map lại
        const mappedCategories: MappedCategory[] = data.categories || [];
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

