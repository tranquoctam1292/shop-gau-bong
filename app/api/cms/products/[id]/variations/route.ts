/**
 * Product Variations API Route
 * GET /api/cms/products/[id]/variations
 * 
 * Fetch product variations from MongoDB
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCollections, ObjectId } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { products } = await getCollections();
    const { id } = params;
    
    // Find product by ID or slug
    let product = null;
    
    if (ObjectId.isValid(id)) {
      product = await products.findOne({
        _id: new ObjectId(id),
      });
    }
    
    if (!product) {
      product = await products.findOne({
        slug: id,
      });
    }
    
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    // Return variations (nested in product document)
    const variations = product.variants || [];
    
    return NextResponse.json({ variations });
  } catch (error: any) {
    console.error('[Variations API] Error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to fetch variations',
        details: process.env.NODE_ENV === 'development' 
          ? { stack: error.stack }
          : undefined,
      },
      { status: 500 }
    );
  }
}

