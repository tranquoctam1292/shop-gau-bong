/**
 * Admin Inventory Adjust By SKU API Route
 * POST /api/admin/inventory/adjust-by-sku - Dieu chinh ton kho theo SKU
 *
 * Protected route - requires authentication
 * Rate limited - 30 requests/minute, burst 10/10s
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuthAdmin, AuthenticatedRequest } from '@/lib/middleware/authMiddleware';
import { getCollections, ObjectId } from '@/lib/db';
import { adjustStock } from '@/lib/repositories/inventoryRepository';
import { withRateLimit } from '@/lib/utils/rateLimiter';
import { invalidateCacheByProduct, invalidateAllInventoryCache } from '@/lib/utils/inventoryCache';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// Validation schema for single adjustment
const adjustBySkuSchema = z.object({
  sku: z.string().min(1, 'SKU la bat buoc'),
  quantity: z.number().int('quantity phai la so nguyen'),
  type: z.enum(['manual', 'damage', 'correction', 'return', 'import'], {
    errorMap: () => ({ message: 'type khong hop le' }),
  }),
  reason: z.string().min(1, 'reason la bat buoc').max(500, 'reason qua dai'),
  referenceId: z.string().optional(),
});

// Validation schema for bulk adjustment
const bulkAdjustBySkuSchema = z.object({
  items: z.array(adjustBySkuSchema).min(1, 'items khong duoc rong').max(100, 'Toi da 100 items'),
});

interface SkuLookupResult {
  productId: string;
  variationId?: string;
  productName: string;
  sku: string;
}

/**
 * Find product/variant by SKU
 */
async function findBySku(sku: string): Promise<SkuLookupResult | null> {
  const { products } = await getCollections();

  // First, try to find a simple product with this SKU
  const simpleProduct = await products.findOne({
    sku: sku,
    status: { $ne: 'trash' },
    deletedAt: { $exists: false },
  });

  if (simpleProduct) {
    return {
      productId: simpleProduct._id.toString(),
      productName: simpleProduct.name || 'Unknown',
      sku: simpleProduct.sku || sku,
    };
  }

  // Try to find a variant with this SKU
  const productWithVariant = await products.findOne({
    'variants.sku': sku,
    status: { $ne: 'trash' },
    deletedAt: { $exists: false },
  });

  if (productWithVariant && productWithVariant.variants) {
    const variant = productWithVariant.variants.find(
      (v: { sku?: string }) => v.sku === sku
    );
    if (variant) {
      return {
        productId: productWithVariant._id.toString(),
        variationId: variant.id || variant._id?.toString(),
        productName: productWithVariant.name || 'Unknown',
        sku: variant.sku || sku,
      };
    }
  }

  return null;
}

/**
 * POST /api/admin/inventory/adjust-by-sku
 * Dieu chinh ton kho theo SKU (don le hoac bulk)
 *
 * Single adjustment request body:
 * - sku: string (bat buoc)
 * - quantity: number (duong = tang, am = giam)
 * - type: 'manual' | 'damage' | 'correction' | 'return' | 'import'
 * - reason: string (bat buoc, cho audit)
 * - referenceId?: string (optional)
 *
 * Bulk adjustment request body:
 * - items: Array<{ sku, quantity, type, reason, referenceId? }>
 */
export async function POST(request: NextRequest) {
  return withRateLimit(request, async () => {
    return withAuthAdmin(request, async (req: AuthenticatedRequest) => {
      try {
        const body = await req.json();

      // Get admin user info for audit
      const adminUser = req.adminUser;
      const adjustedBy = adminUser?._id?.toString() || 'unknown';
      const adminUserName = adminUser?.username || adminUser?.full_name || 'Admin';

      // Check if bulk or single adjustment
      const isBulk = 'items' in body && Array.isArray(body.items);

      if (isBulk) {
        // Bulk adjustment
        const validationResult = bulkAdjustBySkuSchema.safeParse(body);
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

        const { items } = validationResult.data;
        const results: Array<{
          sku: string;
          success: boolean;
          message?: string;
          error?: string;
          newStock?: number;
        }> = [];

        for (const item of items) {
          try {
            if (item.quantity === 0) {
              results.push({
                sku: item.sku,
                success: false,
                error: 'quantity khong the bang 0',
              });
              continue;
            }

            const lookup = await findBySku(item.sku);
            if (!lookup) {
              results.push({
                sku: item.sku,
                success: false,
                error: `SKU "${item.sku}" khong tim thay`,
              });
              continue;
            }

            const result = await adjustStock(
              {
                productId: lookup.productId,
                variationId: lookup.variationId,
                quantity: item.quantity,
                type: item.type,
                reason: item.reason,
                referenceId: item.referenceId,
                adjustedBy,
              },
              adminUserName
            );

            results.push({
              sku: item.sku,
              success: true,
              message: item.quantity > 0
                ? `Da tang ${item.quantity} don vi`
                : `Da giam ${Math.abs(item.quantity)} don vi`,
              newStock: result.newStock,
            });
          } catch (error) {
            results.push({
              sku: item.sku,
              success: false,
              error: error instanceof Error ? error.message : 'Loi khong xac dinh',
            });
          }
        }

        const successCount = results.filter((r) => r.success).length;
        const failCount = results.filter((r) => !r.success).length;

        // Invalidate all cache for bulk operations
        if (successCount > 0) {
          invalidateAllInventoryCache();
        }

        return NextResponse.json({
          success: failCount === 0,
          processed: items.length,
          successCount,
          failCount,
          results,
        });
      } else {
        // Single adjustment
        const validationResult = adjustBySkuSchema.safeParse(body);
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

        const { sku, quantity, type, reason, referenceId } = validationResult.data;

        if (quantity === 0) {
          return NextResponse.json(
            { error: 'quantity khong the bang 0' },
            { status: 400 }
          );
        }

        // Find product/variant by SKU
        const lookup = await findBySku(sku);
        if (!lookup) {
          return NextResponse.json(
            { error: `SKU "${sku}" khong tim thay` },
            { status: 404 }
          );
        }

        // Perform stock adjustment
        const result = await adjustStock(
          {
            productId: lookup.productId,
            variationId: lookup.variationId,
            quantity,
            type: type as 'manual' | 'damage' | 'correction' | 'return' | 'import',
            reason,
            referenceId,
            adjustedBy,
          },
          adminUserName
        );

        // Invalidate cache for this product
        invalidateCacheByProduct(lookup.productId);

        return NextResponse.json({
          ...result,
          sku,
          productName: lookup.productName,
          message: quantity > 0
            ? `Da tang ${quantity} don vi cho SKU ${sku}`
            : `Da giam ${Math.abs(quantity)} don vi cho SKU ${sku}`,
        });
      }
    } catch (error) {
      console.error('[Inventory Adjust By SKU API] Error:', error);

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

/**
 * GET /api/admin/inventory/adjust-by-sku?sku=XXX
 * Lookup product/variant by SKU
 */
export async function GET(request: NextRequest) {
  return withAuthAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      const { searchParams } = new URL(req.url);
      const sku = searchParams.get('sku');

      if (!sku) {
        return NextResponse.json(
          { error: 'SKU la bat buoc' },
          { status: 400 }
        );
      }

      const lookup = await findBySku(sku);
      if (!lookup) {
        return NextResponse.json(
          { error: `SKU "${sku}" khong tim thay`, found: false },
          { status: 404 }
        );
      }

      // Get current stock info
      const { products } = await getCollections();
      const product = await products.findOne({
        _id: new ObjectId(lookup.productId),
      });

      if (!product) {
        return NextResponse.json(
          { error: 'San pham khong ton tai', found: false },
          { status: 404 }
        );
      }

      let currentStock = 0;
      let reservedQuantity = 0;

      if (lookup.variationId && product.variants) {
        const variant = product.variants.find(
          (v: { id?: string; _id?: { toString: () => string } }) =>
            v.id === lookup.variationId ||
            v._id?.toString() === lookup.variationId
        );
        if (variant) {
          currentStock = variant.stock || variant.stockQuantity || 0;
          reservedQuantity = variant.reservedQuantity || 0;
        }
      } else {
        currentStock = product.stockQuantity || 0;
        reservedQuantity = product.reservedQuantity || 0;
      }

      return NextResponse.json({
        found: true,
        ...lookup,
        currentStock,
        reservedQuantity,
        availableStock: currentStock - reservedQuantity,
      });
    } catch (error) {
      console.error('[Inventory SKU Lookup] Error:', error);
      return NextResponse.json(
        { error: 'Loi khi tim kiem SKU' },
        { status: 500 }
      );
    }
  });
}
