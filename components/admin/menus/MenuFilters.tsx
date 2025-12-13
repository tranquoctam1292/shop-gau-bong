'use client';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Filter, X, ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface MenuFiltersState {
  location: string | null;
  status: 'active' | 'inactive' | 'all';
  search: string;
}

interface MenuFiltersProps {
  filters: MenuFiltersState;
  onFilterChange: (key: keyof MenuFiltersState, value: any) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

const LOCATION_OPTIONS = [
  { value: 'header', label: 'Header' },
  { value: 'footer', label: 'Footer' },
  { value: 'mobile-sidebar', label: 'Mobile Sidebar' },
  { value: 'footer-column-1', label: 'Footer Column 1' },
  { value: 'footer-column-2', label: 'Footer Column 2' },
  { value: 'footer-column-3', label: 'Footer Column 3' },
];

export function MenuFilters({
  filters,
  onFilterChange,
  onClearFilters,
  hasActiveFilters,
}: MenuFiltersProps) {
  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.location) count++;
    if (filters.status !== 'all') count++;
    return count;
  };

  const activeFilterCount = getActiveFilterCount();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="relative">
          <Filter className="w-4 h-4 mr-2" />
          Bộ lọc
          {activeFilterCount > 0 && (
            <Badge className="ml-2 px-2 py-0.5 rounded-full text-xs font-bold">
              {activeFilterCount}
            </Badge>
          )}
          <ChevronDown className="w-4 h-4 ml-2 -mr-1 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4 space-y-4" align="start">
        <div className="flex items-center justify-between">
          <h4 className="font-medium">Lọc menu</h4>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={onClearFilters} className="h-auto px-2 py-1 text-xs">
              <X className="w-3 h-3 mr-1" /> Xóa tất cả
            </Button>
          )}
        </div>

        {/* Location Filter */}
        <div className="space-y-2">
          <Label htmlFor="location-filter" className="text-sm">Vị trí</Label>
          <Select
            value={filters.location || 'all'}
            onValueChange={(value) => onFilterChange('location', value === 'all' ? null : value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Tất cả vị trí" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả vị trí</SelectItem>
              {LOCATION_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Status Filter */}
        <div className="space-y-2">
          <Label htmlFor="status-filter" className="text-sm">Trạng thái</Label>
          <Select
            value={filters.status}
            onValueChange={(value: MenuFiltersState['status']) => onFilterChange('status', value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Tất cả" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="active">Hoạt động</SelectItem>
              <SelectItem value="inactive">Tạm dừng</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </PopoverContent>
    </Popover>
  );
}

