'use client';

import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useProductFilters, type ProductFilters as ProductFiltersType } from '@/lib/hooks/useProductFilters';
import { useCategoriesREST } from '@/lib/hooks/useCategoriesREST';

interface FilterFormProps {
  className?: string;
}

/**
 * FilterForm - Sub-component chứa form lọc sản phẩm
 * Tái sử dụng cho cả Mobile (trong Sheet) và Desktop (trong Sidebar)
 */
export function FilterForm({ className }: FilterFormProps) {
  const { filters, updateFilters } = useProductFilters();
  const { categories, loading: categoriesLoading } = useCategoriesREST();

  return (
    <div className={`space-y-4 ${className || ''}`}>
      {/* Category Filter */}
      <div>
        <label className="block text-sm font-medium text-text-main mb-2">
          Danh mục
        </label>
        <Select
          value={filters.category || ''}
          onChange={(e) =>
            updateFilters({ category: e.target.value || undefined })
          }
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
  );
}

