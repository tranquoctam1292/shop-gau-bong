'use client';

import { useState, useRef } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, ChevronDown, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useCategories } from '@/lib/hooks/useCategories';
import type { MappedCategory } from '@/lib/utils/productMapper';

interface CategoryTreeSelectProps {
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
}

/**
 * Get category display name with hierarchy
 */
function getCategoryDisplayName(category: MappedCategory, allCategories: MappedCategory[]): string {
  if (!category.parentId) {
    return category.name;
  }
  
  const path: string[] = [category.name];
  let currentParentId: string | null = category.parentId;
  
  while (currentParentId) {
    const parent = allCategories.find(cat => cat.id === currentParentId || cat.databaseId.toString() === currentParentId);
    if (!parent) break;
    path.unshift(parent.name);
    currentParentId = parent.parentId;
  }
  
  return path.join(' > ');
}

/**
 * Get indent level for display
 */
function getCategoryLevel(category: MappedCategory, allCategories: MappedCategory[]): number {
  if (!category.parentId) return 0;
  
  let level = 0;
  let currentParentId: string | null = category.parentId;
  
  while (currentParentId) {
    level++;
    const parent = allCategories.find(cat => cat.id === currentParentId || cat.databaseId.toString() === currentParentId);
    if (!parent) break;
    currentParentId = parent.parentId;
  }
  
  return level;
}

export function CategoryTreeSelect({
  value,
  onChange,
  placeholder = 'Chọn danh mục...',
}: CategoryTreeSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { categories, isLoading } = useCategories({
    type: 'tree',
    status: 'active',
  });

  // Filter categories by search
  const filteredCategories = categories.filter(cat => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        cat.name.toLowerCase().includes(query) ||
        cat.slug.toLowerCase().includes(query)
      );
    }
    return true;
  });

  // Sort by hierarchy (parents first, then children)
  const sortedCategories = [...filteredCategories].sort((a, b) => {
    const levelA = getCategoryLevel(a, categories);
    const levelB = getCategoryLevel(b, categories);
    if (levelA !== levelB) return levelA - levelB;
    return a.name.localeCompare(b.name);
  });

  // Get selected category
  const selectedCategory = categories.find(
    cat => cat.id === value || cat.databaseId.toString() === value
  );

  const handleSelect = (categoryId: string | null) => {
    onChange(categoryId);
    setOpen(false);
    setSearchQuery('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'w-full justify-between text-left font-normal min-w-[200px]',
            !selectedCategory && 'text-muted-foreground'
          )}
        >
          <span className="truncate">
            {selectedCategory
              ? getCategoryDisplayName(selectedCategory, categories)
              : placeholder}
          </span>
          <div className="flex items-center gap-1">
            {selectedCategory && (
              <X
                className="h-4 w-4 shrink-0 opacity-50 hover:opacity-100"
                onClick={handleClear}
              />
            )}
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <div className="p-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={inputRef}
              placeholder="Tìm kiếm danh mục..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        <div className="max-h-[300px] overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Đang tải...
            </div>
          ) : (
            <>
              <div className="p-2">
                <button
                  type="button"
                  onClick={() => handleSelect(null)}
                  className={cn(
                    'w-full text-left px-2 py-1.5 rounded hover:bg-accent flex items-center gap-2',
                    !value && 'bg-accent'
                  )}
                >
                  {!value && <Check className="h-4 w-4" />}
                  <span className={cn(!value && 'ml-6')}>Tất cả danh mục</span>
                </button>
              </div>
              {sortedCategories.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  Không tìm thấy danh mục
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {sortedCategories.map((category) => {
                    const level = getCategoryLevel(category, categories);
                    const isSelected = category.id === value || category.databaseId.toString() === value;
                    
                    return (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => handleSelect(category.id)}
                        className={cn(
                          'w-full text-left px-2 py-1.5 rounded hover:bg-accent flex items-center gap-2',
                          isSelected && 'bg-accent'
                        )}
                        style={{ paddingLeft: `${8 + level * 20}px` }}
                      >
                        {isSelected && <Check className="h-4 w-4 shrink-0" />}
                        <span className={cn(!isSelected && level > 0 && 'ml-6')}>
                          {category.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

