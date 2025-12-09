'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useProductFilters, type ProductFilters as ProductFiltersType } from '@/lib/hooks/useProductFilters';
import { useCategoriesREST } from '@/lib/hooks/useCategoriesREST';
import { X } from 'lucide-react';

interface AdvancedFiltersProps {
  className?: string;
}

export function AdvancedFilters({ className }: AdvancedFiltersProps) {
  const { filters, updateFilters, clearFilters } = useProductFilters();
  const { categories, loading: categoriesLoading } = useCategoriesREST();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    filters.category ? [filters.category] : []
  );
  const [priceRange, setPriceRange] = useState({
    min: filters.minPrice || 0,
    max: filters.maxPrice || 1000000,
  });

  const hasActiveFilters = 
    filters.category || 
    filters.minPrice || 
    filters.maxPrice || 
    filters.material || 
    filters.sortBy;

  const handleCategoryToggle = (categorySlug: string) => {
    const newCategories = selectedCategories.includes(categorySlug)
      ? selectedCategories.filter((c) => c !== categorySlug)
      : [...selectedCategories, categorySlug];

    setSelectedCategories(newCategories);
    
    // Update filter với first category (hoặc có thể support multiple)
    updateFilters({
      category: newCategories.length > 0 ? newCategories[0] : undefined,
    });
  };

  const handlePriceRangeChange = (type: 'min' | 'max', value: number) => {
    const newRange = { ...priceRange, [type]: value };
    setPriceRange(newRange);
    
    updateFilters({
      minPrice: newRange.min > 0 ? newRange.min : undefined,
      maxPrice: newRange.max < 1000000 ? newRange.max : undefined,
    });
  };

  const handleClearAll = () => {
    setSelectedCategories([]);
    setPriceRange({ min: 0, max: 1000000 });
    clearFilters();
  };

  return (
    <div className={`w-full ${className || ''}`}>
      {/* Mobile: Collapsible Filter Button */}
      <div className="md:hidden mb-4">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? 'Đóng bộ lọc' : 'Bộ lọc nâng cao'}
          {hasActiveFilters && (
            <span className="ml-2 bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs">
              !
            </span>
          )}
        </Button>
      </div>

      {/* Filter Panel */}
      <div
        className={`${
          isOpen ? 'block' : 'hidden'
        } md:block space-y-4`}
      >
        <Card className="p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading text-lg font-semibold">
              Bộ lọc nâng cao
            </h3>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                className="text-sm"
              >
                <X className="h-4 w-4 mr-1" />
                Xóa tất cả
              </Button>
            )}
          </div>

          <div className="space-y-6">
            {/* Multiple Categories Filter */}
            <div>
              <label className="block text-sm font-medium text-text-main mb-3">
                Danh mục (có thể chọn nhiều)
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {categoriesLoading ? (
                  <div className="text-sm text-text-muted">Đang tải...</div>
                ) : (
                  categories.map((category) => {
                    const isSelected = selectedCategories.includes(
                      category.slug || category.databaseId?.toString() || ''
                    );
                    return (
                      <label
                        key={category.id}
                        className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-muted transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() =>
                            handleCategoryToggle(
                              category.slug || category.databaseId?.toString() || ''
                            )
                          }
                          className="w-4 h-4 rounded border-text-muted"
                        />
                        <span className="text-sm flex-1">
                          {category.name}
                          {category.count !== undefined && (
                            <span className="text-text-muted ml-1">
                              ({category.count})
                            </span>
                          )}
                        </span>
                      </label>
                    );
                  })
                )}
              </div>
            </div>

            {/* Price Range Slider */}
            <div>
              <label className="block text-sm font-medium text-text-main mb-3">
                Khoảng giá
              </label>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Từ"
                    value={priceRange.min > 0 ? priceRange.min : ''}
                    onChange={(e) =>
                      handlePriceRangeChange('min', Number(e.target.value) || 0)
                    }
                    className="flex-1"
                    min="0"
                  />
                  <Input
                    type="number"
                    placeholder="Đến"
                    value={priceRange.max < 1000000 ? priceRange.max : ''}
                    onChange={(e) =>
                      handlePriceRangeChange(
                        'max',
                        Number(e.target.value) || 1000000
                      )
                    }
                    className="flex-1"
                    min="0"
                  />
                </div>
                {/* Simple Range Display */}
                <div className="text-xs text-text-muted">
                  {priceRange.min > 0 && priceRange.max < 1000000
                    ? `${priceRange.min.toLocaleString('vi-VN')}đ - ${priceRange.max.toLocaleString('vi-VN')}đ`
                    : priceRange.min > 0
                    ? `Từ ${priceRange.min.toLocaleString('vi-VN')}đ`
                    : priceRange.max < 1000000
                    ? `Đến ${priceRange.max.toLocaleString('vi-VN')}đ`
                    : 'Tất cả mức giá'}
                </div>
              </div>
            </div>

            {/* Material Filter */}
            <div>
              <label className="block text-sm font-medium text-text-main mb-2">
                Chất liệu
              </label>
              <Select
                value={filters.material || ''}
                onChange={(e) =>
                  updateFilters({ material: e.target.value || undefined })
                }
              >
                <option value="">Tất cả</option>
                <option value="Bông gòn 4D">Bông gòn 4D</option>
                <option value="Bông gòn 3D">Bông gòn 3D</option>
                <option value="Vải nỉ">Vải nỉ</option>
                <option value="Vải lông">Vải lông</option>
              </Select>
            </div>

            {/* Size Filter (if available) */}
            <div>
              <label className="block text-sm font-medium text-text-main mb-2">
                Kích thước
              </label>
              <Select
                value={filters.size || ''}
                onChange={(e) =>
                  updateFilters({ size: e.target.value || undefined })
                }
              >
                <option value="">Tất cả</option>
                <option value="Nhỏ">Nhỏ (&lt; 30cm)</option>
                <option value="Vừa">Vừa (30-50cm)</option>
                <option value="Lớn">Lớn (50-80cm)</option>
                <option value="Rất lớn">Rất lớn (&gt; 80cm)</option>
              </Select>
            </div>

            {/* Sort */}
            <div>
              <label className="block text-sm font-medium text-text-main mb-2">
                Sắp xếp
              </label>
              <Select
                value={filters.sortBy || ''}
                onChange={(e) =>
                  updateFilters({
                    sortBy: (e.target.value as ProductFiltersType['sortBy']) || undefined,
                  })
                }
              >
                <option value="">Mặc định</option>
                <option value="price_asc">Giá: Thấp đến cao</option>
                <option value="price_desc">Giá: Cao đến thấp</option>
                <option value="name_asc">Tên: A-Z</option>
                <option value="name_desc">Tên: Z-A</option>
                <option value="newest">Mới nhất</option>
              </Select>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

