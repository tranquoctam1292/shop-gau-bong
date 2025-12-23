/**
 * React Query hooks for Dashboard
 * 
 * Hooks for fetching dashboard statistics, charts, and top lists
 */

import { useQuery } from '@tanstack/react-query';
import type {
  DashboardStatsResponse,
  DashboardStatsOptions,
  TopProductsResponse,
  TopProductsOptions,
  TopCustomersResponse,
  TopCustomersOptions,
  DashboardErrorResponse,
} from '@/types/dashboard';

/**
 * Fetch dashboard stats (today stats + revenue chart)
 */
async function fetchDashboardStats(
  options: DashboardStatsOptions = {}
): Promise<DashboardStatsResponse> {
  const searchParams = new URLSearchParams();
  
  searchParams.set('dateRange', options.dateRange ?? 'today');
  if (options.startDate) searchParams.set('startDate', options.startDate);
  if (options.endDate) searchParams.set('endDate', options.endDate);
  if (options.groupBy) searchParams.set('groupBy', options.groupBy);

  const response = await fetch(`/api/admin/dashboard/stats?${searchParams.toString()}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    const error: DashboardErrorResponse = await response.json();
    throw new Error(error.error || 'Failed to fetch dashboard stats');
  }

  return response.json();
}

/**
 * Fetch top products
 */
async function fetchTopProducts(
  options: TopProductsOptions = {}
): Promise<TopProductsResponse> {
  const searchParams = new URLSearchParams();
  
  searchParams.set('dateRange', options.dateRange ?? 'thisMonth');
  if (options.startDate) searchParams.set('startDate', options.startDate);
  if (options.endDate) searchParams.set('endDate', options.endDate);
  if (options.sortBy) searchParams.set('sortBy', options.sortBy);
  if (options.limit) searchParams.set('limit', options.limit.toString());

  const response = await fetch(`/api/admin/dashboard/top-products?${searchParams.toString()}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    const error: DashboardErrorResponse = await response.json();
    throw new Error(error.error || 'Failed to fetch top products');
  }

  return response.json();
}

/**
 * Fetch top customers
 */
async function fetchTopCustomers(
  options: TopCustomersOptions = {}
): Promise<TopCustomersResponse> {
  const searchParams = new URLSearchParams();
  
  searchParams.set('dateRange', options.dateRange ?? 'thisMonth');
  if (options.startDate) searchParams.set('startDate', options.startDate);
  if (options.endDate) searchParams.set('endDate', options.endDate);
  if (options.limit) searchParams.set('limit', options.limit.toString());

  const response = await fetch(`/api/admin/dashboard/top-customers?${searchParams.toString()}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    const error: DashboardErrorResponse = await response.json();
    throw new Error(error.error || 'Failed to fetch top customers');
  }

  return response.json();
}

/**
 * Hook to fetch today's stats only
 * Returns: { revenue, orderCount, refunds }
 */
export function useTodayStats() {
  return useQuery({
    queryKey: ['dashboard-stats', 'today'],
    queryFn: () => fetchDashboardStats({ dateRange: 'today' }),
    staleTime: 30 * 1000, // 30 seconds
    select: (data) => data.data.todayStats, // Extract only todayStats
  });
}

/**
 * Hook to fetch revenue chart data
 * Returns: RevenueChartData with chart points
 */
export function useRevenueChart(options: DashboardStatsOptions = {}) {
  return useQuery({
    queryKey: ['dashboard-revenue-chart', options],
    queryFn: () => fetchDashboardStats(options),
    staleTime: 30 * 1000, // 30 seconds
    select: (data) => data.data.revenueChart, // Extract only revenueChart
  });
}

/**
 * Hook to fetch top products
 * Returns: TopProductsResponse
 */
export function useTopProducts(options: TopProductsOptions = {}) {
  return useQuery({
    queryKey: ['dashboard-top-products', options],
    queryFn: () => fetchTopProducts(options),
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook to fetch top customers
 * Returns: TopCustomersResponse
 */
export function useTopCustomers(options: TopCustomersOptions = {}) {
  return useQuery({
    queryKey: ['dashboard-top-customers', options],
    queryFn: () => fetchTopCustomers(options),
    staleTime: 30 * 1000, // 30 seconds
  });
}

