/**
 * Admin Category Toggle Status API Route
 * PUT /api/admin/categories/[id]/toggle-status - Toggle category status
 * 
 * Protected route - requires authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCollections, ObjectId } from '@/lib/db';
import { mapMongoCategory } from '@/lib/utils/productMapper';

export const dynamic = 'force-dynamic';

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
    
    // Toggle status
    const currentStatus = category.status || 'active';
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    
    // Update category
    await categories.updateOne(
      { _id: categoryId },
      { 
        $set: { 
          status: newStatus,
          updatedAt: new Date(),
        } 
      }
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
    
    return NextResponse.json({ 
      category: mappedCategory,
      message: `Category status changed to ${newStatus}`,
    });
  } catch (error: any) {
    console.error('[Admin Category Toggle Status API] Error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to toggle category status',
        details: process.env.NODE_ENV === 'development' 
          ? { stack: error.stack }
          : undefined,
      },
      { status: 500 }
    );
  }
}

