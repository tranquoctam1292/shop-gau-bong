'use client';

import { useState, useEffect, useRef } from 'react';
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
import { useProductAttributes } from '@/lib/hooks/useProductAttributes';
import { FilterForm, type FilterFormRef } from './FilterForm';
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
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { formatPrice } from '@/lib/utils/format';
import { getColorHex } from '@/lib/utils/colorMapping';

export function ProductFilters() {
  const { filters, updateFilters, clearFilters } = useProductFilters();
  const { getSizeOptions, getColorOptions, isLoading: attributesLoading } = useProductAttributes();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  
  // --- STATE CHO DESKTOP ---
  const [pricePopoverOpen, setPricePopoverOpen] = useState(false);
  const [sizePopoverOpen, setSizePopoverOpen] = useState(false);
  const [colorPopoverOpen, setColorPopoverOpen] = useState(false);
  
  // --- STATE RIÊNG CHO MOBILE ---
  const [mobilePriceOpen, setMobilePriceOpen] = useState(false);
  const [mobileSizeOpen, setMobileSizeOpen] = useState(false);
  const [mobileColorOpen, setMobileColorOpen] = useState(false);

  
  // Local state cho giá trong Popover để tránh spam URL khi gõ
  const [localMinPrice, setLocalMinPrice] = useState<string>(filters.minPrice?.toString() || '');
  const [localMaxPrice, setLocalMaxPrice] = useState<string>(filters.maxPrice?.toString() || '');
  const [priceError, setPriceError] = useState<string>('');

  // Sync local state với filters từ URL khi filters thay đổi (từ bên ngoài)
  useEffect(() => {
    setLocalMinPrice(filters.minPrice?.toString() || '');
    setLocalMaxPrice(filters.maxPrice?.toString() || '');
    setPriceError(''); // Clear error khi sync từ URL
  }, [filters.minPrice, filters.maxPrice]);

  // Lấy size và color options động từ WooCommerce
  const sizeOptions = getSizeOptions();
  const colorOptions = getColorOptions();

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

  // Active filters for display as badges (excluding sortBy)
  const activeFilters = (() => {
    const active: Array<{ key: string; label: string; value: string; onRemove: () => void }> = [];
    
    if (filters.color) {
      active.push({
        key: 'color',
        label: 'Màu',
        value: filters.color,
        onRemove: () => updateFilters({ color: undefined }),
      });
    }
    
    if (filters.size) {
      active.push({
        key: 'size',
        label: 'Kích thước',
        value: filters.size,
        onRemove: () => updateFilters({ size: undefined }),
      });
    }
    
    if (filters.minPrice || filters.maxPrice) {
      const priceLabel = filters.minPrice && filters.maxPrice
        ? `${formatPrice(filters.minPrice)} - ${formatPrice(filters.maxPrice)}`
        : filters.minPrice
        ? `Từ ${formatPrice(filters.minPrice)}`
        : `Đến ${formatPrice(filters.maxPrice!)}`;
      active.push({
        key: 'price',
        label: 'Giá',
        value: priceLabel,
        onRemove: () => {
          updateFilters({ minPrice: undefined, maxPrice: undefined });
          setLocalMinPrice('');
          setLocalMaxPrice('');
        },
      });
    }
    
    if (filters.material) {
      active.push({
        key: 'material',
        label: 'Chất liệu',
        value: filters.material,
        onRemove: () => updateFilters({ material: undefined }),
      });
    }
    
    if (filters.category) {
      active.push({
        key: 'category',
        label: 'Danh mục',
        value: filters.category.split(',').length > 1 
          ? `${filters.category.split(',').length} danh mục`
          : filters.category,
        onRemove: () => updateFilters({ category: undefined }),
      });
    }
    
    return active;
  })();

  // Sort options
  const sortOptions = [
    { value: 'newest', label: 'Mới nhất', icon: Sparkles },
    { value: 'price_desc', label: 'Giá cao - thấp', icon: ArrowDownWideNarrow },
    { value: 'price_asc', label: 'Giá thấp - cao', icon: ArrowUpNarrowWide },
    { value: 'hot', label: 'Khuyến mãi hot', icon: Percent },
    { value: 'bestseller', label: 'Bán chạy nhất', icon: Crown },
  ];

  // Size và Color options được lấy động từ WooCommerce attributes
  // Format: { value: string, label: string } để tương thích với code hiện tại
  const sizeOptionsFormatted = sizeOptions.map(size => ({
    value: size,
    label: size,
  }));

  const colorOptionsFormatted = colorOptions.map(color => ({
    value: color,
    label: color,
  }));

  const handlePriceApply = () => {
    // Validate trước khi apply
    const min = localMinPrice ? Number(localMinPrice) : undefined;
    const max = localMaxPrice ? Number(localMaxPrice) : undefined;
    
    if (min !== undefined && max !== undefined && min > max) {
      setPriceError('Giá tối thiểu không được lớn hơn giá tối đa');
      return; // Không apply nếu validation fail
    }
    
    setPriceError('');
    // Update URL khi nhấn "Áp dụng"
    updateFilters({
      minPrice: min,
      maxPrice: max,
    });
    // Đóng cả 2 Popover (Desktop và Mobile)
    setPricePopoverOpen(false);
    setMobilePriceOpen(false);
  };

  const handleSizeSelect = (size: string) => {
    updateFilters({
      size: filters.size === size ? undefined : size,
    });
    // Đóng cả 2 Popover (Desktop và Mobile)
    setSizePopoverOpen(false);
    setMobileSizeOpen(false);
  };

  const handleColorSelect = (color: string) => {
    updateFilters({
      color: filters.color === color ? undefined : color,
    });
    // Đóng cả 2 Popover (Desktop và Mobile)
    setColorPopoverOpen(false);
    setMobileColorOpen(false);
  };

  // Ref để lấy current filter values từ FilterForm (khi mode='manual')
  const filterFormRef = useRef<FilterFormRef>(null);

  const handleApplyFilters = () => {
    if (filterFormRef.current) {
      const filtersToApply = filterFormRef.current.getFilters();
      updateFilters(filtersToApply);
      setIsSheetOpen(false);
    }
  };

  return (
    <>
      {/* Mobile: Horizontal Scrolling Bar (1 dòng duy nhất) - CHỈ hiển thị trên mobile */}
      <div className="lg:hidden sticky top-[64px] z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border/40">
        <div 
          className="flex flex-row items-center gap-2 overflow-x-auto scrollbar-hide py-2 flex-nowrap -mx-4 px-4 overflow-y-visible" 
          style={{ isolation: 'isolate' }}
          onTouchStart={(e) => {
            // Prevent scroll when clicking on buttons
            const target = e.target as HTMLElement;
            if (target.closest('button')) {
              e.stopPropagation();
            }
          }}
        >
          {/* Nút Lọc cố định bên trái */}
          <div className="flex-shrink-0">
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  className="rounded-full gap-1.5 h-8 px-3 border-border/60 hover:border-primary/50 text-xs"
                >
                  <Filter className="w-3.5 h-3.5" />
                  <span>Lọc</span>
                  {hasActiveFilters && (
                    <span className="ml-0.5 bg-primary text-primary-foreground rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center text-[10px] font-semibold">
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
                  <FilterForm 
                    ref={filterFormRef}
                    mode="manual"
                  />
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
                    onClick={handleApplyFilters}
                  >
                    Áp dụng
                  </Button>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </div>
          
          {/* Divider */}
          <div className="flex-shrink-0 w-px h-6 bg-border/60" />
          
          {/* Các nút scrollable */}
          <div className="flex flex-row items-center gap-2 flex-nowrap">

            {/* Nút Giá bán - Popover - MOBILE */}
            <Popover 
              open={mobilePriceOpen} 
              onOpenChange={setMobilePriceOpen}
              modal={false}
            >
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-full border text-xs flex-shrink-0 touch-manipulation transition-colors",
                    "border-border/60 hover:border-primary/50 bg-background hover:bg-accent",
                    (filters.minPrice || filters.maxPrice) && "border-primary text-primary bg-pink-50"
                  )}
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Giá</span>
                  {(filters.minPrice || filters.maxPrice) && (
                    <span className="text-[10px]">•</span>
                  )}
                  <ChevronDown className="w-3 h-3" />
                </button>
              </PopoverTrigger>
              <PopoverContent 
                className="w-80 z-[100]" 
                align="start" 
                side="bottom"
                sideOffset={8}
                onOpenAutoFocus={(e) => {
                  // Prevent auto focus from closing popover
                  e.preventDefault();
                }}
                onPointerDownOutside={(e) => {
                  const target = e.target as HTMLElement;
                  // Don't close if clicking inside PopoverContent or on trigger
                  if (target.closest('button[data-radix-popover-trigger]') || 
                      target.closest('[data-radix-popover-content]')) {
                    e.preventDefault();
                    return;
                  }
                  // Allow close when clicking outside (better UX on mobile)
                }}
                onInteractOutside={(e) => {
                  const target = e.target as HTMLElement;
                  const popoverContent = e.currentTarget as HTMLElement;
                  
                  // Check if click is inside PopoverContent itself
                  if (popoverContent && popoverContent.contains(target)) {
                    e.preventDefault();
                    return;
                  }
                  
                  // Don't close if clicking on trigger button
                  if (target.closest('button[data-radix-popover-trigger]')) {
                    e.preventDefault();
                    return;
                  }
                  // Allow close when clicking outside (better UX on mobile)
                }}
              >
                <div className="space-y-3">
                  {/* Header với nút đóng - MOBILE */}
                  <div className="flex items-center justify-between">
                    <h5 className="font-semibold text-sm text-text-main">Khoảng giá</h5>
                    <button
                      type="button"
                      onClick={() => setMobilePriceOpen(false)}
                      className="ml-auto p-1.5 rounded-full hover:bg-muted transition-colors touch-manipulation"
                      aria-label="Đóng"
                    >
                      <X className="w-4 h-4 text-text-muted" />
                    </button>
                  </div>
                
                {/* Price Presets */}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      setLocalMinPrice('');
                      setLocalMaxPrice('200000');
                      setPriceError('');
                    }}
                    className={cn(
                      "px-3 py-1.5 text-xs rounded-md border transition-colors",
                      localMaxPrice === '200000' && !localMinPrice
                        ? "border-primary bg-pink-50 text-primary font-medium"
                        : "border-border/60 hover:border-primary/50 hover:bg-muted/30"
                    )}
                  >
                    Dưới 200k
                  </button>
                  <button
                    onClick={() => {
                      setLocalMinPrice('200000');
                      setLocalMaxPrice('500000');
                      setPriceError('');
                    }}
                    className={cn(
                      "px-3 py-1.5 text-xs rounded-md border transition-colors",
                      localMinPrice === '200000' && localMaxPrice === '500000'
                        ? "border-primary bg-pink-50 text-primary font-medium"
                        : "border-border/60 hover:border-primary/50 hover:bg-muted/30"
                    )}
                  >
                    200k - 500k
                  </button>
                  <button
                    onClick={() => {
                      setLocalMinPrice('500000');
                      setLocalMaxPrice('1000000');
                      setPriceError('');
                    }}
                    className={cn(
                      "px-3 py-1.5 text-xs rounded-md border transition-colors",
                      localMinPrice === '500000' && localMaxPrice === '1000000'
                        ? "border-primary bg-pink-50 text-primary font-medium"
                        : "border-border/60 hover:border-primary/50 hover:bg-muted/30"
                    )}
                  >
                    500k - 1tr
                  </button>
                  <button
                    onClick={() => {
                      setLocalMinPrice('1000000');
                      setLocalMaxPrice('');
                      setPriceError('');
                    }}
                    className={cn(
                      "px-3 py-1.5 text-xs rounded-md border transition-colors",
                      localMinPrice === '1000000' && !localMaxPrice
                        ? "border-primary bg-pink-50 text-primary font-medium"
                        : "border-border/60 hover:border-primary/50 hover:bg-muted/30"
                    )}
                  >
                    Trên 1tr
                  </button>
                </div>
                
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Từ"
                    value={localMinPrice}
                    onChange={(e) => {
                      setLocalMinPrice(e.target.value);
                      // Validate khi nhập
                      const min = e.target.value ? Number(e.target.value) : undefined;
                      const max = localMaxPrice ? Number(localMaxPrice) : undefined;
                      if (min !== undefined && max !== undefined && min > max) {
                        setPriceError('Giá tối thiểu không được lớn hơn giá tối đa');
                      } else {
                        setPriceError('');
                      }
                    }}
                    className={cn("flex-1", priceError && "border-destructive")}
                  />
                  <Input
                    type="number"
                    placeholder="Đến"
                    value={localMaxPrice}
                    onChange={(e) => {
                      setLocalMaxPrice(e.target.value);
                      // Validate khi nhập
                      const min = localMinPrice ? Number(localMinPrice) : undefined;
                      const max = e.target.value ? Number(e.target.value) : undefined;
                      if (min !== undefined && max !== undefined && min > max) {
                        setPriceError('Giá tối thiểu không được lớn hơn giá tối đa');
                      } else {
                        setPriceError('');
                      }
                    }}
                    className={cn("flex-1", priceError && "border-destructive")}
                  />
                </div>
                {priceError && (
                  <p className="text-xs text-destructive">{priceError}</p>
                )}
                {(localMinPrice || localMaxPrice) && !priceError && (
                  <div className="text-xs text-text-muted">
                    {localMinPrice && localMaxPrice
                      ? `${formatPrice(Number(localMinPrice))} - ${formatPrice(Number(localMaxPrice))}`
                      : localMinPrice
                      ? `Từ ${formatPrice(Number(localMinPrice))}`
                      : `Đến ${formatPrice(Number(localMaxPrice))}`}
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setLocalMinPrice('');
                      setLocalMaxPrice('');
                      setPriceError('');
                      updateFilters({ minPrice: undefined, maxPrice: undefined });
                      // Đóng cả 2 Popover (Desktop và Mobile)
                      setPricePopoverOpen(false);
                      setMobilePriceOpen(false);
                    }}
                  >
                    Xóa
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      handlePriceApply();
                      setMobilePriceOpen(false); // Đóng mobile popover
                    }}
                    disabled={!!priceError}
                  >
                    Áp dụng
                  </Button>
                </div>
              </div>
              </PopoverContent>
            </Popover>

            {/* Nút Kích thước - Popover - MOBILE */}
            <Popover 
              open={mobileSizeOpen} 
              onOpenChange={setMobileSizeOpen}
              modal={false}
            >
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-full border text-xs flex-shrink-0 touch-manipulation transition-colors",
                    "border-border/60 hover:border-primary/50 bg-background hover:bg-accent",
                    filters.size && "border-primary text-primary bg-pink-50"
                  )}
                >
                  <Ruler className="w-3.5 h-3.5" />
                  <span>Size</span>
                  {filters.size && (
                    <span className="text-[10px]">•</span>
                  )}
                  <ChevronDown className="w-3 h-3" />
                </button>
              </PopoverTrigger>
              <PopoverContent 
                className="w-64 z-[100]" 
                align="start" 
                side="bottom"
                sideOffset={8}
                onOpenAutoFocus={(e) => {
                  e.preventDefault();
                }}
                onPointerDownOutside={(e) => {
                  const target = e.target as HTMLElement;
                  const popoverContent = e.currentTarget as HTMLElement;
                  // Don't close if clicking inside PopoverContent or on trigger
                  if (popoverContent && popoverContent.contains(target)) {
                    e.preventDefault();
                    return;
                  }
                  if (target.closest('button[data-radix-popover-trigger]')) {
                    e.preventDefault();
                    return;
                  }
                  // Allow close when clicking outside (better UX on mobile)
                }}
                onInteractOutside={(e) => {
                  const target = e.target as HTMLElement;
                  const popoverContent = e.currentTarget as HTMLElement;
                  // CRITICAL: Check if click is inside PopoverContent itself
                  if (popoverContent && popoverContent.contains(target)) {
                    e.preventDefault();
                    return;
                  }
                  // Don't close if clicking on trigger button
                  if (target.closest('button[data-radix-popover-trigger]')) {
                    e.preventDefault();
                    return;
                  }
                  // Allow close when clicking outside (better UX on mobile)
                }}
              >
                <div className="space-y-3">
                  {/* Header với nút đóng - MOBILE */}
                  <div className="flex items-center justify-between">
                    <h5 className="font-semibold text-sm text-text-main">Chọn kích thước</h5>
                    <button
                      type="button"
                      onClick={() => setMobileSizeOpen(false)}
                      className="ml-auto p-1.5 rounded-full hover:bg-muted transition-colors touch-manipulation"
                      aria-label="Đóng"
                    >
                      <X className="w-4 h-4 text-text-muted" />
                    </button>
                  </div>
                {attributesLoading ? (
                  <div className="text-sm text-text-muted py-4 text-center">Đang tải...</div>
                ) : sizeOptionsFormatted.length === 0 ? (
                  <div className="text-sm text-text-muted py-4 text-center">Không có tùy chọn</div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {sizeOptionsFormatted.map((option) => {
                      const isSelected = filters.size === option.value;
                      // Map size labels to cm ranges
                      const sizeCmMap: Record<string, string> = {
                        'Nhỏ': '< 30cm',
                        'Vừa': '30-50cm',
                        'Lớn': '50-80cm',
                        'Rất lớn': '> 80cm',
                      };
                      const sizeCm = sizeCmMap[option.label] || '';
                      return (
                        <button
                          key={option.value}
                          onClick={() => {
                            handleSizeSelect(option.value);
                            setMobileSizeOpen(false); // Đóng mobile popover
                          }}
                          className={cn(
                            "text-left px-3 py-2 rounded-sm border transition-colors",
                            isSelected
                              ? "border-primary bg-pink-50 text-primary font-medium"
                              : "border-border hover:border-primary/50 hover:bg-muted/50"
                          )}
                        >
                          <div className="font-medium">{option.label}</div>
                          {sizeCm && (
                            <div className="text-xs text-text-muted mt-0.5">{sizeCm}</div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
                {filters.size && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      updateFilters({ size: undefined });
                      // Đóng cả 2 Popover (Desktop và Mobile)
                      setSizePopoverOpen(false);
                      setMobileSizeOpen(false);
                    }}
                  >
                    Xóa lọc
                  </Button>
                )}
              </div>
              </PopoverContent>
            </Popover>

            {/* Nút Màu sắc - Popover - MOBILE */}
            <Popover 
              open={mobileColorOpen} 
              onOpenChange={setMobileColorOpen}
              modal={false}
            >
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-full border text-xs flex-shrink-0 touch-manipulation transition-colors",
                    "border-border/60 hover:border-primary/50 bg-background hover:bg-accent",
                    filters.color && "border-primary text-primary bg-pink-50"
                  )}
                >
                  <Palette className="w-3.5 h-3.5" />
                  <span>Màu</span>
                  {filters.color && (
                    <span className="text-[10px]">•</span>
                  )}
                  <ChevronDown className="w-3 h-3" />
                </button>
              </PopoverTrigger>
              <PopoverContent 
                className="w-72 z-[100]" 
                align="start" 
                side="bottom"
                sideOffset={8}
                onOpenAutoFocus={(e) => {
                  e.preventDefault();
                }}
                onPointerDownOutside={(e) => {
                  const target = e.target as HTMLElement;
                  const popoverContent = e.currentTarget as HTMLElement;
                  // Don't close if clicking inside PopoverContent or on trigger
                  if (popoverContent && popoverContent.contains(target)) {
                    e.preventDefault();
                    return;
                  }
                  if (target.closest('button[data-radix-popover-trigger]')) {
                    e.preventDefault();
                    return;
                  }
                  // Allow close when clicking outside (better UX on mobile)
                }}
                onInteractOutside={(e) => {
                  const target = e.target as HTMLElement;
                  const popoverContent = e.currentTarget as HTMLElement;
                  // CRITICAL: Check if click is inside PopoverContent itself
                  if (popoverContent && popoverContent.contains(target)) {
                    e.preventDefault();
                    return;
                  }
                  // Don't close if clicking on trigger button
                  if (target.closest('button[data-radix-popover-trigger]')) {
                    e.preventDefault();
                    return;
                  }
                  // Allow close when clicking outside (better UX on mobile)
                }}
              >
                <div className="space-y-3">
                  {/* Header với nút đóng - MOBILE */}
                  <div className="flex items-center justify-between">
                    <h5 className="font-semibold text-sm text-text-main">Chọn màu sắc</h5>
                    <button
                      type="button"
                      onClick={() => setMobileColorOpen(false)}
                      className="ml-auto p-1.5 rounded-full hover:bg-muted transition-colors touch-manipulation"
                      aria-label="Đóng"
                    >
                      <X className="w-4 h-4 text-text-muted" />
                    </button>
                  </div>
                {attributesLoading ? (
                  <div className="text-sm text-text-muted py-4 text-center">Đang tải...</div>
                ) : colorOptionsFormatted.length === 0 ? (
                  <div className="text-sm text-text-muted py-4 text-center">Không có tùy chọn</div>
                ) : (
                  <div className="grid grid-cols-6 gap-3">
                    {colorOptionsFormatted.map((option) => {
                      const isSelected = filters.color === option.value;
                      const colorHex = getColorHex(option.value) || '#E5E7EB'; // Fallback to gray
                      return (
                        <button
                          key={option.value}
                          onClick={() => {
                            handleColorSelect(option.value);
                            setMobileColorOpen(false); // Đóng mobile popover
                          }}
                          className={cn(
                            "relative w-8 h-8 rounded-full transition-all",
                            "border-2 border-transparent",
                            isSelected
                              ? "ring-2 ring-offset-2 ring-primary ring-offset-white"
                              : "hover:ring-2 hover:ring-offset-2 hover:ring-primary/30 hover:ring-offset-white"
                          )}
                          style={{ backgroundColor: colorHex }}
                          title={option.label}
                          aria-label={option.label}
                        >
                          {isSelected && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Check className="w-4 h-4 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
                {filters.color && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      updateFilters({ color: undefined });
                      // Đóng cả 2 Popover (Desktop và Mobile)
                      setColorPopoverOpen(false);
                      setMobileColorOpen(false);
                    }}
                  >
                    Xóa lọc
                  </Button>
                )}
              </div>
              </PopoverContent>
            </Popover>
            
            {/* Sort Options - Mobile */}
            {sortOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = filters.sortBy === option.value || 
                (!filters.sortBy && option.value === 'newest');
              const actualSelected = filters.sortBy === option.value;
              
              return (
                <button
                  key={option.value}
                  onClick={() => {
                    if (actualSelected) {
                      updateFilters({ sortBy: undefined });
                    } else {
                      let sortValue: 'price_asc' | 'price_desc' | 'name_asc' | 'name_desc' | 'newest' | undefined;
                      if (option.value === 'hot' || option.value === 'bestseller') {
                        sortValue = 'newest';
                      } else {
                        sortValue = option.value as typeof sortValue;
                      }
                      updateFilters({ sortBy: sortValue });
                    }
                  }}
                  type="button"
                  className={cn(
                    "flex items-center gap-1 px-2.5 h-8 rounded-full border whitespace-nowrap transition-all flex-shrink-0 text-xs touch-manipulation",
                    isSelected
                      ? "border-primary bg-pink-50 text-primary font-medium"
                      : "border-border/60 bg-white text-text-muted hover:border-primary/50 hover:text-text-main"
                  )}
                >
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{option.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Desktop: Layout cũ (giữ nguyên) - CHỈ hiển thị trên desktop */}
      <div className="hidden lg:block w-full space-y-4 mb-4">
        {/* Dòng 1: Chọn theo tiêu chí (Filter Group) */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-text-main">Chọn theo tiêu chí</h4>
          <div className="flex flex-row flex-wrap gap-2">
            {/* Nút Giá bán - Popover */}
            <Popover open={pricePopoverOpen} onOpenChange={setPricePopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "rounded-md gap-2 h-9 border-border/60 hover:border-primary/50",
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
                  
                  {/* Price Presets */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        setLocalMinPrice('');
                        setLocalMaxPrice('200000');
                        setPriceError('');
                      }}
                      className={cn(
                        "px-3 py-1.5 text-xs rounded-md border transition-colors",
                        localMaxPrice === '200000' && !localMinPrice
                          ? "border-primary bg-pink-50 text-primary font-medium"
                          : "border-border/60 hover:border-primary/50 hover:bg-muted/30"
                      )}
                    >
                      Dưới 200k
                    </button>
                    <button
                      onClick={() => {
                        setLocalMinPrice('200000');
                        setLocalMaxPrice('500000');
                        setPriceError('');
                      }}
                      className={cn(
                        "px-3 py-1.5 text-xs rounded-md border transition-colors",
                        localMinPrice === '200000' && localMaxPrice === '500000'
                          ? "border-primary bg-pink-50 text-primary font-medium"
                          : "border-border/60 hover:border-primary/50 hover:bg-muted/30"
                      )}
                    >
                      200k - 500k
                    </button>
                    <button
                      onClick={() => {
                        setLocalMinPrice('500000');
                        setLocalMaxPrice('1000000');
                        setPriceError('');
                      }}
                      className={cn(
                        "px-3 py-1.5 text-xs rounded-md border transition-colors",
                        localMinPrice === '500000' && localMaxPrice === '1000000'
                          ? "border-primary bg-pink-50 text-primary font-medium"
                          : "border-border/60 hover:border-primary/50 hover:bg-muted/30"
                      )}
                    >
                      500k - 1tr
                    </button>
                    <button
                      onClick={() => {
                        setLocalMinPrice('1000000');
                        setLocalMaxPrice('');
                        setPriceError('');
                      }}
                      className={cn(
                        "px-3 py-1.5 text-xs rounded-md border transition-colors",
                        localMinPrice === '1000000' && !localMaxPrice
                          ? "border-primary bg-pink-50 text-primary font-medium"
                          : "border-border/60 hover:border-primary/50 hover:bg-muted/30"
                      )}
                    >
                      Trên 1tr
                    </button>
                  </div>
                  
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Từ"
                      value={localMinPrice}
                      onChange={(e) => {
                        setLocalMinPrice(e.target.value);
                        const min = e.target.value ? Number(e.target.value) : undefined;
                        const max = localMaxPrice ? Number(localMaxPrice) : undefined;
                        if (min !== undefined && max !== undefined && min > max) {
                          setPriceError('Giá tối thiểu không được lớn hơn giá tối đa');
                        } else {
                          setPriceError('');
                        }
                      }}
                      className={cn("flex-1", priceError && "border-destructive")}
                    />
                    <Input
                      type="number"
                      placeholder="Đến"
                      value={localMaxPrice}
                      onChange={(e) => {
                        setLocalMaxPrice(e.target.value);
                        const min = localMinPrice ? Number(localMinPrice) : undefined;
                        const max = e.target.value ? Number(e.target.value) : undefined;
                        if (min !== undefined && max !== undefined && min > max) {
                          setPriceError('Giá tối thiểu không được lớn hơn giá tối đa');
                        } else {
                          setPriceError('');
                        }
                      }}
                      className={cn("flex-1", priceError && "border-destructive")}
                    />
                  </div>
                  {priceError && (
                    <p className="text-xs text-destructive">{priceError}</p>
                  )}
                  {(localMinPrice || localMaxPrice) && !priceError && (
                    <div className="text-xs text-text-muted">
                      {localMinPrice && localMaxPrice
                        ? `${formatPrice(Number(localMinPrice))} - ${formatPrice(Number(localMaxPrice))}`
                        : localMinPrice
                        ? `Từ ${formatPrice(Number(localMinPrice))}`
                        : `Đến ${formatPrice(Number(localMaxPrice))}`}
                    </div>
                  )}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setLocalMinPrice('');
                        setLocalMaxPrice('');
                        setPriceError('');
                        updateFilters({ minPrice: undefined, maxPrice: undefined });
                        setPricePopoverOpen(false);
                      }}
                    >
                      Xóa
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={handlePriceApply}
                      disabled={!!priceError}
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
                    "rounded-md gap-2 h-9 border-border/60 hover:border-primary/50",
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
                  {attributesLoading ? (
                    <div className="text-sm text-text-muted py-4 text-center">Đang tải...</div>
                  ) : sizeOptionsFormatted.length === 0 ? (
                    <div className="text-sm text-text-muted py-4 text-center">Không có tùy chọn</div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {sizeOptionsFormatted.map((option) => {
                        const isSelected = filters.size === option.value;
                        const sizeCmMap: Record<string, string> = {
                          'Nhỏ': '< 30cm',
                          'Vừa': '30-50cm',
                          'Lớn': '50-80cm',
                          'Rất lớn': '> 80cm',
                        };
                        const sizeCm = sizeCmMap[option.label] || '';
                        return (
                        <button
                          key={option.value}
                          onClick={() => {
                            handleSizeSelect(option.value);
                            setMobileSizeOpen(false); // Đóng mobile popover
                          }}
                          className={cn(
                            "text-left px-3 py-2 rounded-sm border transition-colors",
                            isSelected
                              ? "border-primary bg-pink-50 text-primary font-medium"
                              : "border-border hover:border-primary/50 hover:bg-muted/50"
                          )}
                        >
                          <div className="font-medium">{option.label}</div>
                          {sizeCm && (
                            <div className="text-xs text-text-muted mt-0.5">{sizeCm}</div>
                          )}
                        </button>
                        );
                      })}
                    </div>
                  )}
                  {filters.size && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        updateFilters({ size: undefined });
                        setSizePopoverOpen(false);
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
                    "rounded-md gap-2 h-9 border-border/60 hover:border-primary/50",
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
              <PopoverContent className="w-72" align="start">
                <div className="space-y-3">
                  <h5 className="font-semibold text-sm text-text-main">Chọn màu sắc</h5>
                  {attributesLoading ? (
                    <div className="text-sm text-text-muted py-4 text-center">Đang tải...</div>
                  ) : colorOptionsFormatted.length === 0 ? (
                    <div className="text-sm text-text-muted py-4 text-center">Không có tùy chọn</div>
                  ) : (
                    <div className="grid grid-cols-6 gap-3">
                      {colorOptionsFormatted.map((option) => {
                        const isSelected = filters.color === option.value;
                        const colorHex = getColorHex(option.value) || '#E5E7EB';
                        return (
                          <button
                            key={option.value}
                            onClick={() => handleColorSelect(option.value)}
                            className={cn(
                              "relative w-8 h-8 rounded-full transition-all",
                              "border-2 border-transparent",
                              isSelected
                                ? "ring-2 ring-offset-2 ring-primary ring-offset-white"
                                : "hover:ring-2 hover:ring-offset-2 hover:ring-primary/30 hover:ring-offset-white"
                            )}
                            style={{ backgroundColor: colorHex }}
                            title={option.label}
                            aria-label={option.label}
                          >
                            {isSelected && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <Check className="w-4 h-4 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {filters.color && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        updateFilters({ color: undefined });
                        setColorPopoverOpen(false);
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

        {/* Dòng 2: Sắp xếp theo (Sort Group) - Desktop */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-text-main">Sắp xếp theo</h4>
          <div className="flex gap-2 flex-wrap">
            {sortOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = filters.sortBy === option.value || 
                (!filters.sortBy && option.value === 'newest');
              const actualSelected = filters.sortBy === option.value;
              
              return (
                <button
                  key={option.value}
                  onClick={() => {
                    if (actualSelected) {
                      updateFilters({ sortBy: undefined });
                    } else {
                      let sortValue: 'price_asc' | 'price_desc' | 'name_asc' | 'name_desc' | 'newest' | undefined;
                      if (option.value === 'hot' || option.value === 'bestseller') {
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
                      ? "border-primary bg-pink-50 text-primary font-medium shadow-sm"
                      : "border-border/60 bg-white text-text-muted hover:border-primary/50 hover:text-text-main hover:bg-muted/30"
                  )}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm">{option.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Active Filters Section - Hiển thị cho cả Mobile và Desktop */}
      {activeFilters.length > 0 && (
        <div className="w-full space-y-2 mt-4 md:mt-0">
          <h4 className="text-sm font-semibold text-text-main hidden md:block">Bộ lọc đang áp dụng</h4>
          <div className="flex flex-wrap gap-2">
            {activeFilters.map((filter) => (
              <div
                key={filter.key}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-pink-50 border border-primary/20 text-sm"
              >
                <span className="text-text-main">
                  <span className="font-medium">{filter.label}:</span>{' '}
                  <span className="text-text-muted">{filter.value}</span>
                </span>
                <button
                  onClick={filter.onRemove}
                  className="ml-1 hover:bg-primary/10 rounded-full p-0.5 transition-colors"
                  aria-label={`Xóa bộ lọc ${filter.label}`}
                >
                  <X className="w-3.5 h-3.5 text-text-muted hover:text-primary" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
