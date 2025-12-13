'use client';

import { useState, useEffect, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, Loader2, ChevronRight, ChevronDown } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { useCategories } from '@/lib/hooks/useCategories';
import type { MappedCategory } from '@/lib/utils/categoryMapper';

interface SelectedItem {
  id: string;
  type: 'page' | 'category' | 'product' | 'post' | 'custom';
  title: string;
  url?: string;
  referenceId?: string;
}

interface CategoriesTabProps {
  selectedItems: SelectedItem[];
  onItemSelect: (item: SelectedItem) => void;
  onItemDeselect: (itemId: string, type: SelectedItem['type']) => void;
}

interface CategoryItemProps {
  category: MappedCategory;
  level: number;
  selectedItems: SelectedItem[];
  onItemSelect: (item: SelectedItem) => void;
  onItemDeselect: (itemId: string, type: SelectedItem['type']) => void;
  searchQuery: string;
}

function CategoryItem({
  category,
  level,
  selectedItems,
  onItemSelect,
  onItemDeselect,
  searchQuery,
}: CategoryItemProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = category.children && category.children.length > 0;
  const matchesSearch = category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.slug.toLowerCase().includes(searchQuery.toLowerCase());

  const isSelected = selectedItems.some(
    (item) => item.id === category.id && item.type === 'category'
  );

  const handleToggle = () => {
    if (isSelected) {
      onItemDeselect(category.id, 'category');
    } else {
      onItemSelect({
        id: category.id,
        type: 'category',
        title: category.name,
        referenceId: category.id,
      });
    }
  };

  // Filter children based on search
  const visibleChildren = useMemo(() => {
    if (!hasChildren) return [];
    if (!searchQuery) return category.children || [];
    return (category.children || []).filter((child) =>
      child.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      child.slug.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [category.children, searchQuery, hasChildren]);

  const shouldShow = matchesSearch || (hasChildren && visibleChildren.length > 0);

  if (!shouldShow) return null;

  return (
    <div>
      <div className="flex items-center gap-2 py-1 min-h-[44px]">
        {/* Expand/Collapse */}
        {hasChildren && (
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-muted rounded"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        )}
        {!hasChildren && <div className="w-6" />}

        {/* Checkbox */}
        <Checkbox
          checked={isSelected}
          onCheckedChange={handleToggle}
        />

        {/* Category Name */}
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm">{category.name}</div>
          {category.slug && (
            <div className="text-xs text-muted-foreground truncate">
              /{category.slug}
            </div>
          )}
        </div>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div className="ml-6 space-y-1">
          {visibleChildren.map((child) => (
            <CategoryItem
              key={child.id}
              category={child}
              level={level + 1}
              selectedItems={selectedItems}
              onItemSelect={onItemSelect}
              onItemDeselect={onItemDeselect}
              searchQuery={searchQuery}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function CategoriesTab({
  selectedItems,
  onItemSelect,
  onItemDeselect,
}: CategoriesTabProps) {
  const { categories, isLoading } = useCategories({ type: 'tree', status: 'active' });
  const [search, setSearch] = useState('');

  const filteredCategories = useMemo(() => {
    if (!search) return categories;
    // Filter will be done in CategoryItem component
    return categories;
  }, [categories, search]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Tìm kiếm danh mục..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Categories Tree */}
      {filteredCategories.length === 0 ? (
        <EmptyState
          title="Không tìm thấy danh mục nào"
          description={search ? 'Thử tìm kiếm với từ khóa khác' : 'Chưa có danh mục nào'}
          icon="📁"
        />
      ) : (
        <div className="border rounded-lg p-4 max-h-[400px] overflow-y-auto">
          <div className="space-y-1">
            {filteredCategories.map((category) => (
              <CategoryItem
                key={category.id}
                category={category}
                level={0}
                selectedItems={selectedItems}
                onItemSelect={onItemSelect}
                onItemDeselect={onItemDeselect}
                searchQuery={search}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

