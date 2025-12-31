/**
 * Admin Inventory Adjust API Route
 * POST /api/admin/inventory/adjust - Dieu chinh ton kho
 *
 * Protected route - requires authentication
 * Rate limited - 30 requests/minute, burst 10/10s
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuthAdmin, AuthenticatedRequest } from '@/lib/middleware/authMiddleware';
import { adjustStock } from '@/lib/repositories/inventoryRepository';
import { withRateLimit } from '@/lib/utils/rateLimiter';
import { invalidateCacheByProduct } from '@/lib/utils/inventoryCache';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// Validation schema
const adjustStockSchema = z.object({
  productId: z.string().min(1, 'productId la bat buoc'),
  variationId: z.string().optional(),
  quantity: z.number().int('quantity phai la so nguyen'),
  type: z.enum(['manual', 'damage', 'correction', 'return', 'import'], {
    errorMap: () => ({ message: 'type khong hop le' }),
  }),
  reason: z.string().min(1, 'reason la bat buoc').max(500, 'reason qua dai'),
  referenceId: z.string().optional(),
});

/**
 * POST /api/admin/inventory/adjust
 * Dieu chinh ton kho (tang/giam)
 *
 * Request body:
 * - productId: string (bat buoc)
 * - variationId?: string (optional, cho variable products)
 * - quantity: number (duong = tang, am = giam)
 * - type: 'manual' | 'damage' | 'correction' | 'return' | 'import'
 * - reason: string (bat buoc, cho audit)
 * - referenceId?: string (optional, reference den order/return ID)
 */
export async function POST(request: NextRequest) {
  // Apply rate limiting first
  return withRateLimit(request, async () => {
    return withAuthAdmin(request, async (req: AuthenticatedRequest) => {
      try {
        const body = await req.json();

      // Validate request body
      const validationResult = adjustStockSchema.safeParse(body);
      if (!validationResult.success) {
        const errors = validationResult.error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        return NextResponse.json(
          { error: 'Du lieu khong hop le', details: errors },
          { status: 400 }
        );
      }

      const { productId, variationId, quantity, type, reason, referenceId } = validationResult.data;

      // Validate quantity is not 0
      if (quantity === 0) {
        return NextResponse.json(
          { error: 'quantity khong the bang 0' },
          { status: 400 }
        );
      }

      // Get admin user info for audit
      const adminUser = req.adminUser;
      const adjustedBy = adminUser?._id?.toString() || 'unknown';
      const adminUserName = adminUser?.username || adminUser?.full_name || 'Admin';

      // Perform stock adjustment
      const result = await adjustStock(
        {
          productId,
          variationId,
          quantity,
          type: type as 'manual' | 'damage' | 'correction' | 'return' | 'import',
          reason,
          referenceId,
          adjustedBy,
        },
        adminUserName
      );

      // Invalidate cache for this product
      invalidateCacheByProduct(productId);

      return NextResponse.json({
        ...result,
        message: quantity > 0 ? `Da tang ${quantity} don vi` : `Da giam ${Math.abs(quantity)} don vi`,
      });
    } catch (error) {
      console.error('[Inventory Adjust API] Error:', error);

      // Handle specific errors
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          return NextResponse.json(
            { error: error.message },
            { status: 404 }
          );
        }
        if (error.message.includes('Khong the giam')) {
          return NextResponse.json(
            { error: error.message },
            { status: 400 }
          );
        }
      }

      return NextResponse.json(
        { error: 'Loi khi dieu chinh ton kho' },
        { status: 500 }
      );
    }
    });
  });
}
