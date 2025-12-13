/**
 * Admin Auto-Cleanup Trash API Route
 * POST /api/admin/products/auto-cleanup-trash - Auto-delete products in trash older than 30 days
 * 
 * Protected route - requires authentication
 * Can be called by cron job or scheduled task
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCollections } from '@/lib/db';

export const dynamic = 'force-dynamic';

// 30 days in milliseconds
const TRASH_RETENTION_DAYS = 30;
const TRASH_RETENTION_MS = TRASH_RETENTION_DAYS * 24 * 60 * 60 * 1000;

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const { requireAdmin } = await import('@/lib/auth');
    try {
      await requireAdmin();
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { products } = await getCollections();
    const now = new Date();
    const cutoffDate = new Date(now.getTime() - TRASH_RETENTION_MS);

    // Find products in trash older than 30 days
    const productsToDelete = await products
      .find({
        deletedAt: { $ne: null, $lt: cutoffDate },
      })
      .toArray();

    const deletedProductIds: string[] = [];
    const errors: Array<{ productId: string; error: string }> = [];

    // Delete products permanently
    for (const product of productsToDelete) {
      try {
        const productId = product._id.toString();
        
        // Perform hard delete
        const deleteResult = await products.deleteOne({ _id: product._id });
        
        if (deleteResult.deletedCount > 0) {
          deletedProductIds.push(productId);
        } else {
          errors.push({
            productId,
            error: 'Product not found or already deleted',
          });
        }
      } catch (error: any) {
        errors.push({
          productId: product._id.toString(),
          error: error.message || 'Unknown error',
        });
        console.error(`[Auto-Cleanup Trash] Error deleting product ${product._id}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      deleted: deletedProductIds.length,
      errors: errors.length,
      deletedProductIds,
      errorsList: errors,
      cutoffDate: cutoffDate.toISOString(),
      message: `Đã xóa vĩnh viễn ${deletedProductIds.length} sản phẩm trong thùng rác (cũ hơn ${TRASH_RETENTION_DAYS} ngày)`,
    });
  } catch (error: any) {
    console.error('[Admin Auto-Cleanup Trash API] Error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to auto-cleanup trash',
        details:
          process.env.NODE_ENV === 'development'
            ? { stack: error.stack }
            : undefined,
      },
      { status: 500 }
    );
  }
}

