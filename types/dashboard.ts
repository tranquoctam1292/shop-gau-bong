/**
 * Dashboard Type Definitions
 * 
 * TypeScript interfaces for Dashboard module
 * Used by API routes, hooks, and components
 */

/**
 * Dashboard date range options
 */
export type DashboardDateRange = 'today' | 'yesterday' | 'last7Days' | 'thisWeek' | 'thisMonth' | 'lastMonth' | 'custom';

/**
 * Today's sales statistics
 */
export interface TodayStats {
  revenue: number;
  orderCount: number;
  refunds: number;
}

/**
 * Revenue chart data point
 */
export interface ChartDataPoint {
  date: string; // ISO date string or formatted date
  revenue: number;
  orderCount: number;
}

/**
 * Revenue chart data with metadata
 */
export interface RevenueChartData {
  data: ChartDataPoint[];
  totalRevenue: number;
  totalOrders: number;
  dateRange: {
    start: string;
    end: string;
  };
  groupBy: 'day' | 'hour' | 'week';
}

/**
 * Top product statistics
 */
export interface TopProduct {
  productId: string;
  productName: string;
  revenue: number;
  quantity: number;
  averagePrice: number;
}

/**
 * Top customer statistics
 */
export interface TopCustomer {
  customerEmail: string;
  customerName: string;
  revenue: number;
  orderCount: number;
  averageOrderValue: number;
}

/**
 * Dashboard stats options
 */
export interface DashboardStatsOptions {
  dateRange?: DashboardDateRange; // Optional, defaults to 'today'
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
  groupBy?: 'day' | 'hour' | 'week';
}

/**
 * Top products options
 */
export interface TopProductsOptions {
  dateRange?: DashboardDateRange; // Optional, defaults to 'thisMonth'
  startDate?: string;
  endDate?: string;
  sortBy?: 'revenue' | 'quantity';
  limit?: number; // Default: 10
}

/**
 * Top customers options
 */
export interface TopCustomersOptions {
  dateRange?: DashboardDateRange; // Optional, defaults to 'thisMonth'
  startDate?: string;
  endDate?: string;
  limit?: number; // Default: 10
}

/**
 * API Response format for dashboard stats
 */
export interface DashboardStatsResponse {
  success: true;
  data: {
    todayStats: TodayStats;
    revenueChart?: RevenueChartData;
  };
  meta?: {
    dateRange: {
      start: string;
      end: string;
    };
    groupBy?: 'day' | 'hour' | 'week';
  };
}

/**
 * API Response format for top products
 */
export interface TopProductsResponse {
  success: true;
  data: {
    products: TopProduct[];
    totalRevenue: number;
    totalQuantity: number;
  };
  meta?: {
    dateRange: {
      start: string;
      end: string;
    };
    sortBy: 'revenue' | 'quantity';
    limit: number;
  };
}

/**
 * API Response format for top customers
 */
export interface TopCustomersResponse {
  success: true;
  data: {
    customers: TopCustomer[];
    totalRevenue: number;
    totalOrders: number;
  };
  meta?: {
    dateRange: {
      start: string;
      end: string;
    };
    limit: number;
  };
}

/**
 * API Error response format
 */
export interface DashboardErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: {
    stack?: string; // Only in development
    [key: string]: unknown;
  };
}

