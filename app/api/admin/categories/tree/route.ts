/**
 * Admin Categories Tree API Route
 * GET /api/admin/categories/tree - Get categories as tree structure
 * 
 * Protected route - requires authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCollections } from '@/lib/db';
import { mapMongoCategory, MongoCategory } from '@/lib/utils/productMapper';
import { buildCategoryTree } from '@/lib/utils/categoryHelpers';
import { withAuthAdmin, AuthenticatedRequest } from '@/lib/middleware/authMiddleware';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return withAuthAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      // Permission: category:read or product:read (checked by middleware)
      const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get('status') || 'active'; // 'active', 'inactive', or 'all'
    
    const { categories } = await getCollections();
    
    // Build query - always filter out deleted categories
    const query: any = {
      deletedAt: null, // Soft delete filter
    };
    
    // Status filter
    if (status !== 'all') {
      query.status = status;
    }
    
    // Fetch all categories
    const startTime = Date.now();
    const categoriesList = await categories
      .find(query)
      .sort({ position: 1, name: 1 })
      .toArray();
    
    // Map to frontend format
    const mappedCategories = categoriesList.map((cat) => mapMongoCategory(cat as unknown as MongoCategory));
    
    // Build tree structure
    const tree = buildCategoryTree(mappedCategories);
    
    const duration = Date.now() - startTime;
    
    // Performance check (should be < 200ms for < 1000 categories)
    if (process.env.NODE_ENV === 'development' && duration > 200) {
      console.warn(`[Category Tree API] Performance warning: ${duration}ms for ${categoriesList.length} categories`);
    }
    
    return NextResponse.json({ 
      categories: tree,
      type: 'tree',
      count: categoriesList.length,
      duration: `${duration}ms`,
    });
  } catch (error: any) {
    console.error('[Admin Categories Tree API] Error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to fetch category tree',
        details: process.env.NODE_ENV === 'development' 
          ? { stack: error.stack }
          : undefined,
      },
      { status: 500 }
    );
  }
  }, 'category:read');
}

