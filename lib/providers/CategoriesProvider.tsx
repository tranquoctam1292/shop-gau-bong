'use client';

import { createContext, useContext, useEffect, useRef, useMemo, useCallback, useReducer, ReactNode } from 'react';
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

const DEFAULT_PARAMS: NonNullable<CategoriesProviderProps['params']> = {};

// Reducer for atomic state updates
type State = {
  categories: MappedCategory[];
  loading: boolean;
  error: Error | null;
};

type Action = 
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; payload: MappedCategory[] }
  | { type: 'FETCH_ERROR'; payload: Error };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, loading: true, error: null };
    case 'FETCH_SUCCESS':
      return { ...state, loading: false, categories: action.payload, error: null };
    case 'FETCH_ERROR':
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
}

/**
 * Categories Provider
 * 
 * Cache categories data và share giữa các components
 * Tránh duplicate API calls
 */
export function CategoriesProvider({ children, params = DEFAULT_PARAMS }: CategoriesProviderProps) {
  // Use reducer for atomic updates
  const [state, dispatch] = useReducer(reducer, {
    categories: [],
    loading: true,
    error: null
  });

  // ✅ FIX: Stable paramsKey - only changes when actual param values change
  const paramsKey = useMemo(() => {
    return JSON.stringify({
      per_page: params?.per_page || 100,
      page: params?.page || 1,
      orderby: params?.orderby || 'name',
      order: params?.order || 'asc',
      hide_empty: params?.hide_empty ?? false,
    });
  }, [params?.per_page, params?.page, params?.orderby, params?.order, params?.hide_empty]);

  // ✅ FIX: Stable fetchCategoriesData callback
  const fetchCategoriesData = useCallback(async () => {
    dispatch({ type: 'FETCH_START' });
    
    try {
      const paramsObj = JSON.parse(paramsKey);
      const queryString = new URLSearchParams(
        Object.entries(paramsObj).reduce((acc, [k, v]) => {
          if (v !== undefined && v !== null && String(v) !== '') {
            acc[k] = String(v);
          }
          return acc;
        }, {} as Record<string, string>)
      ).toString();

      const response = await fetch(`/api/cms/categories?${queryString}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      dispatch({ type: 'FETCH_SUCCESS', payload: data.categories || [] });
    } catch (err) {
      dispatch({ type: 'FETCH_ERROR', payload: err instanceof Error ? err : new Error('Fetch error') });
    }
  }, [paramsKey]);

  // ✅ FIX: Strict ref-based guard to prevent unnecessary fetches
  const hasFetchedRef = useRef(false);
  const activeParamsRef = useRef<string>('');

  useEffect(() => {
    // Only fetch if params actually changed
    if (hasFetchedRef.current && activeParamsRef.current === paramsKey) {
      return;
    }
    
    hasFetchedRef.current = true;
    activeParamsRef.current = paramsKey;
    
    fetchCategoriesData();
  }, [paramsKey, fetchCategoriesData]);

  // ✅ FIX: Stable refetch callback
  const refetch = useCallback(async () => {
    await fetchCategoriesData();
  }, [fetchCategoriesData]);

  // ✅ FIX: Strictly memoized context value
  const contextValue = useMemo(() => ({
    categories: state.categories,
    loading: state.loading,
    error: state.error,
    refetch
  }), [state.categories, state.loading, state.error, refetch]);

  return (
    <CategoriesContext.Provider value={contextValue}>
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
