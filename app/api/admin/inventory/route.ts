/**
 * Admin Inventory API Route
 * GET /api/admin/inventory - Lay danh sach ton kho (overview)
 *
 * Protected route - requires authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuthAdmin, AuthenticatedRequest } from '@/lib/middleware/authMiddleware';
import { getInventoryOverview } from '@/lib/repositories/inventoryRepository';
import type { InventoryFilters } from '@/types/inventory';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/inventory
 * Lay danh sach ton kho voi filter va pagination
 *
 * Query params:
 * - page: number (default: 1)
 * - per_page: number (default: 20)
 * - search: string (tim kiem theo ten, SKU)
 * - category: string (category ID)
 * - stockStatus: 'all' | 'low' | 'out' | 'in' (default: 'all')
 * - sortBy: 'stock' | 'name' | 'sku' | 'updatedAt' (default: 'stock')
 * - sortOrder: 'asc' | 'desc' (default: 'asc')
 */
export async function GET(request: NextRequest) {
  return withAuthAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      const { searchParams } = new URL(req.url);

      // Parse query parameters
      const filters: InventoryFilters = {
        page: parseInt(searchParams.get('page') || '1', 10),
        perPage: parseInt(searchParams.get('per_page') || '20', 10),
        search: searchParams.get('search') || undefined,
        category: searchParams.get('category') || undefined,
        stockStatus: (searchParams.get('stockStatus') as InventoryFilters['stockStatus']) || 'all',
        sortBy: (searchParams.get('sortBy') as InventoryFilters['sortBy']) || 'stock',
        sortOrder: (searchParams.get('sortOrder') as InventoryFilters['sortOrder']) || 'asc',
      };

      // Validate pagination
      if (filters.page! < 1) filters.page = 1;
      if (filters.perPage! < 1) filters.perPage = 20;
      if (filters.perPage! > 100) filters.perPage = 100;

      // Validate stockStatus
      const validStockStatuses = ['all', 'low', 'out', 'in'];
      if (!validStockStatuses.includes(filters.stockStatus!)) {
        filters.stockStatus = 'all';
      }

      // Validate sortBy
      const validSortBy = ['stock', 'name', 'sku', 'updatedAt'];
      if (!validSortBy.includes(filters.sortBy!)) {
        filters.sortBy = 'stock';
      }

      // Validate sortOrder
      if (filters.sortOrder !== 'asc' && filters.sortOrder !== 'desc') {
        filters.sortOrder = 'asc';
      }

      // Get inventory overview
      const result = await getInventoryOverview(filters);

      return NextResponse.json(result);
    } catch (error) {
      console.error('[Inventory API] Error getting inventory overview:', error);
      return NextResponse.json(
        { error: 'Loi khi lay du lieu ton kho' },
        { status: 500 }
      );
    }
  });
}
