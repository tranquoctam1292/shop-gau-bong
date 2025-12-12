import { NextRequest, NextResponse } from 'next/server';
import { getCollections, ObjectId } from '@/lib/db';

/**
 * POST /api/admin/products/validate-sku
 * Validate SKU uniqueness
 */
export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const { requireAdmin } = await import('@/lib/auth');
    try {
      await requireAdmin();
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sku = searchParams.get('sku');
    const excludeId = searchParams.get('excludeId');

    if (!sku || !sku.trim()) {
      return NextResponse.json({ available: true });
    }

    const { products } = await getCollections();

    // Build query
    const query: any = { sku: sku.trim() };
    
    // Exclude current product if editing
    if (excludeId) {
      try {
        query._id = { $ne: new ObjectId(excludeId) };
      } catch {
        // Invalid ObjectId, ignore
      }
    }

    // Check if SKU exists
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
}
