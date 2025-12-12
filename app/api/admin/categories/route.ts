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
import { buildCategoryTree } from '@/lib/utils/categoryHelpers';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// Category schema for validation
const categorySchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).optional(), // Optional - will auto-generate if not provided
  description: z.string().optional(),
  parentId: z.string().nullable().optional(),
  imageUrl: z.string().optional(),
  position: z.number().default(0),
  status: z.enum(['active', 'inactive']).default('active'),
  metaTitle: z.string().max(255).optional(),
  metaDesc: z.string().max(500).optional(),
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
    const type = searchParams.get('type') || 'flat'; // 'tree' or 'flat'
    const status = searchParams.get('status') || 'all'; // 'active', 'inactive', or 'all'
    const parentId = searchParams.get('parent');
    
    const { categories } = await getCollections();
    
    // Build query - always filter out deleted categories
    const query: any = {
      deletedAt: null, // Soft delete filter
    };
    
    // Status filter
    if (status !== 'all') {
      query.status = status;
    }
    
    // Parent filter
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
    
    // Map to frontend format
    const mappedCategories = categoriesList.map((cat) => mapMongoCategory(cat));
    
    // Return tree structure if requested
    if (type === 'tree') {
      const tree = buildCategoryTree(mappedCategories);
      return NextResponse.json({ categories: tree, type: 'tree' });
    }
    
    return NextResponse.json({ categories: mappedCategories, type: 'flat' });
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
    const { generateUniqueSlug, checkCircularReference } = await import('@/lib/utils/categoryHelpers');
    
    // Auto-generate slug if not provided
    let slug = validatedData.slug;
    if (!slug) {
      // Auto-generate from name
      slug = await generateUniqueSlug(validatedData.name);
    } else {
      // User provided slug - check uniqueness and add suffix if needed
      const existing = await categories.findOne({ 
        slug: slug,
        deletedAt: null,
      });
      
      if (existing) {
        // Slug exists, generate unique one with suffix
        slug = await generateUniqueSlug(validatedData.name);
      }
    }
    
    // Validate parentId if provided
    if (validatedData.parentId) {
      // Check if parent exists
      const parent = await categories.findOne({ 
        _id: new ObjectId(validatedData.parentId),
        deletedAt: null 
      });
      
      if (!parent) {
        return NextResponse.json(
          { error: 'Parent category not found' },
          { status: 404 }
        );
      }
      
      // Check circular reference (shouldn't happen on create, but check anyway)
      const isCircular = await checkCircularReference(
        '', // No categoryId yet (creating new)
        validatedData.parentId
      );
      
      if (isCircular) {
        return NextResponse.json(
          { error: 'Cannot set parent to a descendant category (circular reference)' },
          { status: 400 }
        );
      }
    }
    
    // Create category document
    const categoryDoc = {
      ...validatedData,
      slug,
      status: validatedData.status || 'active',
      deletedAt: null, // Not deleted
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

