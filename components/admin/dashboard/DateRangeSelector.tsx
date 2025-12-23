'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { DashboardDateRange } from '@/types/dashboard';

interface DateRangeSelectorProps {
  value: DashboardDateRange;
  onValueChange: (value: DashboardDateRange) => void;
}

export function DateRangeSelector({ value, onValueChange }: DateRangeSelectorProps) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="date-range-selector" className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Khoảng thời gian
      </label>
      <Select 
        value={value} 
        onValueChange={(val) => onValueChange(val as DashboardDateRange)}
      >
        <SelectTrigger 
          id="date-range-selector" 
          className="w-[180px] min-h-[44px]"
          aria-label="Chọn khoảng thời gian"
        >
          <SelectValue placeholder="Chọn khoảng thời gian" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="today">Hôm nay</SelectItem>
          <SelectItem value="yesterday">Hôm qua</SelectItem>
          <SelectItem value="last7Days">7 ngày qua</SelectItem>
          <SelectItem value="thisMonth">Tháng này</SelectItem>
          <SelectItem value="lastMonth">Tháng trước</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

