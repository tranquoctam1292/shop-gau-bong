/**
 * Admin Categories Reorder API Route
 * PUT /api/admin/categories/reorder - Bulk update category positions
 * 
 * Protected route - requires authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCollections, ObjectId } from '@/lib/db';
import { z } from 'zod';
import { withAuthAdmin, AuthenticatedRequest } from '@/lib/middleware/authMiddleware';

export const dynamic = 'force-dynamic';

// Reorder schema
const reorderSchema = z.object({
  items: z.array(z.object({
    id: z.string(),
    position: z.number(),
    parentId: z.string().nullable().optional(),
  })),
});

export async function PUT(request: NextRequest) {
  return withAuthAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      // Permission: category:manage or product:update (checked by middleware)
      const body = await req.json();
    
    // Validate input
    const validatedData = reorderSchema.parse(body);
    
    const { categories } = await getCollections();
    const { checkCircularReference } = await import('@/lib/utils/categoryHelpers');
    
    // Validate all categories exist and update positions
    const updates: Promise<any>[] = [];
    
    for (const item of validatedData.items) {
      let categoryId: ObjectId | null = null;
      
      if (ObjectId.isValid(item.id)) {
        categoryId = new ObjectId(item.id);
      } else {
        const category = await categories.findOne({ slug: item.id });
        if (category) {
          categoryId = category._id;
        }
      }
      
      if (!categoryId) {
        return NextResponse.json(
          { error: `Category not found: ${item.id}` },
          { status: 404 }
        );
      }
      
      // If parentId is being updated, check circular reference
      if (item.parentId !== undefined) {
        const category = await categories.findOne({ _id: categoryId });
        if (category) {
          const currentParentId = category.parentId || null;
          
          // Only check if parent is actually changing
          if (item.parentId !== currentParentId) {
            // Prevent self-reference
            if (item.parentId === categoryId.toString()) {
              return NextResponse.json(
                { error: `Category cannot be its own parent: ${item.id}` },
                { status: 400 }
              );
            }
            
            // Check circular reference
            if (item.parentId) {
              const isCircular = await checkCircularReference(
                categoryId.toString(),
                item.parentId
              );
              
              if (isCircular) {
                return NextResponse.json(
                  { error: `Circular reference detected for category: ${item.id}` },
                  { status: 400 }
                );
              }
            }
          }
        }
      }
      
      // Build update object
      const updateData: any = {
        position: item.position,
        updatedAt: new Date(),
      };
      
      if (item.parentId !== undefined) {
        updateData.parentId = item.parentId || null;
      }
      
      // Queue update
      updates.push(
        categories.updateOne(
          { _id: categoryId },
          { $set: updateData }
        )
      );
    }
    
    // Execute all updates
    await Promise.all(updates);
    
    return NextResponse.json({
      message: `Successfully reordered ${validatedData.items.length} categories`,
      count: validatedData.items.length,
    });
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
    
    console.error('[Admin Categories Reorder API] Error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to reorder categories',
        details: process.env.NODE_ENV === 'development' 
          ? { stack: error.stack }
          : undefined,
      },
      { status: 500 }
    );
    }
  }, 'category:manage');
}

