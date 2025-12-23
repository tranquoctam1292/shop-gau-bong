/**
 * Admin Dashboard Top Products API Route
 * GET /api/admin/dashboard/top-products - Get top selling products
 * 
 * Protected route - requires authentication and order:read permission
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCollections } from '@/lib/db';
import { withAuthAdmin, AuthenticatedRequest } from '@/lib/middleware/authMiddleware';
import { getDateRange } from '@/lib/utils/dateRange';
import type { TopProduct, TopProductsResponse, DashboardErrorResponse, DashboardDateRange } from '@/types/dashboard';

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
    console.error('[Admin Dashboard Top Products API] Handler initialization error:', error);
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
      const sortBy = (searchParams.get('sortBy') || 'revenue') as 'revenue' | 'quantity';
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
      let orders, orderItems;
      try {
        const collections = await getCollections();
        orders = collections.orders;
        orderItems = collections.orderItems;
      } catch (dbError) {
        console.error('[Admin Dashboard Top Products API] MongoDB connection error:', dbError);
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

      // ✅ FIX: Order items are stored in separate collection, need to query orderItems collection directly
      
      // Get order IDs that match our criteria first
      const matchingOrders = await orders
        .find({
          createdAt: { $gte: start, $lte: end },
          status: { $in: ['confirmed', 'processing', 'shipping', 'completed'] },
          $or: [
            { paymentMethod: 'cod' },
            { paymentStatus: 'paid' },
          ],
        })
        .project({ _id: 1 })
        .toArray();

      const orderIds = matchingOrders.map((order) => order._id.toString());

      // If no matching orders, return empty result
      if (orderIds.length === 0) {
        return NextResponse.json({
          success: true,
          data: {
            products: [],
            totalRevenue: 0,
            totalQuantity: 0,
          },
          meta: {
            dateRange: {
              start: start.toISOString(),
              end: end.toISOString(),
            },
            sortBy,
            limit,
          },
        });
      }

      // Aggregate order items by product
      const pipeline = [
        {
          $match: {
            orderId: { $in: orderIds },
          },
        },
        {
          $group: {
            _id: '$productId',
            productName: { $first: '$productName' }, // Use snapshot from order items
            revenue: {
              $sum: {
                $multiply: [
                  { $toDouble: { $ifNull: ['$price', 0] } },
                  { $toInt: { $ifNull: ['$quantity', 0] } },
                ],
              },
            },
            quantity: { $sum: { $toInt: { $ifNull: ['$quantity', 0] } } },
          },
        },
        {
          $project: {
            _id: 0,
            productId: '$_id',
            productName: { $ifNull: ['$productName', 'Sản phẩm đã xóa'] }, // Fallback if productName is missing
            revenue: 1,
            quantity: 1,
            averagePrice: {
              $cond: [
                { $gt: ['$quantity', 0] },
                { $divide: ['$revenue', '$quantity'] },
                0,
              ],
            },
          },
        },
        {
          $sort: sortBy === 'revenue' ? { revenue: -1 } : { quantity: -1 },
        },
        {
          $limit: limit,
        },
      ];

      const topProducts = await orderItems.aggregate(pipeline, { allowDiskUse: true }).toArray();

      // Calculate totals
      const totalRevenue = topProducts.reduce((sum, product) => sum + (product.revenue || 0), 0);
      const totalQuantity = topProducts.reduce((sum, product) => sum + (product.quantity || 0), 0);

      const response: TopProductsResponse = {
        success: true,
        data: {
          products: topProducts as TopProduct[],
          totalRevenue,
          totalQuantity,
        },
        meta: {
          dateRange: {
            start: start.toISOString(),
            end: end.toISOString(),
          },
          sortBy,
          limit,
        },
      };

      return NextResponse.json(response);
    } catch (error: unknown) {
      console.error('[Admin Dashboard Top Products API] Error:', error);

      const errorResponse: DashboardErrorResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch top products',
        code: 'TOP_PRODUCTS_ERROR',
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

