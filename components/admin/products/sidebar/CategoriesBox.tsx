'use client';

import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Search, Folder, Plus, X, Check, Star } from 'lucide-react';
import { useCategories } from '@/lib/hooks/useCategories';
import { useToastContext } from '@/components/providers/ToastProvider';
import { AddSubCategoryModal } from '@/components/admin/AddSubCategoryModal';
import { generateSlug } from '@/lib/utils/slug';
import type { MappedCategory } from '@/lib/utils/productMapper';
import { useQueryClient } from '@tanstack/react-query';

interface CategoriesBoxProps {
  categories?: MappedCategory[]; // Optional: if not provided, will fetch using useCategories
  selectedCategories: string[]; // Array of category IDs
  primaryCategory?: string; // Primary category ID
  onCategoriesChange: (categoryIds: string[]) => void;
  onPrimaryCategoryChange?: (categoryId: string | null) => void;
  onAddNew?: () => void; // Optional: Quick add category
  onCategoryAdded?: (newCategory: MappedCategory) => void; // Callback when new category is added
}

/**
 * Categories Box - Sidebar component cho category selection
 * Features:
 * - Tabs: All Categories / Most Used
 * - Multi-select categories với hierarchy tree
 * - Primary Category selection
 * - Search/filter categories (debounced)
 * - Inline Add Category form
 */
export function CategoriesBox({
  categories: propCategories,
  selectedCategories,
  primaryCategory,
  onCategoriesChange,
  onPrimaryCategoryChange,
  onAddNew,
  onCategoryAdded,
}: CategoriesBoxProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'most-used'>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategorySlug, setNewCategorySlug] = useState('');
  const [addingCategory, setAddingCategory] = useState(false);
  const [addSubCategoryModal, setAddSubCategoryModal] = useState<{
    isOpen: boolean;
    parentId: string;
    parentName: string;
  }>({ isOpen: false, parentId: '', parentName: '' });

  const { showToast } = useToastContext();
  const queryClient = useQueryClient();
  
  // Fetch categories if not provided
  const { categories: fetchedCategories, isLoading, refetch: refetchCategories } = useCategories({
    type: 'tree',
    status: 'active',
    enabled: !propCategories,
  });

  const categories = propCategories || fetchedCategories;

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Get most used categories (sorted by count)
  const mostUsedCategories = useMemo(() => {
    return [...categories]
      .filter(cat => (cat.count || 0) > 0)
      .sort((a, b) => (b.count || 0) - (a.count || 0))
      .slice(0, 10); // Top 10
  }, [categories]);

  // Filter categories based on search
  const filteredCategories = useMemo(() => {
    const sourceCategories = activeTab === 'most-used' ? mostUsedCategories : categories;
    if (!debouncedSearch.trim()) {
      return sourceCategories;
    }
    const query = debouncedSearch.toLowerCase();
    return sourceCategories.filter(
      (cat) =>
        cat.name.toLowerCase().includes(query) ||
        cat.slug.toLowerCase().includes(query)
    );
  }, [categories, mostUsedCategories, debouncedSearch, activeTab]);

  // Categories are already in tree structure from API (type: 'tree')
  // If using flat list, we need to build tree structure
  // For now, we'll use the tree structure directly from API

  const toggleCategory = (categoryId: string) => {
    if (selectedCategories.includes(categoryId)) {
      onCategoriesChange(selectedCategories.filter((id) => id !== categoryId));
      if (onPrimaryCategoryChange && primaryCategory === categoryId) {
        onPrimaryCategoryChange(null);
      }
    } else {
      onCategoriesChange([...selectedCategories, categoryId]);
    }
  };

  const setPrimaryCategory = (categoryId: string) => {
    if (onPrimaryCategoryChange) {
      if (primaryCategory === categoryId) {
        onPrimaryCategoryChange(null);
      } else {
        onPrimaryCategoryChange(categoryId);
        // Auto-select if not already selected
        if (!selectedCategories.includes(categoryId)) {
          onCategoriesChange([...selectedCategories, categoryId]);
        }
      }
    }
  };

  const isSelected = (categoryId: string) => {
    return selectedCategories.includes(categoryId);
  };

  const isPrimary = (categoryId: string) => {
    return primaryCategory === categoryId;
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) {
      showToast('Vui lòng nhập tên danh mục', 'error');
      return;
    }

    setAddingCategory(true);
    try {
      const response = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // CRITICAL: Include credentials for authentication
        body: JSON.stringify({
          name: newCategoryName.trim(),
          slug: newCategorySlug.trim() || generateSlug(newCategoryName),
          status: 'active',
          position: 0,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Có lỗi xảy ra');
      }

      const data = await response.json();
      const newCategory = data.category;

      // Auto-select new category
      onCategoriesChange([...selectedCategories, newCategory.id]);
      if (onPrimaryCategoryChange) {
        onPrimaryCategoryChange(newCategory.id);
      }

      // Notify parent component if callback provided (for propCategories case)
      if (onCategoryAdded) {
        onCategoryAdded(newCategory);
      }

      // Invalidate React Query cache for categories to force refetch
      queryClient.invalidateQueries({ queryKey: ['categories'] });

      // Refresh categories list if using hook (not propCategories)
      if (!propCategories && refetchCategories) {
        refetchCategories();
      }

      // Reset form
      setNewCategoryName('');
      setNewCategorySlug('');
      setShowAddForm(false);
      showToast('Đã thêm danh mục mới', 'success');
    } catch (error) {
      console.error('Error adding category:', error);
      showToast(error instanceof Error ? error.message : 'Có lỗi xảy ra khi thêm danh mục', 'error');
    } finally {
      setAddingCategory(false);
    }
  };

  const handleNameChange = (value: string) => {
    setNewCategoryName(value);
    if (!newCategorySlug || newCategorySlug === generateSlug(newCategoryName)) {
      setNewCategorySlug(generateSlug(value));
    }
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
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'all' | 'most-used')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="all">Tất cả</TabsTrigger>
            <TabsTrigger value="most-used">
              <Star className="w-3 h-3 mr-1" />
              Thường dùng
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            {/* Search Input */}
            <div className="relative mb-4">
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
            {isLoading ? (
              <p className="text-sm text-muted-foreground text-center py-4">Đang tải...</p>
            ) : filteredCategories.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                {debouncedSearch ? 'Không tìm thấy danh mục' : 'Chưa có danh mục'}
              </p>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {filteredCategories.map((category) => (
                  <CategoryItem
                    key={category.id}
                    category={category}
                    isSelected={isSelected(category.id)}
                    isPrimary={isPrimary(category.id)}
                    onToggle={toggleCategory}
                    onSetPrimary={onPrimaryCategoryChange ? () => setPrimaryCategory(category.id) : undefined}
                    selectedCategories={selectedCategories}
                    onToggleCategory={toggleCategory}
                    onAddSubCategory={(parentId, parentName) => {
                      setAddSubCategoryModal({ isOpen: true, parentId, parentName });
                    }}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Inline Add Category Form */}
        {showAddForm ? (
          <form onSubmit={handleAddCategory} className="space-y-2 p-3 border rounded-lg bg-muted/50">
            <Input
              placeholder="Tên danh mục *"
              value={newCategoryName}
              onChange={(e) => handleNameChange(e.target.value)}
              required
              autoFocus
            />
            <Input
              placeholder="Slug"
              value={newCategorySlug}
              onChange={(e) => setNewCategorySlug(e.target.value)}
            />
            <div className="flex gap-2">
              <Button
                type="submit"
                size="sm"
                disabled={addingCategory || !newCategoryName.trim()}
                className="flex-1"
              >
                {addingCategory ? 'Đang thêm...' : 'Thêm'}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowAddForm(false);
                  setNewCategoryName('');
                  setNewCategorySlug('');
                }}
                disabled={addingCategory}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </form>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowAddForm(true)}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Thêm danh mục mới
          </Button>
        )}

        {/* Selected Count & Primary */}
        {selectedCategories.length > 0 && (
          <div className="text-xs text-muted-foreground space-y-1">
            <p>Đã chọn: {selectedCategories.length} danh mục</p>
            {primaryCategory && (
              <p className="text-primary font-medium">
                Danh mục chính: {categories.find(c => c.id === primaryCategory)?.name || 'N/A'}
              </p>
            )}
          </div>
        )}

        {/* Add Sub-category Modal */}
        <AddSubCategoryModal
          isOpen={addSubCategoryModal.isOpen}
          onClose={() => setAddSubCategoryModal({ isOpen: false, parentId: '', parentName: '' })}
          parentId={addSubCategoryModal.parentId}
          parentName={addSubCategoryModal.parentName}
          onSuccess={() => {
            setAddSubCategoryModal({ isOpen: false, parentId: '', parentName: '' });
            showToast('Đã thêm danh mục con', 'success');
            // Refresh categories if using hook
            if (!propCategories) {
              // React Query will auto-refetch
            }
          }}
        />
      </CardContent>
    </Card>
  );
}

interface CategoryItemProps {
  category: MappedCategory;
  isSelected: boolean;
  isPrimary?: boolean;
  onToggle: (categoryId: string) => void;
  onSetPrimary?: () => void;
  children?: MappedCategory[];
  selectedCategories: string[];
  onToggleCategory: (categoryId: string) => void;
  onAddSubCategory?: (parentId: string, parentName: string) => void;
}

function CategoryItem({
  category,
  isSelected,
  isPrimary = false,
  onToggle,
  onSetPrimary,
  children = [],
  selectedCategories,
  onToggleCategory,
  onAddSubCategory,
}: CategoryItemProps) {
  const hasChildren = children && children.length > 0;
  const [isExpanded, setIsExpanded] = useState(true);

  // Build tree from flat list (if category has children property from tree API)
  const categoryChildren = (category as any).children || children;

  return (
    <div>
      <div className="flex items-center gap-2 py-1">
        {/* Expand/Collapse Button */}
        {categoryChildren.length > 0 && (
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-0.5 hover:bg-muted rounded min-w-[20px]"
          >
            <span className="text-xs">{isExpanded ? '−' : '+'}</span>
          </button>
        )}
        {categoryChildren.length === 0 && <div className="w-5" />}

        {/* Checkbox */}
        <button
          type="button"
          onClick={() => onToggle(category.id)}
          className="flex items-center gap-2 flex-1 text-left hover:bg-muted rounded px-2 py-1.5 transition-colors min-h-[44px]"
        >
          <div
            className={`flex items-center justify-center w-4 h-4 border-2 rounded flex-shrink-0 ${
              isSelected
                ? 'bg-primary border-primary'
                : 'border-input hover:border-primary'
            }`}
          >
            {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
          </div>
          <span className={`text-sm flex-1 ${isPrimary ? 'font-semibold text-primary' : ''}`}>
            {category.name}
            {isPrimary && <Star className="w-3 h-3 inline ml-1 text-primary" />}
          </span>
          {category.count !== null && (
            <span className="text-xs text-muted-foreground">
              ({category.count})
            </span>
          )}
        </button>

        {/* Primary Category Button */}
        {onSetPrimary && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSetPrimary();
            }}
            className={`p-1 rounded hover:bg-muted ${isPrimary ? 'text-primary' : 'text-muted-foreground'}`}
            title={isPrimary ? 'Bỏ đánh dấu danh mục chính' : 'Đặt làm danh mục chính'}
          >
            <Star className={`w-4 h-4 ${isPrimary ? 'fill-current' : ''}`} />
          </button>
        )}

        {/* Add Sub-category Button */}
        {onAddSubCategory && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAddSubCategory(category.id, category.name);
            }}
            className="p-1 rounded hover:bg-muted text-muted-foreground"
            title="Thêm danh mục con"
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Children Categories */}
      {categoryChildren.length > 0 && isExpanded && (
        <div className="ml-6 space-y-1">
          {categoryChildren.map((child: MappedCategory) => (
            <CategoryItem
              key={child.id}
              category={child}
              isSelected={selectedCategories.includes(child.id)}
              isPrimary={false}
              onToggle={onToggleCategory}
              onSetPrimary={onSetPrimary}
              selectedCategories={selectedCategories}
              onToggleCategory={onToggleCategory}
              onAddSubCategory={onAddSubCategory}
            />
          ))}
        </div>
      )}
    </div>
  );
}

