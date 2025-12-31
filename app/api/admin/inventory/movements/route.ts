/**
 * Admin Inventory Movements API Route
 * GET /api/admin/inventory/movements - Lay lich su thay doi ton kho
 *
 * Protected route - requires authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuthAdmin, AuthenticatedRequest } from '@/lib/middleware/authMiddleware';
import { getMovements } from '@/lib/repositories/inventoryRepository';
import type { MovementFilters } from '@/types/inventory';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/inventory/movements
 * Lay lich su thay doi ton kho voi filter va pagination
 *
 * Query params:
 * - page: number (default: 1)
 * - per_page: number (default: 20)
 * - productId?: string (loc theo product)
 * - variationId?: string (loc theo variant)
 * - sku?: string (loc theo SKU)
 * - type?: 'in' | 'out' | 'adjustment' | 'reservation' | 'release'
 * - referenceType?: 'order' | 'return' | 'manual' | 'import' | 'damage' | 'correction'
 * - startDate?: ISO date string
 * - endDate?: ISO date string
 */
export async function GET(request: NextRequest) {
  return withAuthAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      const { searchParams } = new URL(req.url);

      // Parse query parameters
      const filters: MovementFilters = {
        page: parseInt(searchParams.get('page') || '1', 10),
        perPage: parseInt(searchParams.get('per_page') || '20', 10),
        productId: searchParams.get('productId') || undefined,
        variationId: searchParams.get('variationId') || undefined,
        sku: searchParams.get('sku') || undefined,
        type: (searchParams.get('type') as MovementFilters['type']) || undefined,
        referenceType: (searchParams.get('referenceType') as MovementFilters['referenceType']) || undefined,
      };

      // Parse date filters
      const startDateStr = searchParams.get('startDate');
      const endDateStr = searchParams.get('endDate');

      if (startDateStr) {
        const startDate = new Date(startDateStr);
        if (!isNaN(startDate.getTime())) {
          filters.startDate = startDate.toISOString();
        }
      }

      if (endDateStr) {
        const endDate = new Date(endDateStr);
        if (!isNaN(endDate.getTime())) {
          filters.endDate = endDate.toISOString();
        }
      }

      // Validate pagination
      if (filters.page! < 1) filters.page = 1;
      if (filters.perPage! < 1) filters.perPage = 20;
      if (filters.perPage! > 100) filters.perPage = 100;

      // Validate type
      const validTypes = ['in', 'out', 'adjustment', 'reservation', 'release'];
      if (filters.type && !validTypes.includes(filters.type)) {
        filters.type = undefined;
      }

      // Validate referenceType
      const validReferenceTypes = ['order', 'return', 'manual', 'import', 'damage', 'correction'];
      if (filters.referenceType && !validReferenceTypes.includes(filters.referenceType)) {
        filters.referenceType = undefined;
      }

      // Get movements
      const result = await getMovements(filters);

      return NextResponse.json(result);
    } catch (error) {
      console.error('[Inventory Movements API] Error:', error);
      return NextResponse.json(
        { error: 'Loi khi lay lich su ton kho' },
        { status: 500 }
      );
    }
  });
}
