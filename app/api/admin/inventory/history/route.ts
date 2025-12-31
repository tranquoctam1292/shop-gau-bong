/**
 * Stock History API
 * GET /api/admin/inventory/history
 *
 * Get aggregated stock history data for charts
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuthAdmin } from '@/lib/middleware/authMiddleware';
import { getCollections, ObjectId } from '@/lib/db';

interface StockHistoryPoint {
  date: string;
  totalIn: number;
  totalOut: number;
  netChange: number;
}

interface StockHistoryResponse {
  success: boolean;
  data: StockHistoryPoint[];
  summary: {
    totalIn: number;
    totalOut: number;
    netChange: number;
    movementCount: number;
  };
  period: {
    startDate: string;
    endDate: string;
    days: number;
  };
}

/**
 * GET /api/admin/inventory/history
 * Get aggregated stock history for charts
 *
 * Query params:
 * - productId: Filter by product (optional)
 * - variationId: Filter by variation (optional)
 * - days: Number of days to look back (default: 30, max: 365)
 * - groupBy: Group by 'day' | 'week' | 'month' (default: 'day')
 */
export async function GET(request: NextRequest) {
  return withAuthAdmin(request, async () => {
    try {
      const { searchParams } = new URL(request.url);
      const productId = searchParams.get('productId');
      const variationId = searchParams.get('variationId');
      const days = Math.min(parseInt(searchParams.get('days') || '30', 10), 365);
      const groupBy = (searchParams.get('groupBy') || 'day') as 'day' | 'week' | 'month';

      const { inventoryMovements } = await getCollections();

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Build match query
      const matchQuery: Record<string, unknown> = {
        createdAt: { $gte: startDate, $lte: endDate },
      };

      if (productId) {
        matchQuery.productId = new ObjectId(productId);
      }

      if (variationId) {
        matchQuery.variationId = variationId;
      }

      // Build date grouping format based on groupBy
      let dateFormat: string;
      switch (groupBy) {
        case 'week':
          dateFormat = '%Y-W%V'; // Year-Week format
          break;
        case 'month':
          dateFormat = '%Y-%m'; // Year-Month format
          break;
        default:
          dateFormat = '%Y-%m-%d'; // Year-Month-Day format
      }

      // Aggregate stock movements by date
      const aggregation = await inventoryMovements
        .aggregate([
          { $match: matchQuery },
          {
            $group: {
              _id: {
                date: { $dateToString: { format: dateFormat, date: '$createdAt' } },
              },
              totalIn: {
                $sum: {
                  $cond: [{ $eq: ['$direction', 1] }, '$quantity', 0],
                },
              },
              totalOut: {
                $sum: {
                  $cond: [{ $eq: ['$direction', -1] }, '$quantity', 0],
                },
              },
              movementCount: { $sum: 1 },
            },
          },
          { $sort: { '_id.date': 1 } },
        ])
        .toArray();

      // Transform to response format
      const data: StockHistoryPoint[] = aggregation.map((item) => ({
        date: item._id.date,
        totalIn: item.totalIn || 0,
        totalOut: item.totalOut || 0,
        netChange: (item.totalIn || 0) - (item.totalOut || 0),
      }));

      // Calculate summary
      const summary = {
        totalIn: data.reduce((sum, d) => sum + d.totalIn, 0),
        totalOut: data.reduce((sum, d) => sum + d.totalOut, 0),
        netChange: data.reduce((sum, d) => sum + d.netChange, 0),
        movementCount: aggregation.reduce((sum, item) => sum + (item.movementCount || 0), 0),
      };

      const response: StockHistoryResponse = {
        success: true,
        data,
        summary,
        period: {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          days,
        },
      };

      return NextResponse.json(response);
    } catch (error) {
      console.error('[Stock History API] Error:', error);
      return NextResponse.json(
        { error: 'Lỗi khi lấy lịch sử tồn kho' },
        { status: 500 }
      );
    }
  });
}
