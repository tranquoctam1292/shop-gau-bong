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
    
    // Populate categories before mapping
    let populatedCategories: Array<{ id: string | number; name: string; slug: string }> = [];
    if (product.category || product.categoryId || (product.categories && product.categories.length > 0)) {
      const { categories } = await getCollections();
      const categoryIds = product.categories && product.categories.length > 0 
        ? product.categories 
        : (product.categoryId ? [product.categoryId] : (product.category ? [product.category] : []));
      
      // Fetch all category documents
      const categoryDocs = await categories.find({
        $or: [
          { _id: { $in: categoryIds.filter((id: string) => ObjectId.isValid(id)).map((id: string) => new ObjectId(id)) } },
          { slug: { $in: categoryIds.filter((id: string) => !ObjectId.isValid(id)) } },
        ],
      }).toArray();
      
      // Map to frontend format (use string ID instead of parseInt)
      populatedCategories = categoryDocs.map((cat: any) => ({
        id: cat._id.toString(), // Use ObjectId string directly
        name: cat.name,
        slug: cat.slug,
      }));
    }
    
    // Map to frontend format with populated categories
    const mappedProduct = mapMongoProduct(product as unknown as MongoProduct, populatedCategories);
    
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

