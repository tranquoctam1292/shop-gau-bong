/**
 * Admin Force Delete Product API Route
 * DELETE /api/admin/products/[id]/force - Force delete product (permanent)
 * 
 * Protected route - requires authentication via withAuthAdmin middleware
 * WARNING: This permanently deletes the product from database
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCollections, ObjectId } from '@/lib/db';
import { withAuthAdmin, AuthenticatedRequest } from '@/lib/middleware/authMiddleware';

export const dynamic = 'force-dynamic';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuthAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      const { products, skuHistory } = await getCollections();
      let { id } = params;
      
      // Extract ObjectId from GraphQL format if needed (backward compatibility)
      if (id.startsWith('gid://shop-gau-bong/Product/')) {
        id = id.replace('gid://shop-gau-bong/Product/', '');
      }
      
      // Find product
      let productId: ObjectId | null = null;
      let product = null;
      
      if (ObjectId.isValid(id)) {
        productId = new ObjectId(id);
        product = await products.findOne({ _id: productId });
      } else {
        product = await products.findOne({ slug: id });
        if (product) {
          productId = product._id;
        }
      }
      
      if (!productId || !product) {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        );
      }
      
      // Clean up related data before deleting product
      const productIdStr = productId.toString();
      
      // Delete SKU history for this product
      // Note: SKU counters are NOT deleted because they may be shared across products
      // with the same base SKU pattern. According to SMART_SKU_IMPLEMENTATION_PLAN.md:
      // "No Reuse on Delete: When product is deleted, counter sequence does NOT decrease"
      await skuHistory.deleteMany({
        productId: productIdStr,
      });
      
      // Force Delete: Permanently delete from database
      // Note: This deletes the product regardless of deletedAt status (trash or not)
      const result = await products.deleteOne({ _id: productId });
      
      if (result.deletedCount === 0) {
        // Log for debugging
        console.error(`[Force Delete] Failed to delete product ${productId}: deletedCount is 0`);
        return NextResponse.json(
          { 
            error: 'Product not found or already deleted',
            details: process.env.NODE_ENV === 'development' 
              ? { productId: productId.toString(), found: !!product }
              : undefined,
          },
          { status: 404 }
        );
      }
      
      // Log successful deletion
      console.log(`[Force Delete] Successfully deleted product ${productId}`);
      
      return NextResponse.json({
        success: true,
        message: 'Đã xóa vĩnh viễn sản phẩm',
      });
    } catch (error: any) {
      console.error('[Admin Product Force Delete API] Error:', error);
      return NextResponse.json(
        { 
          error: error.message || 'Failed to force delete product',
          details: process.env.NODE_ENV === 'development' 
            ? { stack: error.stack }
            : undefined,
        },
        { status: 500 }
      );
    }
  }, 'product:delete');
}

