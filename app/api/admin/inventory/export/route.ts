/**
 * Admin Inventory Export API Route
 * GET /api/admin/inventory/export - Xuat du lieu ton kho ra CSV
 *
 * Protected route - requires authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuthAdmin, AuthenticatedRequest } from '@/lib/middleware/authMiddleware';
import { getCollections } from '@/lib/db';
import {
  getProductStockQuantity,
  getProductReservedQuantity,
  getProductAvailableQuantity,
  getVariantStockQuantity,
  getVariantReservedQuantity,
  getVariantAvailableQuantity,
  getLowStockThreshold,
  type ProductLike,
} from '@/lib/utils/inventoryUtils';
import type { StockStatus, InventoryExportRow } from '@/types/inventory';

export const dynamic = 'force-dynamic';

// Type alias for MongoDB product document
type ProductDoc = ProductLike & {
  _id: { toString(): string };
  name?: string;
  sku?: string;
  stockStatus?: StockStatus;
};

/**
 * GET /api/admin/inventory/export
 * Xuat danh sach ton kho ra CSV format
 *
 * Query params:
 * - format: 'csv' | 'json' (default: csv)
 */
export async function GET(request: NextRequest) {
  return withAuthAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      const { searchParams } = new URL(req.url);
      const format = searchParams.get('format') || 'csv';

      const { products: productsCollection } = await getCollections();

      // Get all active products
      const query = {
        $and: [
          { $or: [{ deletedAt: { $exists: false } }, { deletedAt: null }] },
          { status: { $ne: 'trash' } },
        ],
      };

      const productsRaw = await productsCollection
        .find(query)
        .sort({ name: 1 })
        .toArray();

      const products = productsRaw as unknown as ProductDoc[];

      // Build export rows
      const rows: InventoryExportRow[] = [];

      for (const product of products) {
        const hasVariants =
          product.variants &&
          Array.isArray(product.variants) &&
          product.variants.length > 0;

        if (hasVariants && product.variants) {
          // Variable product - export each variant as a row
          for (const variant of product.variants) {
            rows.push({
              productId: product._id.toString(),
              productName: product.name || 'Unnamed',
              sku: variant.sku || '',
              variationId: variant.id,
              size: variant.size,
              color: variant.color,
              stockQuantity: getVariantStockQuantity(variant),
              reservedQuantity: getVariantReservedQuantity(variant),
              availableQuantity: getVariantAvailableQuantity(variant),
              stockStatus: product.stockStatus || 'instock',
              lowStockThreshold: getLowStockThreshold(product),
            });
          }
        } else {
          // Simple product
          rows.push({
            productId: product._id.toString(),
            productName: product.name || 'Unnamed',
            sku: product.sku || '',
            stockQuantity: getProductStockQuantity(product),
            reservedQuantity: getProductReservedQuantity(product),
            availableQuantity: getProductAvailableQuantity(product),
            stockStatus: product.stockStatus || 'instock',
            lowStockThreshold: getLowStockThreshold(product),
          });
        }
      }

      // Return based on format
      if (format === 'json') {
        return NextResponse.json({
          rows,
          total: rows.length,
          exportedAt: new Date().toISOString(),
        });
      }

      // Default: CSV format
      const csvHeaders = [
        'Product ID',
        'Product Name',
        'SKU',
        'Variation ID',
        'Size',
        'Color',
        'Stock Quantity',
        'Reserved Quantity',
        'Available Quantity',
        'Stock Status',
        'Low Stock Threshold',
      ];

      const csvRows = rows.map((row) => [
        row.productId,
        `"${(row.productName || '').replace(/"/g, '""')}"`,
        row.sku || '',
        row.variationId || '',
        row.size || '',
        row.color || '',
        row.stockQuantity,
        row.reservedQuantity,
        row.availableQuantity,
        row.stockStatus,
        row.lowStockThreshold || '',
      ]);

      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map((row) => row.join(',')),
      ].join('\n');

      // Return CSV file
      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="inventory-export-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    } catch (error) {
      console.error('[Inventory Export API] Error:', error);
      return NextResponse.json(
        { error: 'Loi khi xuat du lieu ton kho' },
        { status: 500 }
      );
    }
  });
}
