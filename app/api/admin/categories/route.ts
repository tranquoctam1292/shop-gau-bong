/**
 * Admin Categories API Route
 * GET /api/admin/categories - List categories
 * POST /api/admin/categories - Create new category
 * 
 * Protected route - requires authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCollections, ObjectId } from '@/lib/db';
import { mapMongoCategory } from '@/lib/utils/productMapper';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// Category schema for validation
const categorySchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  parentId: z.string().nullable().optional(),
  imageUrl: z.string().optional(),
  position: z.number().default(0),
});

export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const { requireAdmin } = await import('@/lib/auth');
    try {
      await requireAdmin();
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const searchParams = request.nextUrl.searchParams;
    const parentId = searchParams.get('parent');
    
    const { categories } = await getCollections();
    
    // Build query
    const query: any = {};
    if (parentId === '0' || parentId === null) {
      query.parentId = null;
    } else if (parentId) {
      query.parentId = parentId;
    }
    
    // Fetch categories
    const categoriesList = await categories
      .find(query)
      .sort({ position: 1, name: 1 })
      .toArray();
    
    const mappedCategories = categoriesList.map((cat) => mapMongoCategory(cat));
    
    return NextResponse.json({ categories: mappedCategories });
  } catch (error: any) {
    console.error('[Admin Categories API] Error:', error);
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

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const { requireAdmin } = await import('@/lib/auth');
    try {
      await requireAdmin();
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    
    // Validate input
    const validatedData = categorySchema.parse(body);
    
    const { categories } = await getCollections();
    
    // Check if slug already exists
    const existingCategory = await categories.findOne({ slug: validatedData.slug });
    if (existingCategory) {
      return NextResponse.json(
        { error: 'Category with this slug already exists' },
        { status: 409 }
      );
    }
    
    // Create category document
    const categoryDoc = {
      ...validatedData,
      count: 0, // Will be updated when products are assigned
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const result = await categories.insertOne(categoryDoc);
    
    // Fetch created category
    const createdCategory = await categories.findOne({ _id: result.insertedId });
    
    if (!createdCategory) {
      return NextResponse.json(
        { error: 'Failed to create category' },
        { status: 500 }
      );
    }
    
    const mappedCategory = mapMongoCategory(createdCategory);
    
    return NextResponse.json(
      { category: mappedCategory },
      { status: 201 }
    );
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation error',
          details: error.errors,
        },
        { status: 400 }
      );
    }
    
    console.error('[Admin Categories API] Error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to create category',
        details: process.env.NODE_ENV === 'development' 
          ? { stack: error.stack }
          : undefined,
      },
      { status: 500 }
    );
  }
}

