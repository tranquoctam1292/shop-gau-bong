/**
 * Admin Categories API Route
 * GET /api/admin/categories - List categories
 * POST /api/admin/categories - Create new category
 * 
 * Protected route - requires authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCollections, ObjectId } from '@/lib/db';
import { mapMongoCategory, MongoCategory } from '@/lib/utils/productMapper';
import { buildCategoryTree } from '@/lib/utils/categoryHelpers';
import { z } from 'zod';
import { handleValidationError } from '@/lib/utils/validation-errors';
import { withAuthAdmin, AuthenticatedRequest } from '@/lib/middleware/authMiddleware';

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
  featured: z.boolean().default(false), // Featured category for homepage (max 4)
  metaTitle: z.string().max(255).optional(),
  metaDesc: z.string().max(500).optional(),
});

export async function GET(request: NextRequest) {
  return withAuthAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      // Permission: category:read or product:read (checked by middleware)
      const searchParams = req.nextUrl.searchParams;
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
    const mappedCategories = categoriesList.map((cat) => mapMongoCategory(cat as unknown as MongoCategory));
    
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
  }, 'category:read');
}

export async function POST(request: NextRequest) {
  return withAuthAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      // Permission: category:manage or product:update (checked by middleware)
      const body = await req.json();
    
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
    
    // Validate featured count (max 4 featured categories)
    if (validatedData.featured === true) {
      const featuredCount = await categories.countDocuments({
        featured: true,
        deletedAt: null,
      });
      
      if (featuredCount >= 4) {
        return NextResponse.json(
          { error: 'Chỉ có thể chọn tối đa 4 danh mục nổi bật. Vui lòng bỏ chọn một danh mục khác trước.' },
          { status: 400 }
        );
      }
    }
    
    // Create category document
    const categoryDoc = {
      ...validatedData,
      slug,
      status: validatedData.status || 'active',
      featured: validatedData.featured || false,
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
    
    const mappedCategory = mapMongoCategory(createdCategory as unknown as MongoCategory);
    
    return NextResponse.json(
      { category: mappedCategory },
      { status: 201 }
    );
  } catch (error: any) {
    // Handle Zod validation errors
    const validationError = handleValidationError(error);
    if (validationError) {
      return validationError;
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
  }, 'category:manage');
}

