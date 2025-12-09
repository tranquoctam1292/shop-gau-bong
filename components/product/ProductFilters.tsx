'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useProductFilters, type ProductFilters as ProductFiltersType } from '@/lib/hooks/useProductFilters';
import { useCategoriesREST } from '@/lib/hooks/useCategoriesREST';

export function ProductFilters() {
  const { filters, updateFilters, clearFilters } = useProductFilters();
  const { categories, loading: categoriesLoading } = useCategoriesREST();
  const [isOpen, setIsOpen] = useState(false);

  const hasActiveFilters = 
    filters.category || 
    filters.minPrice || 
    filters.maxPrice || 
    filters.material || 
    filters.sortBy;

  return (
    <div className="w-full">
      {/* Mobile: Collapsible Filter Button */}
      <div className="md:hidden mb-4">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? 'Đóng bộ lọc' : 'Bộ lọc sản phẩm'}
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
          <h3 className="font-heading text-lg font-semibold mb-4">
            Bộ lọc
          </h3>

          <div className="space-y-4">
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
                    sortBy: (e.target.value as typeof filters.sortBy) || undefined,
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

            {/* Clear Filters */}
            {hasActiveFilters && (
              <Button
                variant="outline"
                className="w-full"
                onClick={clearFilters}
              >
                Xóa bộ lọc
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

