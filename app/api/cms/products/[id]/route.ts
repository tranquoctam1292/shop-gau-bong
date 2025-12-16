/**
 * Public Single Product API Route
 * GET /api/cms/products/[id]
 * 
 * Fetch single product from MongoDB by ID or slug
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCollections, ObjectId } from '@/lib/db';
import { mapMongoProduct, MongoProduct } from '@/lib/utils/productMapper';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { products } = await getCollections();
    const { id } = params;
    
    // Try to find by ObjectId first, then by slug
    let product = null;
    
    if (ObjectId.isValid(id)) {
      product = await products.findOne({
        _id: new ObjectId(id),
        status: 'publish',
        isActive: true,
        $or: [
          { deletedAt: null },
          { deletedAt: { $exists: false } },
        ],
      });
    }
    
    // If not found by ID, try by slug
    if (!product) {
      product = await products.findOne({
        slug: id,
        status: 'publish',
        isActive: true,
        $or: [
          { deletedAt: null },
          { deletedAt: { $exists: false } },
        ],
      });
    }
    
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    // Map to frontend format
    const mappedProduct = mapMongoProduct(product as unknown as MongoProduct);
    
    // Populate category if exists
    if (product.category) {
      const { categories } = await getCollections();
      let categoryDoc = null;
      
      if (ObjectId.isValid(product.category)) {
        categoryDoc = await categories.findOne({ _id: new ObjectId(product.category) });
      } else {
        categoryDoc = await categories.findOne({ slug: product.category });
      }
      
      if (categoryDoc) {
        mappedProduct.categories = [{
          id: parseInt(categoryDoc._id.toString(), 16) || 0,
          name: categoryDoc.name,
          slug: categoryDoc.slug,
        }];
      }
    }
    
    return NextResponse.json({ product: mappedProduct });
  } catch (error) {
    console.error('[Product API] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' 
          ? { stack: errorStack }
          : undefined,
      },
      { status: 500 }
    );
  }
}

