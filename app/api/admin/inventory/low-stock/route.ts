/**
 * Admin Inventory Low Stock API Route
 * GET /api/admin/inventory/low-stock - Lay danh sach san pham ton kho thap
 *
 * Protected route - requires authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuthAdmin, AuthenticatedRequest } from '@/lib/middleware/authMiddleware';
import { getLowStockItems } from '@/lib/repositories/inventoryRepository';
import { withCache } from '@/lib/utils/inventoryCache';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/inventory/low-stock
 * Lay danh sach san pham ton kho thap/het hang
 *
 * Query params:
 * - threshold?: number (override default threshold)
 * - includeOutOfStock: boolean (default: true)
 */
export async function GET(request: NextRequest) {
  return withAuthAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      const { searchParams } = new URL(req.url);

      // Parse query parameters
      const thresholdStr = searchParams.get('threshold');
      const includeOutOfStockStr = searchParams.get('includeOutOfStock');

      let threshold: number | undefined;
      if (thresholdStr) {
        const parsedThreshold = parseInt(thresholdStr, 10);
        if (!isNaN(parsedThreshold) && parsedThreshold >= 0) {
          threshold = parsedThreshold;
        }
      }

      const includeOutOfStock = includeOutOfStockStr !== 'false';

      // Get low stock items with caching
      const cacheParams = { threshold, includeOutOfStock };
      const result = await withCache('lowStock', cacheParams, () =>
        getLowStockItems(threshold, includeOutOfStock)
      );

      return NextResponse.json(result);
    } catch (error) {
      console.error('[Inventory Low Stock API] Error:', error);
      return NextResponse.json(
        { error: 'Loi khi lay danh sach ton kho thap' },
        { status: 500 }
      );
    }
  });
}
