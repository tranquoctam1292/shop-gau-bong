/**
 * Admin Force Delete Product API Route
 * DELETE /api/admin/products/[id]/force - Force delete product (permanent)
 * 
 * Protected route - requires authentication
 * WARNING: This permanently deletes the product from database
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCollections, ObjectId } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function DELETE(
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
    
    if (ObjectId.isValid(id)) {
      productId = new ObjectId(id);
    } else {
      const product = await products.findOne({ slug: id });
      if (product) {
        productId = product._id;
      }
    }
    
    if (!productId) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    // Force Delete: Permanently delete from database
    const result = await products.deleteOne({ _id: productId });
    
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Product not found or already deleted' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Đã xóa vĩnh viễn',
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
}

