'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { useProductFilters } from '@/lib/hooks/useProductFilters';
import { FilterForm } from './FilterForm';
import {
  Filter,
  ChevronDown,
  Sparkles,
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
  Crown,
  Percent,
  DollarSign,
  Ruler,
  Palette,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { formatPrice } from '@/lib/utils/format';

export function ProductFilters() {
  const { filters, updateFilters, clearFilters } = useProductFilters();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [pricePopoverOpen, setPricePopoverOpen] = useState(false);
  const [sizePopoverOpen, setSizePopoverOpen] = useState(false);
  const [colorPopoverOpen, setColorPopoverOpen] = useState(false);

  const hasActiveFilters = 
    filters.category || 
    filters.minPrice || 
    filters.maxPrice || 
    filters.material ||
    filters.size ||
    filters.color ||
    filters.sortBy;

  // Đếm số lượng filter đang active
  const activeFiltersCount = [
    filters.category,
    filters.minPrice,
    filters.maxPrice,
    filters.material,
    filters.size,
    filters.color,
    filters.sortBy,
  ].filter(Boolean).length;

  // Sort options
  const sortOptions = [
    { value: 'newest', label: 'Mới nhất', icon: Sparkles },
    { value: 'price_desc', label: 'Giá cao - thấp', icon: ArrowDownWideNarrow },
    { value: 'price_asc', label: 'Giá thấp - cao', icon: ArrowUpNarrowWide },
    { value: 'hot', label: 'Khuyến mãi hot', icon: Percent },
    { value: 'bestseller', label: 'Bán chạy nhất', icon: Crown },
  ];

  // Size options
  const sizeOptions = [
    { value: 'Nhỏ', label: 'Nhỏ (< 30cm)' },
    { value: 'Vừa', label: 'Vừa (30-50cm)' },
    { value: 'Lớn', label: 'Lớn (50-80cm)' },
    { value: 'Rất lớn', label: 'Rất lớn (> 80cm)' },
  ];

  // Color options (có thể mở rộng sau)
  const colorOptions = [
    { value: 'Đỏ', label: 'Đỏ' },
    { value: 'Hồng', label: 'Hồng' },
    { value: 'Xanh', label: 'Xanh' },
    { value: 'Trắng', label: 'Trắng' },
    { value: 'Vàng', label: 'Vàng' },
  ];

  const handlePriceApply = () => {
    setPricePopoverOpen(false);
  };

  const handleSizeSelect = (size: string) => {
    updateFilters({
      size: filters.size === size ? undefined : size,
    });
  };

  const handleColorSelect = (color: string) => {
    updateFilters({
      color: filters.color === color ? undefined : color,
    });
  };

  return (
    <div className="w-full space-y-4">
      {/* Dòng 1: Chọn theo tiêu chí (Filter Group) */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-text-main">Chọn theo tiêu chí</h4>
        <div className="flex flex-wrap gap-2">
          {/* Nút Bộ lọc - Mở Sheet */}
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                className="rounded-md gap-2 h-9"
              >
                <Filter className="w-4 h-4" />
                <span>Bộ lọc</span>
                {hasActiveFilters && (
                  <span className="ml-1 bg-primary text-primary-foreground rounded-full min-w-[18px] h-4.5 px-1 flex items-center justify-center text-[10px] font-semibold">
                    {activeFiltersCount}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[85vw] sm:max-w-sm overflow-y-auto">
              <SheetHeader>
                <SheetTitle className="text-left font-heading">
                  Bộ lọc sản phẩm
                </SheetTitle>
              </SheetHeader>

              <div className="mt-6">
                <FilterForm />
              </div>

              <SheetFooter className="flex-col gap-2 sm:flex-row mt-8 pb-4 border-t pt-4">
                {hasActiveFilters && (
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto"
                    onClick={() => {
                      clearFilters();
                      setIsSheetOpen(false);
                    }}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Xóa bộ lọc
                  </Button>
                )}
                <Button
                  className="w-full sm:w-auto"
                  onClick={() => setIsSheetOpen(false)}
                >
                  Áp dụng
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>

          {/* Nút Giá bán - Popover */}
          <Popover open={pricePopoverOpen} onOpenChange={setPricePopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "rounded-md gap-2 h-9",
                  (filters.minPrice || filters.maxPrice) && "border-primary text-primary bg-pink-50"
                )}
              >
                <DollarSign className="w-4 h-4" />
                <span>Giá bán</span>
                {(filters.minPrice || filters.maxPrice) && (
                  <span className="text-xs">•</span>
                )}
                <ChevronDown className="w-3.5 h-3.5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="start">
              <div className="space-y-3">
                <h5 className="font-semibold text-sm text-text-main">Khoảng giá</h5>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Từ"
                    value={filters.minPrice || ''}
                    onChange={(e) =>
                      updateFilters({
                        minPrice: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    placeholder="Đến"
                    value={filters.maxPrice || ''}
                    onChange={(e) =>
                      updateFilters({
                        maxPrice: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                    className="flex-1"
                  />
                </div>
                {(filters.minPrice || filters.maxPrice) && (
                  <div className="text-xs text-text-muted">
                    {filters.minPrice && filters.maxPrice
                      ? `${formatPrice(filters.minPrice)} - ${formatPrice(filters.maxPrice)}`
                      : filters.minPrice
                      ? `Từ ${formatPrice(filters.minPrice)}`
                      : `Đến ${formatPrice(filters.maxPrice)}`}
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      updateFilters({ minPrice: undefined, maxPrice: undefined });
                    }}
                  >
                    Xóa
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={handlePriceApply}
                  >
                    Áp dụng
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Nút Kích thước - Popover */}
          <Popover open={sizePopoverOpen} onOpenChange={setSizePopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "rounded-md gap-2 h-9",
                  filters.size && "border-primary text-primary bg-pink-50"
                )}
              >
                <Ruler className="w-4 h-4" />
                <span>Kích thước</span>
                {filters.size && (
                  <span className="text-xs">•</span>
                )}
                <ChevronDown className="w-3.5 h-3.5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64" align="start">
              <div className="space-y-3">
                <h5 className="font-semibold text-sm text-text-main">Chọn kích thước</h5>
                <div className="space-y-2">
                  {sizeOptions.map((option) => {
                    const isSelected = filters.size === option.value;
                    return (
                      <button
                        key={option.value}
                        onClick={() => handleSizeSelect(option.value)}
                        className={cn(
                          "w-full text-left px-3 py-2 rounded-sm border transition-colors",
                          isSelected
                            ? "border-primary bg-pink-50 text-primary font-medium"
                            : "border-border hover:border-primary/50 hover:bg-muted/50"
                        )}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
                {filters.size && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      updateFilters({ size: undefined });
                    }}
                  >
                    Xóa lọc
                  </Button>
                )}
              </div>
            </PopoverContent>
          </Popover>

          {/* Nút Màu sắc - Popover */}
          <Popover open={colorPopoverOpen} onOpenChange={setColorPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "rounded-md gap-2 h-9",
                  filters.color && "border-primary text-primary bg-pink-50"
                )}
              >
                <Palette className="w-4 h-4" />
                <span>Màu sắc</span>
                {filters.color && (
                  <span className="text-xs">•</span>
                )}
                <ChevronDown className="w-3.5 h-3.5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64" align="start">
              <div className="space-y-3">
                <h5 className="font-semibold text-sm text-text-main">Chọn màu sắc</h5>
                <div className="space-y-2">
                  {colorOptions.map((option) => {
                    const isSelected = filters.color === option.value;
                    return (
                      <button
                        key={option.value}
                        onClick={() => handleColorSelect(option.value)}
                        className={cn(
                          "w-full text-left px-3 py-2 rounded-sm border transition-colors",
                          isSelected
                            ? "border-primary bg-pink-50 text-primary font-medium"
                            : "border-border hover:border-primary/50 hover:bg-muted/50"
                        )}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
                {filters.color && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      updateFilters({ color: undefined });
                    }}
                  >
                    Xóa lọc
                  </Button>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Dòng 2: Sắp xếp theo (Sort Group) */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-text-main">Sắp xếp theo</h4>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 -mx-1 px-1">
          {sortOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = filters.sortBy === option.value || 
              (!filters.sortBy && option.value === 'newest'); // Mặc định "Mới nhất"
            const actualSelected = filters.sortBy === option.value;
            
            return (
              <button
                key={option.value}
                onClick={() => {
                  // Nếu click vào option đã chọn, bỏ chọn (về mặc định)
                  if (actualSelected) {
                    updateFilters({ sortBy: undefined });
                  } else {
                    // Map giá trị custom sang giá trị trong hook
                    let sortValue: 'price_asc' | 'price_desc' | 'name_asc' | 'name_desc' | 'newest' | undefined;
                    if (option.value === 'hot' || option.value === 'bestseller') {
                      // Tạm thời dùng newest cho hot và bestseller (có thể mở rộng sau)
                      sortValue = 'newest';
                    } else {
                      sortValue = option.value as typeof sortValue;
                    }
                    updateFilters({ sortBy: sortValue });
                  }
                }}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full border whitespace-nowrap transition-all",
                  "min-h-[36px] touch-manipulation",
                  isSelected
                    ? "border-primary bg-pink-50 text-primary font-medium"
                    : "border-border bg-muted/50 text-text-muted hover:border-primary/50 hover:text-text-main"
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm">{option.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
