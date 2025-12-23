/**
 * Admin Dashboard Stats API Route
 * GET /api/admin/dashboard/stats - Get dashboard statistics
 * 
 * Protected route - requires authentication and order:read permission
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCollections } from '@/lib/db';
import { withAuthAdmin, AuthenticatedRequest } from '@/lib/middleware/authMiddleware';
import { getDateRange, getDateToStringFormat } from '@/lib/utils/dateRange';
import type { TodayStats, ChartDataPoint, RevenueChartData, DashboardStatsResponse, DashboardErrorResponse, DashboardDateRange } from '@/types/dashboard';

export const dynamic = 'force-dynamic';

/**
 * ✅ FIX: Helper function to ensure JSON response even for initialization errors
 */
async function safeHandler(
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    return await handler();
  } catch (error: unknown) {
    console.error('[Admin Dashboard Stats API] Handler initialization error:', error);
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Internal server error';
    
    return NextResponse.json(
      { 
        success: false,
        error: errorMessage,
        code: 'HANDLER_INIT_ERROR',
        details: process.env.NODE_ENV === 'development' && error instanceof Error
          ? { 
              stack: error.stack,
              name: error.name,
            }
          : undefined,
      },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}

/**
 * Calculate today's statistics
 */
async function calculateTodayStats(): Promise<TodayStats> {
  // ✅ FIX: Wrap getCollections in try-catch to handle MongoDB connection errors
  let orders, refunds;
  try {
    const collections = await getCollections();
    orders = collections.orders;
    refunds = collections.refunds;
  } catch (dbError) {
    console.error('[Admin Dashboard Stats API] MongoDB connection error:', dbError);
    throw new Error('Database connection failed');
  }
  const { start, end } = getDateRange('today');

  // Calculate revenue and order count from confirmed orders (not just completed)
  // Revenue includes: confirmed, processing, shipping, completed orders
  // For COD orders: include if status is confirmed+ (paymentStatus may be 'pending')
  // For online payment: include if paymentStatus = 'paid'
  const todayStatsPipeline = [
    {
      $match: {
        createdAt: { $gte: start, $lt: end },
        status: { $nin: ['cancelled', 'failed', 'pending', 'awaiting_payment', 'refunded'] },
      },
    },
    {
      $group: {
        _id: null,
        revenue: {
          $sum: {
            $cond: [
              {
                $or: [
                  // COD orders: status is confirmed+ (paymentStatus may be 'pending')
                  { $eq: ['$paymentMethod', 'cod'] },
                  // Non-COD orders: paymentStatus must be 'paid'
                  { $eq: ['$paymentStatus', 'paid'] },
                ],
              },
              { $toDouble: { $ifNull: ['$grandTotal', 0] } },
              0,
            ],
          },
        },
        orderCount: { $sum: 1 },
      },
    },
  ];

  const todayStatsResult = await orders.aggregate(todayStatsPipeline).toArray();
  const stats = todayStatsResult[0] || { revenue: 0, orderCount: 0 };

  // Calculate refunds count
  // Option 1: Use refunds collection if exists
  let refundsCount = 0;
  try {
    const refundsList = await refunds
      .find({
        createdAt: { $gte: start, $lt: end },
        status: { $in: ['pending', 'processing', 'completed'] },
      })
      .toArray();
    refundsCount = refundsList.length;
  } catch (error) {
    // Option 2: Fallback to orders with refunded status
    // This handles cases where refunds collection might not be accessible
    refundsCount = await orders.countDocuments({
      createdAt: { $gte: start, $lt: end },
      paymentStatus: 'refunded',
    });
  }

  return {
    revenue: stats.revenue || 0,
    orderCount: stats.orderCount || 0,
    refunds: refundsCount,
  };
}

/**
 * Calculate revenue chart data
 */
async function calculateRevenueChart(
  dateRange: DashboardDateRange,
  startDate?: string,
  endDate?: string,
  groupBy: 'day' | 'hour' | 'week' = 'day'
): Promise<RevenueChartData | null> {
  // ✅ FIX: Wrap getCollections in try-catch to handle MongoDB connection errors
  let orders;
  try {
    const collections = await getCollections();
    orders = collections.orders;
  } catch (dbError) {
    console.error('[Admin Dashboard Stats API] MongoDB connection error:', dbError);
    throw new Error('Database connection failed');
  }
  
  // Get date range
  const range = getDateRange(dateRange, startDate, endDate);
  if (range.error) {
    return null;
  }

  const { start, end } = range;

  // Get date format for grouping
  const dateFormat = getDateToStringFormat(groupBy);

  // Aggregation pipeline
  // Include confirmed, processing, shipping, completed orders
  // For COD: include if status is confirmed+
  // For online payment: include if paymentStatus = 'paid'
  const pipeline = [
    {
      $match: {
        createdAt: { $gte: start, $lte: end },
        status: { $in: ['confirmed', 'processing', 'shipping', 'completed'] },
        $or: [
          { paymentMethod: 'cod' },
          { paymentStatus: 'paid' },
        ],
      },
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: dateFormat,
            date: '$createdAt',
            timezone: 'Asia/Ho_Chi_Minh',
          },
        },
        revenue: { $sum: { $toDouble: { $ifNull: ['$grandTotal', 0] } } },
        orderCount: { $sum: 1 },
      },
    },
    {
      $sort: { _id: 1 },
    },
    {
      $project: {
        _id: 0,
        date: '$_id',
        revenue: 1,
        orderCount: 1,
      },
    },
  ];

  const chartData = await orders.aggregate(pipeline, { allowDiskUse: true }).toArray();

  // Calculate totals
  const totalRevenue = chartData.reduce((sum, item) => sum + (item.revenue || 0), 0);
  const totalOrders = chartData.reduce((sum, item) => sum + (item.orderCount || 0), 0);

  return {
    data: chartData as ChartDataPoint[],
    totalRevenue,
    totalOrders,
    dateRange: {
      start: start.toISOString(),
      end: end.toISOString(),
    },
    groupBy,
  };
}

export async function GET(request: NextRequest) {
  // ✅ FIX: Wrap entire handler in safeHandler to catch initialization errors
  return safeHandler(async () => {
    return await withAuthAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      // Permission: order:read (checked by middleware)
      const searchParams = req.nextUrl.searchParams;
      const dateRangeParam = searchParams.get('dateRange') || 'today';
      const startDate = searchParams.get('startDate') || undefined;
      const endDate = searchParams.get('endDate') || undefined;
      const groupBy = (searchParams.get('groupBy') || 'day') as 'day' | 'hour' | 'week';
      const includeChart = searchParams.get('includeChart') !== 'false'; // Default: true

      // Validate dateRange parameter
      const validDateRanges: DashboardDateRange[] = ['today', 'yesterday', 'last7Days', 'thisWeek', 'thisMonth', 'lastMonth', 'custom'];
      if (!validDateRanges.includes(dateRangeParam as DashboardDateRange)) {
        return NextResponse.json(
          {
            success: false,
            error: `Invalid dateRange. Must be one of: ${validDateRanges.join(', ')}`,
            code: 'INVALID_DATE_RANGE',
          } as DashboardErrorResponse,
          { status: 400 }
        );
      }

      const dateRange = dateRangeParam as DashboardDateRange;

      // ✅ FIX: Cache date range calculation (avoid calling getDateRange twice)
      const dateRangeResult = getDateRange(dateRange, startDate, endDate);
      
      // Handle getDateRange errors
      if (dateRangeResult.error) {
        return NextResponse.json(
          {
            success: false,
            error: dateRangeResult.error,
            code: 'INVALID_DATE_RANGE',
          } as DashboardErrorResponse,
          { status: 400 }
        );
      }

      // Calculate today stats
      const todayStats = await calculateTodayStats();

      // Calculate revenue chart if requested
      let revenueChart: RevenueChartData | null = null;
      if (includeChart) {
        revenueChart = await calculateRevenueChart(dateRange, startDate, endDate, groupBy);
      }

      const response: DashboardStatsResponse = {
        success: true,
        data: {
          todayStats,
          ...(revenueChart && { revenueChart }),
        },
        meta: {
          dateRange: {
            start: dateRangeResult.start.toISOString(),
            end: dateRangeResult.end.toISOString(),
          },
          groupBy,
        },
      };

      return NextResponse.json(response);
    } catch (error: unknown) {
      console.error('[Admin Dashboard Stats API] Error:', error);
      
      const errorResponse: DashboardErrorResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch dashboard stats',
        code: 'DASHBOARD_STATS_ERROR',
        details:
          process.env.NODE_ENV === 'development'
            ? {
                stack: error instanceof Error ? error.stack : undefined,
              }
            : undefined,
      };

      return NextResponse.json(errorResponse, { status: 500 });
    }
    }, 'order:read');
  });
}

