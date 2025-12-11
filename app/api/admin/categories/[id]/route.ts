/**
 * Admin Single Category API Route
 * GET /api/admin/categories/[id] - Get single category
 * PUT /api/admin/categories/[id] - Update category
 * DELETE /api/admin/categories/[id] - Delete category
 * 
 * Protected route - requires authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCollections, ObjectId } from '@/lib/db';
import { mapMongoCategory } from '@/lib/utils/productMapper';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// Category update schema
const categoryUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  description: z.string().optional(),
  parentId: z.string().nullable().optional(),
  imageUrl: z.string().optional(),
  position: z.number().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authentication check
    const { requireAdmin } = await import('@/lib/auth');
    try {
      await requireAdmin();
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { categories } = await getCollections();
    const { id } = params;
    
    // Find by ObjectId or slug
    let category = null;
    
    if (ObjectId.isValid(id)) {
      category = await categories.findOne({ _id: new ObjectId(id) });
    }
    
    if (!category) {
      category = await categories.findOne({ slug: id });
    }
    
    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }
    
    const mappedCategory = mapMongoCategory(category);
    
    return NextResponse.json({ category: mappedCategory });
  } catch (error: any) {
    console.error('[Admin Category API] Error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to fetch category',
        details: process.env.NODE_ENV === 'development' 
          ? { stack: error.stack }
          : undefined,
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authentication check
    const { requireAdmin } = await import('@/lib/auth');
    try {
      await requireAdmin();
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { categories } = await getCollections();
    const { id } = params;
    const body = await request.json();
    
    // Validate input
    const validatedData = categoryUpdateSchema.parse(body);
    
    // Find category
    let category = null;
    let categoryId: ObjectId | null = null;
    
    if (ObjectId.isValid(id)) {
      categoryId = new ObjectId(id);
      category = await categories.findOne({ _id: categoryId });
    }
    
    if (!category) {
      category = await categories.findOne({ slug: id });
      if (category) {
        categoryId = category._id;
      }
    }
    
    if (!category || !categoryId) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }
    
    // Check slug uniqueness if slug is being updated
    if (validatedData.slug && validatedData.slug !== category.slug) {
      const existingCategory = await categories.findOne({ 
        slug: validatedData.slug,
        _id: { $ne: categoryId },
      });
      if (existingCategory) {
        return NextResponse.json(
          { error: 'Category with this slug already exists' },
          { status: 409 }
        );
      }
    }
    
    // Prevent setting parent to itself
    if (validatedData.parentId && validatedData.parentId === id) {
      return NextResponse.json(
        { error: 'Category cannot be its own parent' },
        { status: 400 }
      );
    }
    
    // Update category
    const updateData: any = {
      ...validatedData,
      updatedAt: new Date(),
    };
    
    await categories.updateOne(
      { _id: categoryId },
      { $set: updateData }
    );
    
    // Fetch updated category
    const updatedCategory = await categories.findOne({ _id: categoryId });
    
    if (!updatedCategory) {
      return NextResponse.json(
        { error: 'Failed to update category' },
        { status: 500 }
      );
    }
    
    const mappedCategory = mapMongoCategory(updatedCategory);
    
    return NextResponse.json({ category: mappedCategory });
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
    
    console.error('[Admin Category API] Error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to update category',
        details: process.env.NODE_ENV === 'development' 
          ? { stack: error.stack }
          : undefined,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authentication check
    const { requireAdmin } = await import('@/lib/auth');
    try {
      await requireAdmin();
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { categories, products } = await getCollections();
    const { id } = params;
    
    // Find category
    let categoryId: ObjectId | null = null;
    
    if (ObjectId.isValid(id)) {
      categoryId = new ObjectId(id);
    } else {
      const category = await categories.findOne({ slug: id });
      if (category) {
        categoryId = category._id;
      }
    }
    
    if (!categoryId) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }
    
    // Check if category has children
    const childrenCount = await categories.countDocuments({ 
      parentId: categoryId.toString() 
    });
    
    if (childrenCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete category with subcategories. Please delete or move subcategories first.' },
        { status: 400 }
      );
    }
    
    // Check if category has products
    const productsCount = await products.countDocuments({ 
      category: categoryId.toString() 
    });
    
    if (productsCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete category with products. Please remove or reassign products first.' },
        { status: 400 }
      );
    }
    
    // Delete category
    await categories.deleteOne({ _id: categoryId });
    
    return NextResponse.json(
      { message: 'Category deleted successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[Admin Category API] Error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to delete category',
        details: process.env.NODE_ENV === 'development' 
          ? { stack: error.stack }
          : undefined,
      },
      { status: 500 }
    );
  }
}

