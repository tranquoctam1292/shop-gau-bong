/**
 * Admin Restore Product API Route
 * PATCH /api/admin/products/[id]/restore - Restore product from trash
 * 
 * Protected route - requires authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCollections, ObjectId } from '@/lib/db';
import { mapMongoProduct } from '@/lib/utils/productMapper';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authentication check
    const { requireAdmin } = await import('@/lib/auth');
    try {
      await requireAdmin();
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { products } = await getCollections();
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
    
    // Check if product is actually in trash
    if (!product.deletedAt) {
      return NextResponse.json(
        { error: 'Product is not in trash' },
        { status: 400 }
      );
    }
    
    // Restore: Set deletedAt = null and restore previous status (or set to 'draft')
    const previousStatus = product.status === 'trash' ? 'draft' : product.status || 'draft';
    const now = new Date();
    
    await products.updateOne(
      { _id: productId },
      {
        $set: {
          deletedAt: null,
          status: previousStatus,
          updatedAt: now,
        },
      }
    );
    
    // Fetch restored product
    const restoredProduct = await products.findOne({ _id: productId });
    const mappedProduct = restoredProduct ? mapMongoProduct(restoredProduct) : null;
    
    return NextResponse.json({
      success: true,
      message: 'Đã khôi phục',
      product: mappedProduct,
    });
  } catch (error: any) {
    console.error('[Admin Product Restore API] Error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to restore product',
        details: process.env.NODE_ENV === 'development' 
          ? { stack: error.stack }
          : undefined,
      },
      { status: 500 }
    );
  }
}

