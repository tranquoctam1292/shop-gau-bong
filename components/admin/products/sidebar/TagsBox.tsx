'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tag, X, Plus, TrendingUp } from 'lucide-react';

interface TagsBoxProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  popularTags?: string[]; // Optional: Popular tags to suggest
  onFetchPopularTags?: () => Promise<string[]>; // Optional: Function to fetch popular tags
}

/**
 * Tags Box - Sidebar component cho tag management
 * Features:
 * - Tag input với autocomplete
 * - Popular tags suggestion
 * - Tag chips với remove button
 * - Enter to add tag
 */
export function TagsBox({
  tags,
  onTagsChange,
  popularTags = [],
  onFetchPopularTags,
}: TagsBoxProps) {
  const [tagInput, setTagInput] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [popularTagsList, setPopularTagsList] = useState<string[]>(popularTags);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Fetch popular tags on mount
  useEffect(() => {
    if (onFetchPopularTags && popularTagsList.length === 0) {
      onFetchPopularTags()
        .then((tags) => setPopularTagsList(tags))
        .catch((error) => console.error('Error fetching popular tags:', error));
    }
  }, [onFetchPopularTags, popularTagsList.length]);

  // Filter suggestions based on input
  const filteredSuggestions = useMemo(() => {
    if (!tagInput.trim() || tagInput.length < 2) {
      return [];
    }

    const query = tagInput.toLowerCase();
    const allSuggestions = [
      ...popularTagsList.filter((tag) => !tags.includes(tag)),
      ...tags.filter((tag) => tag.toLowerCase().includes(query) && tag !== tagInput),
    ];

    // Remove duplicates and filter
    const unique = Array.from(new Set(allSuggestions));
    return unique
      .filter((tag) => tag.toLowerCase().includes(query) && !tags.includes(tag))
      .slice(0, 5);
  }, [tagInput, popularTagsList, tags]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const addTag = (tagToAdd?: string) => {
    const tag = (tagToAdd || tagInput).trim();
    if (tag && !tags.includes(tag)) {
      onTagsChange([...tags, tag]);
      setTagInput('');
      setShowSuggestions(false);
    }
  };

  const removeTag = (tagToRemove: string) => {
    onTagsChange(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTagInput(value);
    setShowSuggestions(value.length >= 2 && filteredSuggestions.length > 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredSuggestions.length > 0 && showSuggestions) {
        // Add first suggestion
        addTag(filteredSuggestions[0]);
      } else {
        // Add typed tag
        addTag();
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    addTag(suggestion);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Tag className="h-4 w-4" />
          Tags
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tag Input */}
        <div className="relative">
          <Input
            ref={inputRef}
            type="text"
            placeholder="Nhập tag và nhấn Enter"
            value={tagInput}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (filteredSuggestions.length > 0) {
                setShowSuggestions(true);
              }
            }}
          />

          {/* Autocomplete Suggestions */}
          {showSuggestions && filteredSuggestions.length > 0 && (
            <div
              ref={suggestionsRef}
              className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-48 overflow-y-auto"
            >
              {filteredSuggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full text-left px-3 py-2 hover:bg-muted transition-colors text-sm"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Selected Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="hover:text-primary/70 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Popular Tags */}
        {popularTagsList.length > 0 && (
          <div className="space-y-2 pt-2 border-t">
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Tags phổ biến
            </Label>
            <div className="flex flex-wrap gap-2">
              {popularTagsList
                .filter((tag) => !tags.includes(tag))
                .slice(0, 10)
                .map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => addTag(tag)}
                    className="px-2 py-1 text-xs bg-muted hover:bg-muted/80 rounded-full transition-colors"
                  >
                    <Plus className="h-3 w-3 inline mr-1" />
                    {tag}
                  </button>
                ))}
            </div>
          </div>
        )}

        {/* Tag Count */}
        {tags.length > 0 && (
          <p className="text-xs text-muted-foreground">
            Đã thêm: {tags.length} tag{tags.length > 1 ? 's' : ''}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
