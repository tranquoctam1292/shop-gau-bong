import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

/**
 * POST /api/admin/products/validate-sku
 * Validate SKU uniqueness
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sku = searchParams.get('sku');
    const excludeId = searchParams.get('excludeId');

    if (!sku || !sku.trim()) {
      return NextResponse.json({ available: true });
    }

    const { db } = await connectToDatabase();
    const productsCollection = db.collection('products');

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
    const existingProduct = await productsCollection.findOne(query);

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
