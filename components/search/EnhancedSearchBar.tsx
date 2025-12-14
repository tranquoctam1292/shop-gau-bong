'use client';

import { useState, FormEvent, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useSearchHistory } from '@/lib/hooks/useSearchHistory';
import { useSearchSuggestions } from '@/lib/hooks/useSearchSuggestions';
import { X, Clock, Search as SearchIcon } from 'lucide-react';

interface EnhancedSearchBarProps {
  onSearch?: (query: string) => void; // Optional callback when search is submitted
  autoFocus?: boolean; // Auto-focus input on mount (useful for modals)
}

export function EnhancedSearchBar({ onSearch, autoFocus = false }: EnhancedSearchBarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { history, addToHistory, clearHistory, removeFromHistory } = useSearchHistory();
  const { suggestions, isLoading, clearSuggestions, setQuery } = useSearchSuggestions();

  // Auto-focus input when mounted (for modals)
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      // Small delay to ensure modal is fully rendered
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [autoFocus]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        setShowHistory(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync local query with suggestions hook
  useEffect(() => {
    setQuery(searchQuery);
  }, [searchQuery, setQuery]);

  const handleInputChange = (value: string) => {
    setSearchQuery(value);
    if (value.length >= 2) {
      setShowSuggestions(true);
      setShowHistory(false);
    } else if (value.length === 0) {
      setShowSuggestions(false);
      setShowHistory(true);
    } else {
      setShowSuggestions(false);
      setShowHistory(false);
    }
  };

  const handleInputFocus = () => {
    if (searchQuery.length >= 2) {
      setShowSuggestions(true);
    } else if (history.length > 0) {
      setShowHistory(true);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      addToHistory(searchQuery.trim());
      clearSuggestions();
      setShowSuggestions(false);
      setShowHistory(false);
      
      // Call optional callback first (for modals)
      if (onSearch) {
        onSearch(searchQuery.trim());
      } else {
        // Default behavior: navigate to search page
        router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      }
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
    addToHistory(suggestion);
    clearSuggestions();
    setShowSuggestions(false);
    setShowHistory(false);
    
    // Call optional callback first (for modals)
    if (onSearch) {
      onSearch(suggestion);
    } else {
      // Default behavior: navigate to search page
      router.push(`/search?q=${encodeURIComponent(suggestion)}`);
    }
  };

  const handleHistoryClick = (historyItem: string) => {
    setSearchQuery(historyItem);
    addToHistory(historyItem);
    setShowHistory(false);
    
    // Call optional callback first (for modals)
    if (onSearch) {
      onSearch(historyItem);
    } else {
      // Default behavior: navigate to search page
      router.push(`/search?q=${encodeURIComponent(historyItem)}`);
    }
  };

  const handleClearInput = () => {
    setSearchQuery('');
    setShowSuggestions(false);
    setShowHistory(false);
    inputRef.current?.focus();
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-md">
      <form onSubmit={handleSubmit} className="flex gap-2 w-full">
        <div className="relative flex-1">
          <Input
            ref={inputRef}
            type="search"
            placeholder="Bạn đang tìm gấu Teddy, gấu hoạt hình..."
            value={searchQuery}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={handleInputFocus}
            className="w-full pr-10 rounded-full border-2 border-border focus:border-primary transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={handleClearInput}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-main"
              aria-label="Xóa"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button type="submit" size="default" className="min-w-[44px]">
          <SearchIcon className="h-5 w-5" />
        </Button>
      </form>

      {/* Suggestions Dropdown */}
      {showSuggestions && (suggestions.length > 0 || isLoading) && (
        <Card className="absolute top-full left-0 right-0 mt-2 z-[120] shadow-lg max-h-64 overflow-y-auto">
          <div className="p-2">
            {isLoading ? (
              <div className="p-4 text-center text-sm text-text-muted">
                Đang tìm kiếm...
              </div>
            ) : (
              <>
                <div className="text-xs font-semibold text-text-muted px-2 py-1 mb-1">
                  Gợi ý
                </div>
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted transition-colors text-sm"
                  >
                    <SearchIcon className="h-4 w-4 inline-block mr-2 text-text-muted" />
                    {suggestion}
                  </button>
                ))}
              </>
            )}
          </div>
        </Card>
      )}

      {/* History Dropdown */}
      {showHistory && history.length > 0 && (
        <Card className="absolute top-full left-0 right-0 mt-2 z-[120] shadow-lg max-h-64 overflow-y-auto">
          <div className="p-2">
            <div className="flex items-center justify-between px-2 py-1 mb-1">
              <div className="text-xs font-semibold text-text-muted flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Lịch sử tìm kiếm
              </div>
              <button
                type="button"
                onClick={clearHistory}
                className="text-xs text-text-muted hover:text-text-main"
              >
                Xóa tất cả
              </button>
            </div>
            {history.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between group px-3 py-2 rounded-lg hover:bg-muted transition-colors"
              >
                <button
                  type="button"
                  onClick={() => handleHistoryClick(item)}
                  className="flex-1 text-left text-sm flex items-center gap-2"
                >
                  <Clock className="h-4 w-4 text-text-muted" />
                  {item}
                </button>
                <button
                  type="button"
                  onClick={() => removeFromHistory(item)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-text-muted hover:text-text-main"
                  aria-label="Xóa"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

