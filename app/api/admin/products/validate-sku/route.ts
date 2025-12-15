import { NextRequest, NextResponse } from 'next/server';
import { getCollections, ObjectId } from '@/lib/db';
import { normalizeSku } from '@/lib/utils/skuGenerator';
import { withAuthAdmin, AuthenticatedRequest } from '@/lib/middleware/authMiddleware';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/products/validate-sku
 * Validate SKU uniqueness using normalized SKU (case-insensitive)
 * 
 * According to SMART_SKU_IMPLEMENTATION_PLAN.md:
 * - Use sku_normalized field for duplicate checking (case-insensitive)
 * - Normalized SKU: uppercase, remove special chars
 * 
 * Protected route - requires authentication via withAuthAdmin middleware
 */
export async function POST(request: NextRequest) {
  return withAuthAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      const { searchParams } = new URL(request.url);
      const sku = searchParams.get('sku');
      const excludeId = searchParams.get('excludeId');

      if (!sku || !sku.trim()) {
        return NextResponse.json({ available: true });
      }

      const { products } = await getCollections();

      // Normalize SKU for case-insensitive duplicate checking
      const skuNormalized = normalizeSku(sku.trim());
      
      if (!skuNormalized) {
        // Empty normalized SKU is considered valid (empty SKU is allowed)
        return NextResponse.json({ available: true });
      }

      // Build query using sku_normalized (case-insensitive check)
      const query: any = { sku_normalized: skuNormalized };
      
      // Exclude current product if editing
      if (excludeId) {
        try {
          query._id = { $ne: new ObjectId(excludeId) };
        } catch {
          // Invalid ObjectId, ignore
        }
      }

      // Check if SKU exists (using normalized field)
      const existingProduct = await products.findOne(query);

      if (existingProduct) {
        return NextResponse.json({
          available: false,
          error: 'SKU đã tồn tại trong hệ thống',
        });
      }

      return NextResponse.json({ available: true });
    } catch (error) {
      console.error('Error validating SKU:', error);
      return NextResponse.json(
        { error: 'Internal server error', available: false },
        { status: 500 }
      );
    }
  });
}
