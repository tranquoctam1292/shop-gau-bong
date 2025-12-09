'use client';

import { useState, useEffect, useCallback } from 'react';

const SEARCH_HISTORY_KEY = 'shop_search_history';
const MAX_HISTORY_ITEMS = 10;

export function useSearchHistory() {
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    // Load from localStorage
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(SEARCH_HISTORY_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setHistory(Array.isArray(parsed) ? parsed : []);
        } catch {
          setHistory([]);
        }
      }
    }
  }, []);

  const addToHistory = useCallback((query: string) => {
    if (!query.trim()) return;

    setHistory((prev) => {
      // Remove duplicates and add to beginning
      const filtered = prev.filter((item) => item.toLowerCase() !== query.toLowerCase());
      const newHistory = [query, ...filtered].slice(0, MAX_HISTORY_ITEMS);

      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
      }

      return newHistory;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(SEARCH_HISTORY_KEY);
    }
  }, []);

  const removeFromHistory = useCallback((query: string) => {
    setHistory((prev) => {
      const filtered = prev.filter((item) => item.toLowerCase() !== query.toLowerCase());
      
      if (typeof window !== 'undefined') {
        localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(filtered));
      }

      return filtered;
    });
  }, []);

  return {
    history,
    addToHistory,
    clearHistory,
    removeFromHistory,
  };
}

