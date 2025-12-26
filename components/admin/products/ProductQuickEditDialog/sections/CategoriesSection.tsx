'use client';

import { memo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Loader2, Search, X } from 'lucide-react';
import { useQuickEditFormContext } from '../hooks/useQuickEditFormContext';
import type { MappedCategory } from '@/lib/utils/productMapper';

/**
 * Categories Section Component
 * 
 * PHASE 2: Extract Form Sections - CategoriesSection
 * 
 * Displays categories multi-select with popover and tags input
 * Uses Context API to access form state and handlers
 * 
 * @param categories - List of all categories from useCategories hook
 * @param isLoadingCategories - Loading state from useCategories hook
 */
interface CategoriesSectionProps {
  categories: MappedCategory[];
  isLoadingCategories: boolean;
}

export const CategoriesSection = memo(function CategoriesSection({
  categories,
  isLoadingCategories,
}: CategoriesSectionProps) {
  const {
    watch,
    setValue,
  } = useQuickEditFormContext();

  // Local state for UI
  const [categoriesPopoverOpen, setCategoriesPopoverOpen] = useState(false);
  const [tagsInputValue, setTagsInputValue] = useState('');

  // Get selected categories and tags from form
  const categoriesValue = watch('categories') || [];
  const tagsValue = watch('tags') || [];
  const selectedCategories = Array.isArray(categoriesValue) ? categoriesValue : [];
  const selectedTags = Array.isArray(tagsValue) ? tagsValue : [];

  return (
    <>
      {/* PHASE 1: Categories & Tags Section (4.1.1) */}
      {/* PHASE 5.3.6: Mobile compact layout - Reduce padding and spacing on mobile */}
      <div className="bg-slate-50 border border-slate-200 rounded-md p-3 md:p-4 space-y-4 mb-4 md:mb-6">
        
        {/* Categories Multi-select */}
        <div className="space-y-2">
          <Label className="text-slate-900">Danh mục</Label>
          <Popover open={categoriesPopoverOpen} onOpenChange={setCategoriesPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-between border-slate-200 hover:border-slate-300"
              >
                <span className="text-slate-600">
                  {selectedCategories.length > 0
                    ? `${selectedCategories.length} danh mục đã chọn`
                    : 'Chọn danh mục...'}
                </span>
                <Search className="h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="start">
              <div className="p-3 border-b">
                <Input
                  placeholder="Tìm danh mục..."
                  className="h-9"
                  onChange={(e) => {
                    // Filter categories by search
                    const query = e.target.value.toLowerCase();
                    // This will be handled in the category list rendering
                  }}
                />
              </div>
              <div className="max-h-[300px] overflow-y-auto p-2">
                {isLoadingCategories ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                    <span className="ml-2 text-sm text-slate-500">Đang tải danh mục...</span>
                  </div>
                ) : categories.length === 0 ? (
                  <p className="text-sm text-slate-500 p-2">Không có danh mục nào</p>
                ) : (
                  categories.map((category) => {
                    const categoryId = String(category.id || category.databaseId || '');
                    const isSelected = selectedCategories.includes(categoryId);
                    return (
                      // UX/UI UPGRADE Phase 3.3.1: Touch target >= 44x44px
                      <div
                        key={categoryId}
                        className="flex items-center space-x-2 p-2 hover:bg-slate-100 rounded cursor-pointer min-h-[44px]"
                        onClick={() => {
                          const newCategories = isSelected
                            ? selectedCategories.filter((id) => id !== categoryId)
                            : [...selectedCategories, categoryId];
                          setValue('categories', newCategories, { shouldDirty: true });
                        }}
                      >
                        <Checkbox checked={isSelected} />
                        <span className="text-sm flex-1">{category.name}</span>
                      </div>
                    );
                  })
                )}
              </div>
              {selectedCategories.length > 0 && (
                <div className="p-3 border-t">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setValue('categories', [], { shouldDirty: true });
                    }}
                  >
                    Xóa tất cả
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>
          {selectedCategories.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedCategories.map((categoryId) => {
                const category = categories.find(
                  (cat) => String(cat.id || cat.databaseId || '') === categoryId
                );
                if (!category) return null;
                return (
                  <Badge
                    key={categoryId}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {category.name}
                    {/* UX/UI UPGRADE Phase 3.3.1: Touch target >= 44x44px */}
                    <button
                      type="button"
                      onClick={() => {
                        setValue(
                          'categories',
                          selectedCategories.filter((id) => id !== categoryId),
                          { shouldDirty: true }
                        );
                      }}
                      className="ml-2 hover:bg-slate-200 rounded-full min-h-[44px] min-w-[44px] flex items-center justify-center"
                      aria-label={`Xóa danh mục ${category.name}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                );
              })}
            </div>
          )}
        </div>

        {/* Tags Input */}
        <div className="space-y-2">
          <Label htmlFor="quick-edit-tags" className="text-slate-900">Thẻ</Label>
          <div className="flex flex-wrap gap-2 p-2 border border-slate-200 rounded-md min-h-[44px]">
            {selectedTags.map((tag, index) => (
              <Badge key={index} variant="secondary" className="flex items-center gap-1">
                {tag}
                {/* UX/UI UPGRADE Phase 3.3.1: Touch target >= 44x44px */}
                <button
                  type="button"
                  onClick={() => {
                    setValue(
                      'tags',
                      selectedTags.filter((_, i) => i !== index),
                      { shouldDirty: true }
                    );
                  }}
                  className="ml-2 hover:bg-slate-200 rounded-full min-h-[44px] min-w-[44px] flex items-center justify-center"
                  aria-label={`Xóa thẻ ${tag}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            <Input
              id="quick-edit-tags"
              placeholder="Nhập thẻ và nhấn Enter..."
              value={tagsInputValue}
              onChange={(e) => setTagsInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && tagsInputValue.trim()) {
                  e.preventDefault();
                  const newTag = tagsInputValue.trim();
                  if (!selectedTags.includes(newTag)) {
                    setValue('tags', [...selectedTags, newTag], { shouldDirty: true });
                  }
                  setTagsInputValue('');
                }
              }}
              className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 flex-1 min-w-[120px]"
            />
          </div>
          <p className="text-xs text-slate-500">
            Nhấn Enter để thêm thẻ
          </p>
        </div>
      </div>
    </>
  );
});

CategoriesSection.displayName = 'CategoriesSection';

