'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { TodayStatsCards } from '@/components/admin/dashboard/TodayStatsCards';
import { RevenueChart } from '@/components/admin/dashboard/RevenueChart';
import { TopProductsChart } from '@/components/admin/dashboard/TopProductsChart';
import { TopCustomersList } from '@/components/admin/dashboard/TopCustomersList';
import { DateRangeSelector } from '@/components/admin/dashboard/DateRangeSelector';
import { getGroupByForDateRange } from '@/lib/utils/dateRange';
import type { DashboardDateRange } from '@/types/dashboard';

export default function AdminDashboard() {
  const { data: session } = useSession();
  const [dateRange, setDateRange] = useState<DashboardDateRange>('thisMonth');

  // Auto-select groupBy based on date range
  const groupBy = getGroupByForDateRange(dateRange);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Chào mừng, {session?.user?.name || session?.user?.email}
        </p>
      </div>

      {/* Date Range Selector */}
      <div className="flex justify-end">
        <DateRangeSelector value={dateRange} onValueChange={setDateRange} />
      </div>

      {/* Today Stats Cards */}
      <TodayStatsCards />

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2">
          <RevenueChart options={{ dateRange, groupBy }} />
        </div>

        {/* Top Products Chart */}
        <TopProductsChart options={{ dateRange, limit: 10 }} />

        {/* Top Customers List */}
        <TopCustomersList options={{ dateRange, limit: 5 }} />
      </div>
    </div>
  );
}

