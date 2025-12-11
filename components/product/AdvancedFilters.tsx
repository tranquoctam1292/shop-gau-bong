'use client';

import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useProductFilters, type ProductFilters as ProductFiltersType } from '@/lib/hooks/useProductFilters';
import { useCategoriesREST } from '@/lib/hooks/useCategoriesREST';
import { useProductAttributes } from '@/lib/hooks/useProductAttributes';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { formatPrice } from '@/lib/utils/format';

interface AdvancedFiltersProps {
  className?: string;
}

export function AdvancedFilters({ className }: AdvancedFiltersProps) {
  const { filters, updateFilters, clearFilters } = useProductFilters();
  const { categories, loading: categoriesLoading } = useCategoriesREST();
  const { getSizeOptions, getMaterialOptions, isLoading: attributesLoading } = useProductAttributes();
  const [isOpen, setIsOpen] = useState(false);
  // Parse categories từ URL (comma-separated string)
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    filters.category ? filters.category.split(',').filter(Boolean) : []
  );

  // Sync selectedCategories với filters khi filters thay đổi từ bên ngoài
  useEffect(() => {
    if (filters.category) {
      const categoriesFromUrl = filters.category.split(',').filter(Boolean);
      setSelectedCategories(categoriesFromUrl);
    } else {
      setSelectedCategories([]);
    }
  }, [filters.category]);
  // Price range constants
  const MIN_PRICE = 0;
  const MAX_PRICE = 1000000;
  
  const [priceRange, setPriceRange] = useState<[number, number]>([
    filters.minPrice || MIN_PRICE,
    filters.maxPrice || MAX_PRICE,
  ]);

  // Sync priceRange với filters khi filters thay đổi từ bên ngoài (URL params)
  useEffect(() => {
    setPriceRange([
      filters.minPrice || MIN_PRICE,
      filters.maxPrice || MAX_PRICE,
    ]);
  }, [filters.minPrice, filters.maxPrice]);

  const hasActiveFilters = 
    (filters.category && filters.category.split(',').length > 0) ||
    filters.minPrice || 
    filters.maxPrice || 
    filters.material || 
    filters.size ||
    filters.sortBy;

  const handleCategoryToggle = (categorySlug: string) => {
    const newCategories = selectedCategories.includes(categorySlug)
      ? selectedCategories.filter((c) => c !== categorySlug)
      : [...selectedCategories, categorySlug];

    setSelectedCategories(newCategories);
    
    // Update filter với tất cả categories (comma-separated)
    updateFilters({
      category: newCategories.length > 0 ? newCategories.join(',') : undefined,
    });
  };

  const handlePriceRangeChange = (values: number[]) => {
    const [min, max] = values;
    setPriceRange([min, max]);
    
    updateFilters({
      minPrice: min > MIN_PRICE ? min : undefined,
      maxPrice: max < MAX_PRICE ? max : undefined,
    });
  };

  // Material và Size options được lấy động từ WooCommerce attributes
  const materialOptions = getMaterialOptions().map(material => ({
    value: material,
    label: material,
  }));

  const sizeOptions = getSizeOptions().map(size => ({
    value: size,
    label: size,
  }));

  // Active filters for display as badges
  const activeFilters = useMemo(() => {
    const active: Array<{ key: string; label: string; value: string }> = [];
    
    if (filters.category) {
      const categorySlugs = filters.category.split(',').filter(Boolean);
      const categoryNames = categorySlugs
        .map(slug => {
          const category = categories.find(c => 
            c.slug === slug || c.databaseId?.toString() === slug
          );
          return category?.name;
        })
        .filter(Boolean);
      
      if (categoryNames.length > 0) {
        active.push({ 
          key: 'category', 
          label: categoryNames.length === 1 ? 'Danh mục' : 'Danh mục', 
          value: categoryNames.join(', ') 
        });
      }
    }
    
    if (filters.minPrice) {
      active.push({ 
        key: 'minPrice', 
        label: 'Giá từ', 
        value: formatPrice(filters.minPrice) 
      });
    }
    
    if (filters.maxPrice && filters.maxPrice < MAX_PRICE) {
      active.push({ 
        key: 'maxPrice', 
        label: 'Giá đến', 
        value: formatPrice(filters.maxPrice) 
      });
    }
    
    if (filters.material) {
      active.push({ key: 'material', label: 'Chất liệu', value: filters.material });
    }
    
    if (filters.size) {
      active.push({ key: 'size', label: 'Kích thước', value: filters.size });
    }
    
    if (filters.sortBy) {
      const sortLabels: Record<string, string> = {
        price_asc: 'Giá: Thấp đến cao',
        price_desc: 'Giá: Cao đến thấp',
        name_asc: 'Tên: A-Z',
        name_desc: 'Tên: Z-A',
        newest: 'Mới nhất',
      };
      active.push({ 
        key: 'sortBy', 
        label: 'Sắp xếp', 
        value: sortLabels[filters.sortBy] || filters.sortBy 
      });
    }
    
    return active;
  }, [filters, categories]);

  const handleClearAll = () => {
    setSelectedCategories([]);
    setPriceRange([MIN_PRICE, MAX_PRICE]);
    clearFilters();
  };

  const handleRemoveFilter = (key: string) => {
    switch (key) {
      case 'category':
        setSelectedCategories([]);
        updateFilters({ category: undefined });
        break;
      case 'minPrice':
        updateFilters({ minPrice: undefined });
        setPriceRange([MIN_PRICE, priceRange[1]]);
        break;
      case 'maxPrice':
        updateFilters({ maxPrice: undefined });
        setPriceRange([priceRange[0], MAX_PRICE]);
        break;
      case 'material':
        updateFilters({ material: undefined });
        break;
      case 'size':
        updateFilters({ size: undefined });
        break;
      case 'sortBy':
        updateFilters({ sortBy: undefined });
        break;
    }
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
            {/* Active Filters - Badges */}
            {activeFilters.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-text-main mb-2">
                  Bộ lọc đang áp dụng
                </label>
                <div className="flex flex-wrap gap-2">
                  {activeFilters.map((filter) => (
                    <div
                      key={filter.key}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-pink-50 border border-pink-200 rounded-full text-sm"
                    >
                      <span className="text-text-main">
                        <span className="font-medium">{filter.label}:</span>{' '}
                        {filter.value}
                      </span>
                      <button
                        onClick={() => handleRemoveFilter(filter.key)}
                        className="ml-1 hover:bg-pink-100 rounded-full p-0.5 transition-colors"
                        aria-label={`Xóa bộ lọc ${filter.label}`}
                      >
                        <X className="w-3.5 h-3.5 text-text-muted hover:text-destructive" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
              <div className="space-y-4">
                <Slider
                  value={priceRange}
                  onValueChange={handlePriceRangeChange}
                  min={MIN_PRICE}
                  max={MAX_PRICE}
                  step={10000}
                  className="w-full"
                />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-muted">
                    {formatPrice(priceRange[0])}
                  </span>
                  <span className="font-medium text-primary px-3 py-1 bg-pink-50 rounded-full">
                    {priceRange[0] > MIN_PRICE || priceRange[1] < MAX_PRICE
                      ? `${formatPrice(priceRange[0])} - ${formatPrice(priceRange[1])}`
                      : 'Tất cả mức giá'}
                  </span>
                  <span className="text-text-muted">
                    {formatPrice(priceRange[1])}
                  </span>
                </div>
              </div>
            </div>

            {/* Material Filter - Button Chips */}
            <div>
              <label className="block text-sm font-medium text-text-main mb-3">
                Chất liệu
              </label>
              {attributesLoading ? (
                <div className="text-sm text-text-muted py-2">Đang tải...</div>
              ) : materialOptions.length === 0 ? (
                <div className="text-sm text-text-muted py-2">Không có tùy chọn</div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {materialOptions.map((option) => {
                  const isSelected = filters.material === option.value;
                  return (
                    <Button
                      key={option.value}
                      type="button"
                      variant={isSelected ? 'default' : 'outline'}
                      size="sm"
                      onClick={() =>
                        updateFilters({
                          material: isSelected ? undefined : option.value,
                        })
                      }
                      className={cn(
                        'min-h-[44px]',
                        isSelected && 'bg-primary text-primary-foreground'
                      )}
                    >
                      {option.label}
                    </Button>
                  );
                  })}
                </div>
              )}
            </div>

            {/* Size Filter - Button Chips */}
            <div>
              <label className="block text-sm font-medium text-text-main mb-3">
                Kích thước
              </label>
              {attributesLoading ? (
                <div className="text-sm text-text-muted py-2">Đang tải...</div>
              ) : sizeOptions.length === 0 ? (
                <div className="text-sm text-text-muted py-2">Không có tùy chọn</div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {sizeOptions.map((option) => {
                  const isSelected = filters.size === option.value;
                  return (
                    <Button
                      key={option.value}
                      type="button"
                      variant={isSelected ? 'default' : 'outline'}
                      size="sm"
                      onClick={() =>
                        updateFilters({
                          size: isSelected ? undefined : option.value,
                        })
                      }
                      className={cn(
                        'min-h-[44px]',
                        isSelected && 'bg-primary text-primary-foreground'
                      )}
                    >
                      {option.label}
                    </Button>
                  );
                  })}
                </div>
              )}
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

