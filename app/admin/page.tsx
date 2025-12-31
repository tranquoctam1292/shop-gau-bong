'use client';

import { useState } from 'react';
import { TodayStatsCards } from '@/components/admin/dashboard/TodayStatsCards';
import { RevenueChart } from '@/components/admin/dashboard/RevenueChart';
import { TopProductsChart } from '@/components/admin/dashboard/TopProductsChart';
import { TopCustomersList } from '@/components/admin/dashboard/TopCustomersList';
import { InventoryWidget } from '@/components/admin/dashboard/InventoryWidget';
import { DateRangeSelector } from '@/components/admin/dashboard/DateRangeSelector';
import { getGroupByForDateRange } from '@/lib/utils/dateRange';
import type { DashboardDateRange } from '@/types/dashboard';

export default function AdminDashboard() {
  const [dateRange, setDateRange] = useState<DashboardDateRange>('thisMonth');

  // Auto-select groupBy based on date range
  const groupBy = getGroupByForDateRange(dateRange);

  return (
    <div className="space-y-6">
      {/* Header with Date Range Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
        <DateRangeSelector value={dateRange} onValueChange={setDateRange} />
      </div>

      {/* Stats Cards */}
      <TodayStatsCards options={{ dateRange }} />

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-3">
          <RevenueChart options={{ dateRange, groupBy }} />
        </div>

        {/* Top Products Chart */}
        <div className="lg:col-span-1">
          <TopProductsChart options={{ dateRange, limit: 10 }} />
        </div>

        {/* Top Customers List */}
        <div className="lg:col-span-1">
          <TopCustomersList options={{ dateRange, limit: 5 }} />
        </div>

        {/* Inventory Widget */}
        <div className="lg:col-span-1">
          <InventoryWidget />
        </div>
      </div>
    </div>
  );
}

