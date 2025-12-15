/**
 * Admin Product Duplicate API Route
 * POST /api/admin/products/[id]/duplicate - Duplicate product
 * 
 * Protected route - requires authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCollections, ObjectId } from '@/lib/db';
import { withAuthAdmin, AuthenticatedRequest } from '@/lib/middleware/authMiddleware';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuthAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      const { products } = await getCollections();
    const { id } = params;
    
    // Find product
    let product = null;
    
    if (ObjectId.isValid(id)) {
      product = await products.findOne({ _id: new ObjectId(id) });
    }
    
    if (!product) {
      product = await products.findOne({ slug: id });
    }
    
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    // Create duplicate
    const duplicateProduct: any = {
      ...product,
      _id: undefined, // Remove _id to create new document
      name: `${product.name} (Copy)`,
      slug: `${product.slug}-copy-${Date.now()}`,
      status: 'draft', // Always create as draft
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    // Remove MongoDB-specific fields
    delete duplicateProduct._id;
    
    // Update variants IDs if they exist
    if (duplicateProduct.variants && Array.isArray(duplicateProduct.variants)) {
      duplicateProduct.variants = duplicateProduct.variants.map((variant: any) => ({
        ...variant,
        id: `variant-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      }));
    }
    
    // Insert duplicate
    const result = await products.insertOne(duplicateProduct);
    
    // Fetch created product
    const createdProduct = await products.findOne({ _id: result.insertedId });
    
    if (!createdProduct) {
      return NextResponse.json(
        { error: 'Failed to duplicate product' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { 
        product: createdProduct,
        message: 'Product duplicated successfully',
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[Admin Product Duplicate API] Error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to duplicate product',
        details: process.env.NODE_ENV === 'development' 
          ? { stack: error.stack }
          : undefined,
      },
      { status: 500 }
    );
    }
  }, 'product:create'); // Duplicate is essentially creating a new product
}

