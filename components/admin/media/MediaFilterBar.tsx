'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Search } from 'lucide-react';
import type { MediaType, MediaSort } from '@/types/media';

export interface MediaFilters {
  search?: string;
  type?: MediaType;
  sort?: MediaSort;
  folder?: string;
}

interface MediaFilterBarProps {
  filters: MediaFilters;
  onFiltersChange: (filters: MediaFilters) => void;
  className?: string;
}

/**
 * MediaFilterBar Component
 * 
 * Search, filter, and sort controls for media library
 */
export function MediaFilterBar({
  filters,
  onFiltersChange,
  className,
}: MediaFilterBarProps) {
  const [searchValue, setSearchValue] = useState(filters.search || '');

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    onFiltersChange({ ...filters, search: value || undefined });
  };

  const handleTypeChange = (type: string) => {
    onFiltersChange({
      ...filters,
      type: type === 'all' ? undefined : (type as MediaType),
    });
  };

  const handleSortChange = (sort: string) => {
    onFiltersChange({
      ...filters,
      sort: sort as MediaSort,
    });
  };

  const handleFolderChange = (folder: string) => {
    onFiltersChange({
      ...filters,
      folder: folder || undefined,
    });
  };

  const clearFilters = () => {
    setSearchValue('');
    onFiltersChange({});
  };

  const hasActiveFilters = Boolean(
    filters.search || filters.type || filters.folder || filters.sort !== 'newest'
  );

  return (
    <div className={`flex flex-col gap-4 md:flex-row md:items-center md:justify-between ${className || ''}`}>
      {/* Search */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Tìm kiếm media..."
          value={searchValue}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-10 pr-10"
        />
        {searchValue && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            onClick={() => handleSearchChange('')}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {/* Type Filter */}
        <Select
          value={filters.type || 'all'}
          onValueChange={handleTypeChange}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Loại" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="image">Ảnh</SelectItem>
            <SelectItem value="video">Video</SelectItem>
            <SelectItem value="document">Tài liệu</SelectItem>
            <SelectItem value="other">Khác</SelectItem>
          </SelectContent>
        </Select>

        {/* Sort */}
        <Select
          value={filters.sort || 'newest'}
          onValueChange={handleSortChange}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Sắp xếp" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Mới nhất</SelectItem>
            <SelectItem value="oldest">Cũ nhất</SelectItem>
            <SelectItem value="name">Tên A-Z</SelectItem>
            <SelectItem value="size">Kích thước</SelectItem>
          </SelectContent>
        </Select>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearFilters}
          >
            <X className="h-4 w-4 mr-2" />
            Xóa bộ lọc
          </Button>
        )}
      </div>
    </div>
  );
}
