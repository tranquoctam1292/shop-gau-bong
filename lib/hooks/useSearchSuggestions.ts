'use client';

import { useState, useEffect, useCallback } from 'react';

const DEBOUNCE_DELAY = 300;
const MIN_QUERY_LENGTH = 2;
const MAX_SUGGESTIONS = 5;

/**
 * Hook để fetch search suggestions từ WooCommerce REST API
 * 
 * @returns Search suggestions, loading state, và methods để control
 */
export function useSearchSuggestions() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchSuggestions = useCallback(async (searchTerm: string) => {
    if (!searchTerm.trim() || searchTerm.length < MIN_QUERY_LENGTH) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      // Fetch từ CMS API
      const response = await fetch(`/api/cms/products?search=${encodeURIComponent(searchTerm)}&per_page=${MAX_SUGGESTIONS}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch search suggestions');
      }

      const data = await response.json();
      const products = data.products || [];

      // Extract product names as suggestions
      const productNames = products
        .map((product: any) => product.name || '')
        .filter((name: string) => name.length > 0)
        .slice(0, MAX_SUGGESTIONS);

      setSuggestions(productNames);
    } catch (err) {
      console.error('Search suggestions error:', err);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSuggestions(query);
    }, DEBOUNCE_DELAY);

    return () => clearTimeout(timer);
  }, [query, fetchSuggestions]);

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
  }, []);

  return {
    query,
    setQuery,
    suggestions,
    isLoading,
    clearSuggestions,
  };
}
