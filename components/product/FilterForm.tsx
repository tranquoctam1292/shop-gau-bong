'use client';

import { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useProductFilters, type ProductFilters as ProductFiltersType } from '@/lib/hooks/useProductFilters';
import { useCategoriesREST } from '@/lib/hooks/useCategoriesREST';
import { useProductAttributes } from '@/lib/hooks/useProductAttributes';
import { cn } from '@/lib/utils/cn';

interface FilterFormProps {
  className?: string;
  /**
   * Mode: 'auto' = apply ngay khi thay đổi (Desktop), 'manual' = chỉ apply khi nhấn nút (Mobile Sheet)
   */
  mode?: 'auto' | 'manual';
}

export interface FilterFormRef {
  getFilters: () => {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    material?: string;
    sortBy?: ProductFiltersType['sortBy'];
  };
}

/**
 * FilterForm - Sub-component chứa form lọc sản phẩm
 * Tái sử dụng cho cả Mobile (trong Sheet) và Desktop (trong Sidebar)
 */
export const FilterForm = forwardRef<FilterFormRef, FilterFormProps>(
  ({ className, mode = 'auto' }, ref) => {
  const { filters, updateFilters } = useProductFilters();
  const { categories, loading: categoriesLoading } = useCategoriesREST();
  const { getMaterialOptions, isLoading: attributesLoading } = useProductAttributes();
  
  // Local state cho tất cả filters (dùng khi mode='manual')
  const [localCategory, setLocalCategory] = useState<string>(filters.category || '');
  const [localMinPrice, setLocalMinPrice] = useState<string>(filters.minPrice?.toString() || '');
  const [localMaxPrice, setLocalMaxPrice] = useState<string>(filters.maxPrice?.toString() || '');
  const [localMaterial, setLocalMaterial] = useState<string>(filters.material || '');
  const [localSortBy, setLocalSortBy] = useState<string>(filters.sortBy || '');
  
  // Validation state cho price range
  const [priceError, setPriceError] = useState<string>('');

  // Lấy material options động từ WooCommerce
  const materialOptions = getMaterialOptions();

  // Sync local state với filters từ URL khi filters thay đổi (từ bên ngoài)
  useEffect(() => {
    setLocalCategory(filters.category || '');
    setLocalMinPrice(filters.minPrice?.toString() || '');
    setLocalMaxPrice(filters.maxPrice?.toString() || '');
    setLocalMaterial(filters.material || '');
    setLocalSortBy(filters.sortBy || '');
  }, [filters.category, filters.minPrice, filters.maxPrice, filters.material, filters.sortBy]);

  // Expose getFilters function qua ref để parent component có thể lấy current filter values
  useImperativeHandle(ref, () => ({
    getFilters: () => {
      // Validate price range trước khi return
      const min = localMinPrice ? Number(localMinPrice) : undefined;
      const max = localMaxPrice ? Number(localMaxPrice) : undefined;
      
      if (min !== undefined && max !== undefined && min > max) {
        // Return với error flag để parent component có thể xử lý
        throw new Error('Giá tối thiểu không được lớn hơn giá tối đa');
      }
      
      return {
        category: localCategory || undefined,
        minPrice: min,
        maxPrice: max,
        material: localMaterial || undefined,
        sortBy: (localSortBy as ProductFiltersType['sortBy']) || undefined,
      };
    },
  }), [localCategory, localMinPrice, localMaxPrice, localMaterial, localSortBy]);

  return (
    <div className={`space-y-4 ${className || ''}`}>
      {/* Category Filter */}
      <div>
        <label className="block text-sm font-medium text-text-main mb-2">
          Danh mục
        </label>
        <Select
          value={mode === 'manual' ? localCategory : (filters.category || '')}
          onChange={(e) => {
            if (mode === 'auto') {
              updateFilters({ category: e.target.value || undefined });
            } else {
              setLocalCategory(e.target.value);
            }
          }}
        >
          <option value="">Tất cả danh mục</option>
          {categoriesLoading ? (
            <option disabled>Đang tải...</option>
          ) : (
            categories.map((category) => (
              <option key={category.id} value={category.slug || category.databaseId?.toString()}>
                {category.name} ({category.count || 0})
              </option>
            ))
          )}
        </Select>
      </div>

      {/* Price Range */}
      <div>
        <label className="block text-sm font-medium text-text-main mb-2">
          Khoảng giá
        </label>
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
            onBlur={(e) => {
              // Validate trước khi apply
              const min = e.target.value ? Number(e.target.value) : undefined;
              const max = localMaxPrice ? Number(localMaxPrice) : undefined;
              
              if (min !== undefined && max !== undefined && min > max) {
                setPriceError('Giá tối thiểu không được lớn hơn giá tối đa');
                return; // Không apply nếu validation fail
              }
              
              setPriceError('');
              // Chỉ update URL khi blur nếu mode='auto' và validation pass
              if (mode === 'auto') {
                updateFilters({
                  minPrice: min,
                });
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
            onBlur={(e) => {
              // Validate trước khi apply
              const min = localMinPrice ? Number(localMinPrice) : undefined;
              const max = e.target.value ? Number(e.target.value) : undefined;
              
              if (min !== undefined && max !== undefined && min > max) {
                setPriceError('Giá tối thiểu không được lớn hơn giá tối đa');
                return; // Không apply nếu validation fail
              }
              
              setPriceError('');
              // Chỉ update URL khi blur nếu mode='auto' và validation pass
              if (mode === 'auto') {
                updateFilters({
                  maxPrice: max,
                });
              }
            }}
            className={cn("flex-1", priceError && "border-destructive")}
          />
        </div>
        {priceError && (
          <p className="text-xs text-destructive mt-1">{priceError}</p>
        )}
      </div>

      {/* Material Filter */}
      <div>
        <label className="block text-sm font-medium text-text-main mb-2">
          Chất liệu
        </label>
        <Select
          value={mode === 'manual' ? localMaterial : (filters.material || '')}
          onChange={(e) => {
            if (mode === 'auto') {
              updateFilters({ material: e.target.value || undefined });
            } else {
              setLocalMaterial(e.target.value);
            }
          }}
          disabled={attributesLoading}
        >
          <option value="">Tất cả</option>
          {attributesLoading ? (
            <option disabled>Đang tải...</option>
          ) : (
            materialOptions.map((material) => (
              <option key={material} value={material}>
                {material}
              </option>
            ))
          )}
        </Select>
      </div>

      {/* Sort */}
      <div>
        <label className="block text-sm font-medium text-text-main mb-2">
          Sắp xếp
        </label>
        <Select
          value={mode === 'manual' ? localSortBy : (filters.sortBy || '')}
          onChange={(e) => {
            if (mode === 'auto') {
              updateFilters({
                sortBy: (e.target.value as ProductFiltersType['sortBy']) || undefined,
              });
            } else {
              setLocalSortBy(e.target.value);
            }
          }}
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
  );
  }
);

FilterForm.displayName = 'FilterForm';

