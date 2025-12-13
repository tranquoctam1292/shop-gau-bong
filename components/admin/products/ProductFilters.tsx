'use client';

import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Filter, X } from 'lucide-react';
import { CategoryTreeSelect } from './CategoryTreeSelect';
import { PriceRangeFilter } from './PriceRangeFilter';
import type { ProductFilters } from '@/lib/hooks/useProductFilters';

interface ProductFiltersProps {
  filters: ProductFilters;
  onFilterChange: (key: keyof ProductFilters, value: any) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

export function ProductFilters({
  filters,
  onFilterChange,
  onClearFilters,
  hasActiveFilters,
}: ProductFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex items-center gap-2">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="relative">
            <Filter className="w-4 h-4 mr-2" />
            Bộ lọc
            {hasActiveFilters && (
              <span className="ml-2 h-5 w-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center">
                {[
                  filters.category,
                  filters.brand,
                  filters.priceMin !== null,
                  filters.priceMax !== null,
                  filters.stockStatus,
                ].filter(Boolean).length}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-4" align="start">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Bộ lọc sản phẩm</h3>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClearFilters}
                  className="text-xs"
                >
                  <X className="w-3 h-3 mr-1" />
                  Xóa tất cả
                </Button>
              )}
            </div>

            {/* Category Filter */}
            <div>
              <CategoryTreeSelect
                value={filters.category || null}
                onChange={(value) => onFilterChange('category', value)}
                placeholder="Tất cả danh mục"
              />
            </div>

            {/* Brand Filter - Placeholder for future */}
            {/* <div>
              <Select
                value={filters.brand || ''}
                onValueChange={(value) => onFilterChange('brand', value || null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tất cả thương hiệu" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tất cả thương hiệu</SelectItem>
                  <SelectItem value="brand1">Thương hiệu 1</SelectItem>
                  <SelectItem value="brand2">Thương hiệu 2</SelectItem>
                </SelectContent>
              </Select>
            </div> */}

            {/* Price Range Filter */}
            <div>
              <PriceRangeFilter
                minPrice={filters.priceMin}
                maxPrice={filters.priceMax}
                onMinPriceChange={(value) => onFilterChange('priceMin', value)}
                onMaxPriceChange={(value) => onFilterChange('priceMax', value)}
                onClear={() => {
                  onFilterChange('priceMin', null);
                  onFilterChange('priceMax', null);
                }}
              />
            </div>

            {/* Stock Status Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">Trạng thái kho</label>
              <Select
                value={filters.stockStatus || ''}
                onValueChange={(value) => onFilterChange('stockStatus', value || null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tất cả trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tất cả trạng thái</SelectItem>
                  <SelectItem value="instock">Còn hàng</SelectItem>
                  <SelectItem value="outofstock">Hết hàng</SelectItem>
                  <SelectItem value="onbackorder">Đặt hàng trước</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          {filters.category && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded text-sm">
              Danh mục: {filters.category}
              <button
                onClick={() => onFilterChange('category', null)}
                className="hover:bg-blue-100 rounded"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filters.priceMin !== null && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded text-sm">
              Giá từ: {filters.priceMin.toLocaleString('vi-VN')} VND
              <button
                onClick={() => onFilterChange('priceMin', null)}
                className="hover:bg-blue-100 rounded"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filters.priceMax !== null && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded text-sm">
              Giá đến: {filters.priceMax.toLocaleString('vi-VN')} VND
              <button
                onClick={() => onFilterChange('priceMax', null)}
                className="hover:bg-blue-100 rounded"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filters.stockStatus && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded text-sm">
              Kho: {filters.stockStatus === 'instock' ? 'Còn hàng' : filters.stockStatus === 'outofstock' ? 'Hết hàng' : 'Đặt hàng trước'}
              <button
                onClick={() => onFilterChange('stockStatus', null)}
                className="hover:bg-blue-100 rounded"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}

