'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Search, Folder, Plus, X, Check } from 'lucide-react';
import type { MappedCategory } from '@/lib/utils/productMapper';

interface CategoriesBoxProps {
  categories: MappedCategory[];
  selectedCategories: string[]; // Array of category IDs
  onCategoriesChange: (categoryIds: string[]) => void;
  onAddNew?: () => void; // Optional: Quick add category
}

/**
 * Categories Box - Sidebar component cho category selection
 * Features:
 * - Multi-select categories
 * - Search/filter categories
 * - Tree view (hierarchical)
 * - Quick add category (optional)
 */
export function CategoriesBox({
  categories,
  selectedCategories,
  onCategoriesChange,
  onAddNew,
}: CategoriesBoxProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter categories based on search
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) {
      return categories;
    }
    const query = searchQuery.toLowerCase();
    return categories.filter(
      (cat) =>
        cat.name.toLowerCase().includes(query) ||
        cat.slug.toLowerCase().includes(query)
    );
  }, [categories, searchQuery]);

  // Group categories by parent (for tree view)
  const categoriesByParent = useMemo(() => {
    const topLevel: MappedCategory[] = [];
    const children: Record<number, MappedCategory[]> = {};

    filteredCategories.forEach((cat) => {
      if (!cat.parentId || cat.parentId === 0) {
        topLevel.push(cat);
      } else {
        if (!children[cat.parentId]) {
          children[cat.parentId] = [];
        }
        children[cat.parentId].push(cat);
      }
    });

    return { topLevel, children };
  }, [filteredCategories]);

  const toggleCategory = (categoryId: string) => {
    if (selectedCategories.includes(categoryId)) {
      onCategoriesChange(selectedCategories.filter((id) => id !== categoryId));
    } else {
      onCategoriesChange([...selectedCategories, categoryId]);
    }
  };

  const isSelected = (categoryId: string) => {
    return selectedCategories.includes(categoryId);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Folder className="h-4 w-4" />
          Danh mục
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Tìm kiếm danh mục..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Categories List */}
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {filteredCategories.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              {searchQuery ? 'Không tìm thấy danh mục' : 'Chưa có danh mục'}
            </p>
          ) : (
            <>
              {/* Top-level categories */}
              {categoriesByParent.topLevel.map((category) => (
                <CategoryItem
                  key={category.id}
                  category={category}
                  isSelected={isSelected(category.id)}
                  onToggle={toggleCategory}
                  children={categoriesByParent.children[category.databaseId] || []}
                  selectedCategories={selectedCategories}
                  onToggleCategory={toggleCategory}
                />
              ))}
            </>
          )}
        </div>

        {/* Quick Add Button (optional) */}
        {onAddNew && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onAddNew}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Thêm danh mục mới
          </Button>
        )}

        {/* Selected Count */}
        {selectedCategories.length > 0 && (
          <p className="text-xs text-muted-foreground">
            Đã chọn: {selectedCategories.length} danh mục
          </p>
        )}
      </CardContent>
    </Card>
  );
}

interface CategoryItemProps {
  category: MappedCategory;
  isSelected: boolean;
  onToggle: (categoryId: string) => void;
  children?: MappedCategory[];
  selectedCategories: string[];
  onToggleCategory: (categoryId: string) => void;
}

function CategoryItem({
  category,
  isSelected,
  onToggle,
  children = [],
  selectedCategories,
  onToggleCategory,
}: CategoryItemProps) {
  const hasChildren = children.length > 0;
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div>
      <div className="flex items-center gap-2 py-1">
        {/* Expand/Collapse Button (if has children) */}
        {hasChildren && (
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-0.5 hover:bg-muted rounded"
          >
            <span className="text-xs">{isExpanded ? '−' : '+'}</span>
          </button>
        )}
        {!hasChildren && <div className="w-4" />}

        {/* Checkbox */}
        <button
          type="button"
          onClick={() => onToggle(category.id)}
          className="flex items-center gap-2 flex-1 text-left hover:bg-muted rounded px-2 py-1.5 transition-colors"
        >
          <div
            className={`flex items-center justify-center w-4 h-4 border-2 rounded ${
              isSelected
                ? 'bg-primary border-primary'
                : 'border-input hover:border-primary'
            }`}
          >
            {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
          </div>
          <span className="text-sm flex-1">{category.name}</span>
          {category.count !== null && (
            <span className="text-xs text-muted-foreground">
              ({category.count})
            </span>
          )}
        </button>
      </div>

      {/* Children Categories */}
      {hasChildren && isExpanded && (
        <div className="ml-6 space-y-1">
          {children.map((child) => (
            <CategoryItem
              key={child.id}
              category={child}
              isSelected={selectedCategories.includes(child.id)}
              onToggle={onToggleCategory}
              selectedCategories={selectedCategories}
              onToggleCategory={onToggleCategory}
            />
          ))}
        </div>
      )}
    </div>
  );
}
