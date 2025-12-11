/**
 * Public Categories API Route
 * GET /api/cms/categories
 * 
 * Fetch categories from MongoDB (public endpoint)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCollections } from '@/lib/db';
import { mapMongoCategory } from '@/lib/utils/productMapper';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    const { categories } = await getCollections();
    
    // Build query
    const query: any = {};
    const parentId = searchParams.get('parent');
    if (parentId === '0' || parentId === null) {
      query.parentId = null; // Top-level categories
    } else if (parentId) {
      query.parentId = parentId;
    }
    
    // Fetch categories
    const categoriesList = await categories
      .find(query)
      .sort({ position: 1, name: 1 })
      .toArray();
    
    // Map to frontend format
    const mappedCategories = categoriesList.map((cat) => mapMongoCategory(cat));
    
    return NextResponse.json({ categories: mappedCategories });
  } catch (error: any) {
    console.error('[Categories API] Error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to fetch categories',
        details: process.env.NODE_ENV === 'development' 
          ? { stack: error.stack }
          : undefined,
      },
      { status: 500 }
    );
  }
}

