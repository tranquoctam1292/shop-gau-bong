/**
 * Order Filters Component
 * 
 * Advanced filters for Order List:
 * - Date range (From - To)
 * - Status multi-select
 * - Channel select
 * - Payment method select
 * - Payment status select
 * - Search input
 * - Sort options
 * - Clear all filters
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { X, Calendar, Filter, ChevronDown } from 'lucide-react';
import { getStatusLabel, getStatusColor, type OrderStatus } from '@/lib/utils/orderStateMachine';

export interface OrderFilters {
  // Date range
  fromDate?: string;
  toDate?: string;
  // Status (multiple)
  statuses?: string[];
  // Channel
  channel?: string;
  // Payment
  paymentMethod?: string;
  paymentStatus?: string;
  // Search
  search?: string;
  // Sort
  sortBy?: 'createdAt' | 'total' | 'status';
  sortOrder?: 'asc' | 'desc';
}

interface OrderFiltersProps {
  filters: OrderFilters;
  onFiltersChange: (filters: OrderFilters) => void;
  onClear: () => void;
}

const ALL_STATUSES: OrderStatus[] = [
  'pending',
  'awaiting_payment',
  'confirmed',
  'processing',
  'shipping',
  'completed',
  'cancelled',
  'refunded',
  'failed',
];

const CHANNELS = [
  { value: 'website', label: 'Website' },
  { value: 'app', label: 'Mobile App' },
  { value: 'pos', label: 'POS' },
];

const PAYMENT_METHODS = [
  { value: 'cod', label: 'Thanh toán khi nhận hàng (COD)' },
  { value: 'bank_transfer', label: 'Chuyển khoản ngân hàng' },
  { value: 'vietqr', label: 'VietQR' },
  { value: 'momo', label: 'MoMo' },
  { value: 'stripe', label: 'Stripe' },
];

const PAYMENT_STATUSES = [
  { value: 'pending', label: 'Chờ thanh toán' },
  { value: 'paid', label: 'Đã thanh toán' },
  { value: 'failed', label: 'Thanh toán thất bại' },
  { value: 'refunded', label: 'Đã hoàn tiền' },
];

const SORT_OPTIONS = [
  { value: 'createdAt-desc', label: 'Mới nhất' },
  { value: 'createdAt-asc', label: 'Cũ nhất' },
  { value: 'total-desc', label: 'Giá cao nhất' },
  { value: 'total-asc', label: 'Giá thấp nhất' },
  { value: 'status-asc', label: 'Trạng thái A-Z' },
  { value: 'status-desc', label: 'Trạng thái Z-A' },
];

export function OrderFilters({ filters, onFiltersChange, onClear }: OrderFiltersProps) {
  // Mobile/Desktop separate state for Popovers
  const [mobileStatusOpen, setMobileStatusOpen] = useState(false);
  const [statusPopoverOpen, setStatusPopoverOpen] = useState(false);

  // Local state for filters
  const [localFilters, setLocalFilters] = useState<OrderFilters>(filters);

  // Sync local state with props
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleFilterChange = (key: keyof OrderFilters, value: any) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleStatusToggle = (status: string) => {
    const currentStatuses = localFilters.statuses || [];
    const newStatuses = currentStatuses.includes(status)
      ? currentStatuses.filter((s) => s !== status)
      : [...currentStatuses, status];
    handleFilterChange('statuses', newStatuses.length > 0 ? newStatuses : undefined);
  };

  const handleSortChange = (sortValue: string) => {
    const [sortBy, sortOrder] = sortValue.split('-');
    handleFilterChange('sortBy', sortBy);
    handleFilterChange('sortOrder', sortOrder as 'asc' | 'desc');
  };

  const getSortValue = () => {
    const sortBy = localFilters.sortBy || 'createdAt';
    const sortOrder = localFilters.sortOrder || 'desc';
    return `${sortBy}-${sortOrder}`;
  };

  const hasActiveFilters = () => {
    return !!(
      localFilters.fromDate ||
      localFilters.toDate ||
      (localFilters.statuses && localFilters.statuses.length > 0) ||
      localFilters.channel ||
      localFilters.paymentMethod ||
      localFilters.paymentStatus ||
      localFilters.search ||
      localFilters.sortBy !== 'createdAt' ||
      localFilters.sortOrder !== 'desc'
    );
  };

  const handleClear = () => {
    setLocalFilters({});
    onClear();
  };

  // Count active filters
  const activeFilterCount =
    (localFilters.statuses?.length || 0) +
    (localFilters.fromDate ? 1 : 0) +
    (localFilters.toDate ? 1 : 0) +
    (localFilters.channel ? 1 : 0) +
    (localFilters.paymentMethod ? 1 : 0) +
    (localFilters.paymentStatus ? 1 : 0) +
    (localFilters.search ? 1 : 0);

  return (
    <div className="space-y-4">
      {/* Mobile Filters - Horizontal Scroll Bar */}
      <div className="lg:hidden">
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          {/* Search */}
          <div className="flex-shrink-0 w-64">
            <Input
              placeholder="Tìm kiếm đơn hàng..."
              value={localFilters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value || undefined)}
              className="w-full"
            />
          </div>

          {/* Status Filter - Mobile Popover */}
          <Popover open={mobileStatusOpen} onOpenChange={setMobileStatusOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="flex-shrink-0 whitespace-nowrap"
              >
                <Filter className="w-4 h-4 mr-2" />
                Trạng thái
                {localFilters.statuses && localFilters.statuses.length > 0 && (
                  <span className="ml-2 bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
                    {localFilters.statuses.length}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="start">
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-sm">Lọc theo trạng thái</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setMobileStatusOpen(false)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {ALL_STATUSES.map((status) => {
                    const isChecked = localFilters.statuses?.includes(status) || false;
                    return (
                      <label
                        key={status}
                        className="flex items-center space-x-2 cursor-pointer py-2 hover:bg-accent rounded px-2"
                      >
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={() => handleStatusToggle(status)}
                        />
                        <span className="text-sm flex-1">{getStatusLabel(status)}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-xs ${getStatusColor(status)}`}
                        >
                          {getStatusLabel(status)}
                        </span>
                      </label>
                    );
                  })}
                </div>
                <div className="flex gap-2 pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      handleFilterChange('statuses', ALL_STATUSES);
                    }}
                    className="flex-1"
                  >
                    Chọn tất cả
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      handleFilterChange('statuses', undefined);
                    }}
                    className="flex-1"
                  >
                    Bỏ chọn
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Date Range - Mobile */}
          <div className="flex-shrink-0 flex gap-2">
            <Input
              type="date"
              placeholder="Từ ngày"
              value={localFilters.fromDate || ''}
              onChange={(e) => handleFilterChange('fromDate', e.target.value || undefined)}
              className="w-32"
            />
            <Input
              type="date"
              placeholder="Đến ngày"
              value={localFilters.toDate || ''}
              onChange={(e) => handleFilterChange('toDate', e.target.value || undefined)}
              className="w-32"
            />
          </div>

          {/* Sort - Mobile */}
          <Select
            value={getSortValue()}
            onChange={(e) => handleSortChange(e.target.value)}
            className="flex-shrink-0 w-40"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>

          {/* Clear Filters */}
          {hasActiveFilters() && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClear}
              className="flex-shrink-0"
            >
              <X className="w-4 h-4 mr-2" />
              Xóa bộ lọc
            </Button>
          )}
        </div>
      </div>

      {/* Desktop Filters - Static Layout */}
      <div className="hidden lg:grid lg:grid-cols-12 lg:gap-4">
        {/* Search */}
        <div className="lg:col-span-3">
          <Label htmlFor="search" className="text-sm font-medium mb-2 block">
            Tìm kiếm
          </Label>
          <Input
            id="search"
            placeholder="Mã đơn, Email, SĐT..."
            value={localFilters.search || ''}
            onChange={(e) => handleFilterChange('search', e.target.value || undefined)}
          />
        </div>

        {/* Date Range */}
        <div className="lg:col-span-2">
          <Label className="text-sm font-medium mb-2 block">Từ ngày</Label>
          <Input
            type="date"
            value={localFilters.fromDate || ''}
            onChange={(e) => handleFilterChange('fromDate', e.target.value || undefined)}
          />
        </div>
        <div className="lg:col-span-2">
          <Label className="text-sm font-medium mb-2 block">Đến ngày</Label>
          <Input
            type="date"
            value={localFilters.toDate || ''}
            onChange={(e) => handleFilterChange('toDate', e.target.value || undefined)}
          />
        </div>

        {/* Status Filter - Desktop Popover */}
        <div className="lg:col-span-2">
          <Label className="text-sm font-medium mb-2 block">Trạng thái</Label>
          <Popover open={statusPopoverOpen} onOpenChange={setStatusPopoverOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                <span>
                  {localFilters.statuses && localFilters.statuses.length > 0
                    ? `${localFilters.statuses.length} đã chọn`
                    : 'Tất cả'}
                </span>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="start">
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-sm">Lọc theo trạng thái</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setStatusPopoverOpen(false)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {ALL_STATUSES.map((status) => {
                    const isChecked = localFilters.statuses?.includes(status) || false;
                    return (
                      <label
                        key={status}
                        className="flex items-center space-x-2 cursor-pointer py-2 hover:bg-accent rounded px-2"
                      >
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={() => handleStatusToggle(status)}
                        />
                        <span className="text-sm flex-1">{getStatusLabel(status)}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-xs ${getStatusColor(status)}`}
                        >
                          {getStatusLabel(status)}
                        </span>
                      </label>
                    );
                  })}
                </div>
                <div className="flex gap-2 pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      handleFilterChange('statuses', ALL_STATUSES);
                    }}
                    className="flex-1"
                  >
                    Chọn tất cả
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      handleFilterChange('statuses', undefined);
                    }}
                    className="flex-1"
                  >
                    Bỏ chọn
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Channel */}
        <div className="lg:col-span-1">
          <Label className="text-sm font-medium mb-2 block">Kênh</Label>
          <Select
            value={localFilters.channel || ''}
            onChange={(e) =>
              handleFilterChange('channel', e.target.value || undefined)
            }
          >
            <option value="">Tất cả</option>
            {CHANNELS.map((channel) => (
              <option key={channel.value} value={channel.value}>
                {channel.label}
              </option>
            ))}
          </Select>
        </div>

        {/* Payment Method */}
        <div className="lg:col-span-1">
          <Label className="text-sm font-medium mb-2 block">Thanh toán</Label>
          <Select
            value={localFilters.paymentMethod || ''}
            onChange={(e) =>
              handleFilterChange('paymentMethod', e.target.value || undefined)
            }
          >
            <option value="">Tất cả</option>
            {PAYMENT_METHODS.map((method) => (
              <option key={method.value} value={method.value}>
                {method.label}
              </option>
            ))}
          </Select>
        </div>

        {/* Sort */}
        <div className="lg:col-span-1">
          <Label className="text-sm font-medium mb-2 block">Sắp xếp</Label>
          <Select value={getSortValue()} onChange={(e) => handleSortChange(e.target.value)}>
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters() && (
          <div className="lg:col-span-1 flex items-end">
            <Button variant="outline" onClick={handleClear} className="w-full">
              <X className="w-4 h-4 mr-2" />
              Xóa bộ lọc
            </Button>
          </div>
        )}
      </div>

      {/* Active Filters Summary */}
      {activeFilterCount > 0 && (
        <div className="flex items-center gap-2 flex-wrap text-sm text-muted-foreground">
          <span>Đang lọc:</span>
          {localFilters.statuses && localFilters.statuses.length > 0 && (
            <span className="px-2 py-1 bg-accent rounded">
              {localFilters.statuses.length} trạng thái
            </span>
          )}
          {localFilters.fromDate && (
            <span className="px-2 py-1 bg-accent rounded">
              Từ: {new Date(localFilters.fromDate).toLocaleDateString('vi-VN')}
            </span>
          )}
          {localFilters.toDate && (
            <span className="px-2 py-1 bg-accent rounded">
              Đến: {new Date(localFilters.toDate).toLocaleDateString('vi-VN')}
            </span>
          )}
          {localFilters.channel && (
            <span className="px-2 py-1 bg-accent rounded">
              Kênh: {CHANNELS.find((c) => c.value === localFilters.channel)?.label}
            </span>
          )}
          {localFilters.paymentMethod && (
            <span className="px-2 py-1 bg-accent rounded">
              PT: {PAYMENT_METHODS.find((m) => m.value === localFilters.paymentMethod)?.label}
            </span>
          )}
          {localFilters.paymentStatus && (
            <span className="px-2 py-1 bg-accent rounded">
              TT: {PAYMENT_STATUSES.find((s) => s.value === localFilters.paymentStatus)?.label}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

