/**
 * Validate SKU Uniqueness API Route
 * GET /api/admin/products/validate-sku - Check if SKU is available
 * 
 * Protected route - requires authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCollections, ObjectId } from '@/lib/db';
import { withAuthAdmin, AuthenticatedRequest } from '@/lib/middleware/authMiddleware';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return withAuthAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      const { searchParams } = new URL(request.url);
      const sku = searchParams.get('sku');
      const excludeId = searchParams.get('excludeId'); // Product ID to exclude from check (for edit mode)

      // Validate input
      if (!sku || typeof sku !== 'string' || sku.trim() === '') {
        return NextResponse.json(
          { error: 'SKU is required' },
          { status: 400 }
        );
      }

      // Sanitize SKU: only allow alphanumeric, dash, underscore
      const sanitizedSku = sku.trim().replace(/[^a-zA-Z0-9\-_]/g, '');
      if (sanitizedSku !== sku.trim()) {
        return NextResponse.json(
          { 
            available: false,
            error: 'SKU chỉ được chứa chữ cái, số, dấu gạch ngang và dấu gạch dưới',
            sanitized: sanitizedSku
          },
          { status: 200 } // Return 200 with available: false to show validation error
        );
      }

      const { products } = await getCollections();

      // Build query: find products with same SKU, excluding current product if editing
      const query: Record<string, unknown> = {
        sku: sanitizedSku,
        deletedAt: null, // Only check non-deleted products
      };

      if (excludeId) {
        // Exclude current product when editing
        if (ObjectId.isValid(excludeId)) {
          query._id = { $ne: new ObjectId(excludeId) };
        }
      }

      // Check if SKU exists
      const existingProduct = await products.findOne(query);

      if (existingProduct) {
        return NextResponse.json({
          available: false,
          error: `SKU "${sanitizedSku}" đã được sử dụng bởi sản phẩm khác`,
        });
      }

      // SKU is available
      return NextResponse.json({
        available: true,
        sku: sanitizedSku,
      });
    } catch (error: unknown) {
      console.error('[Validate SKU API] Error:', error);
      
      const isDevelopment = process.env.NODE_ENV === 'development';
      const errorMessage = error instanceof Error ? error.message : 'Internal server error';
      
      return NextResponse.json(
        {
          error: isDevelopment ? errorMessage : 'Đã xảy ra lỗi khi kiểm tra SKU',
          available: false,
        },
        { status: 500 }
      );
    }
  });
}
