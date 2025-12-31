/**
 * Admin Inventory Import API Route
 * POST /api/admin/inventory/import - Nhap du lieu ton kho tu CSV
 *
 * Protected route - requires authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuthAdmin, AuthenticatedRequest } from '@/lib/middleware/authMiddleware';
import { adjustStock } from '@/lib/repositories/inventoryRepository';
import { z } from 'zod';
import type { InventoryImportResult, InventoryImportRow } from '@/types/inventory';

export const dynamic = 'force-dynamic';

// Validation schema for import rows
const importRowSchema = z.object({
  sku: z.string().min(1, 'SKU la bat buoc'),
  stockQuantity: z.number().int('stockQuantity phai la so nguyen').min(0),
  adjustmentType: z.enum(['manual', 'import', 'correction']).optional().default('import'),
  reason: z.string().optional(),
});

const importRequestSchema = z.object({
  rows: z.array(importRowSchema).min(1, 'Can it nhat 1 dong du lieu'),
  mode: z.enum(['set', 'add']).default('set'), // 'set' = set to value, 'add' = add to current
});

/**
 * POST /api/admin/inventory/import
 * Nhap du lieu ton kho tu CSV/JSON
 *
 * Request body:
 * - rows: Array of { sku, stockQuantity, adjustmentType?, reason? }
 * - mode: 'set' | 'add' (default: 'set')
 */
export async function POST(request: NextRequest) {
  return withAuthAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      const body = await req.json();

      // Validate request body
      const validationResult = importRequestSchema.safeParse(body);
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

      const { rows, mode } = validationResult.data;

      // Get admin user info
      const adminUser = req.adminUser;
      const adjustedBy = adminUser?._id?.toString() || 'unknown';
      const adminUserName = adminUser?.username || adminUser?.full_name || 'Admin';

      // Process each row
      const result: InventoryImportResult = {
        success: true,
        processed: 0,
        failed: 0,
        errors: [],
      };

      // Import getCollections to find products by SKU
      const { getCollections } = await import('@/lib/db');
      const { products: productsCollection } = await getCollections();

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNum = i + 1;

        try {
          // Find product/variant by SKU
          const product = await productsCollection.findOne({
            $or: [
              { sku: row.sku },
              { 'variants.sku': row.sku },
            ],
            status: { $ne: 'trash' },
            $and: [{ $or: [{ deletedAt: { $exists: false } }, { deletedAt: null }] }],
          });

          if (!product) {
            result.failed++;
            result.errors.push({
              row: rowNum,
              sku: row.sku,
              error: `Khong tim thay san pham voi SKU: ${row.sku}`,
            });
            continue;
          }

          // Determine if this is a product SKU or variant SKU
          let variationId: string | undefined;
          let currentStock = 0;

          if (product.sku === row.sku) {
            // Product-level SKU
            currentStock = product.stockQuantity ?? product.productDataMetaBox?.stockQuantity ?? 0;
          } else {
            // Variant SKU - find the variant
            const variant = product.variants?.find((v: { sku?: string }) => v.sku === row.sku);
            if (variant) {
              variationId = variant.id;
              currentStock = variant.stockQuantity ?? variant.stock ?? 0;
            } else {
              result.failed++;
              result.errors.push({
                row: rowNum,
                sku: row.sku,
                error: `Khong tim thay variant voi SKU: ${row.sku}`,
              });
              continue;
            }
          }

          // Calculate quantity adjustment
          let quantity: number;
          if (mode === 'set') {
            // Set to specific value: quantity = new - current
            quantity = row.stockQuantity - currentStock;
          } else {
            // Add to current value
            quantity = row.stockQuantity;
          }

          // Skip if no change needed
          if (quantity === 0) {
            result.processed++;
            continue;
          }

          // Perform adjustment
          await adjustStock(
            {
              productId: product._id.toString(),
              variationId,
              quantity,
              type: row.adjustmentType || 'import',
              reason: row.reason || `Import: ${mode === 'set' ? 'Dat thanh' : 'Tang them'} ${row.stockQuantity}`,
              adjustedBy,
            },
            adminUserName
          );

          result.processed++;
        } catch (error) {
          result.failed++;
          result.errors.push({
            row: rowNum,
            sku: row.sku,
            error: error instanceof Error ? error.message : 'Loi khong xac dinh',
          });
        }
      }

      // Set overall success status
      result.success = result.failed === 0;

      return NextResponse.json(result);
    } catch (error) {
      console.error('[Inventory Import API] Error:', error);
      return NextResponse.json(
        { error: 'Loi khi nhap du lieu ton kho' },
        { status: 500 }
      );
    }
  });
}
