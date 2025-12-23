/**
 * Admin Dashboard Top Customers API Route
 * GET /api/admin/dashboard/top-customers - Get top spending customers
 * 
 * Protected route - requires authentication and order:read permission
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCollections } from '@/lib/db';
import { withAuthAdmin, AuthenticatedRequest } from '@/lib/middleware/authMiddleware';
import { getDateRange } from '@/lib/utils/dateRange';
import type { TopCustomer, TopCustomersResponse, DashboardErrorResponse, DashboardDateRange } from '@/types/dashboard';

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
    console.error('[Admin Dashboard Top Customers API] Handler initialization error:', error);
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

export async function GET(request: NextRequest) {
  // ✅ FIX: Wrap entire handler in safeHandler to catch initialization errors
  return safeHandler(async () => {
    return await withAuthAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      // Permission: order:read (checked by middleware)
      const searchParams = req.nextUrl.searchParams;
      const dateRangeParam = searchParams.get('dateRange') || 'thisMonth';
      const startDate = searchParams.get('startDate') || undefined;
      const endDate = searchParams.get('endDate') || undefined;
      const limit = parseInt(searchParams.get('limit') || '10', 10);

      // Validate limit
      if (limit < 1 || limit > 100) {
        return NextResponse.json(
          {
            success: false,
            error: 'Limit must be between 1 and 100',
            code: 'INVALID_LIMIT',
          } as DashboardErrorResponse,
          { status: 400 }
        );
      }

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

      // Get date range
      const range = getDateRange(dateRange, startDate, endDate);
      if (range.error) {
        return NextResponse.json(
          {
            success: false,
            error: range.error,
            code: 'INVALID_DATE_RANGE',
          } as DashboardErrorResponse,
          { status: 400 }
        );
      }

      const { start, end } = range;
      
      // ✅ FIX: Wrap getCollections in try-catch to handle MongoDB connection errors
      let orders;
      try {
        const collections = await getCollections();
        orders = collections.orders;
      } catch (dbError) {
        console.error('[Admin Dashboard Top Customers API] MongoDB connection error:', dbError);
        return NextResponse.json(
          {
            success: false,
            error: 'Database connection failed',
            code: 'DB_CONNECTION_ERROR',
            details: process.env.NODE_ENV === 'development' && dbError instanceof Error
              ? { message: dbError.message }
              : undefined,
          } as DashboardErrorResponse,
          {
            status: 500,
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
      }

      // Aggregation pipeline to get top customers
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
            customerEmail: { $exists: true, $nin: [null, ''] }, // Filter out null/undefined emails
          },
        },
        {
          $group: {
            _id: '$customerEmail',
            customerName: { $first: '$customerName' },
            revenue: { $sum: { $toDouble: { $ifNull: ['$grandTotal', 0] } } },
            orderCount: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            customerEmail: '$_id',
            customerName: { $ifNull: ['$customerName', 'Khách hàng'] }, // Fallback if name is missing
            revenue: 1,
            orderCount: 1,
            averageOrderValue: {
              $cond: [
                { $gt: ['$orderCount', 0] },
                { $divide: ['$revenue', '$orderCount'] },
                0,
              ],
            },
          },
        },
        {
          $sort: { revenue: -1 },
        },
        {
          $limit: limit,
        },
      ];

      const topCustomers = await orders.aggregate(pipeline, { allowDiskUse: true }).toArray();

      // Calculate totals
      const totalRevenue = topCustomers.reduce((sum, customer) => sum + (customer.revenue || 0), 0);
      const totalOrders = topCustomers.reduce((sum, customer) => sum + (customer.orderCount || 0), 0);

      const response: TopCustomersResponse = {
        success: true,
        data: {
          customers: topCustomers as TopCustomer[],
          totalRevenue,
          totalOrders,
        },
        meta: {
          dateRange: {
            start: start.toISOString(),
            end: end.toISOString(),
          },
          limit,
        },
      };

      return NextResponse.json(response);
    } catch (error: unknown) {
      console.error('[Admin Dashboard Top Customers API] Error:', error);

      const errorResponse: DashboardErrorResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch top customers',
        code: 'TOP_CUSTOMERS_ERROR',
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

