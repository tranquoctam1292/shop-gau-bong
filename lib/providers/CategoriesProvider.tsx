'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { MappedCategory } from '@/lib/utils/productMapper';

interface CategoriesContextType {
  categories: MappedCategory[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

const CategoriesContext = createContext<CategoriesContextType | undefined>(undefined);

interface CategoriesProviderProps {
  children: ReactNode;
  params?: {
    per_page?: number;
    page?: number;
    orderby?: 'id' | 'name' | 'slug' | 'count';
    order?: 'asc' | 'desc';
    hide_empty?: boolean;
  };
}

/**
 * Categories Provider
 * 
 * Cache categories data và share giữa các components
 * Tránh duplicate API calls
 */
export function CategoriesProvider({ children, params }: CategoriesProviderProps) {
  const [categories, setCategories] = useState<MappedCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchCategories = async () => {
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

      const response = await fetch(`/api/cms/categories?${queryString}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch categories: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const categoriesData = data.categories || [];

      // API đã map rồi, không cần map lại
      // Chỉ cần đảm bảo format đúng
      setCategories(categoriesData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch categories'));
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [JSON.stringify(params)]);

  return (
    <CategoriesContext.Provider
      value={{
        categories,
        loading,
        error,
        refetch: fetchCategories,
      }}
    >
      {children}
    </CategoriesContext.Provider>
  );
}

/**
 * Hook để sử dụng Categories Context
 * 
 * @returns Categories, loading, error, refetch
 */
export function useCategoriesContext() {
  const context = useContext(CategoriesContext);
  if (context === undefined) {
    throw new Error('useCategoriesContext must be used within a CategoriesProvider');
  }
  return context;
}

