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
import { withAuthAdmin, AuthenticatedRequest } from '@/lib/middleware/authMiddleware';

export const dynamic = 'force-dynamic';

// Category update schema
const categoryUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  description: z.string().optional(),
  parentId: z.string().nullable().optional(),
  imageUrl: z.string().optional(),
  position: z.number().optional(),
  status: z.enum(['active', 'inactive']).optional(),
  featured: z.boolean().optional(), // Featured category for homepage (max 4)
  metaTitle: z.string().max(255).optional(),
  metaDesc: z.string().max(500).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuthAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      // Permission: category:read or product:read (checked by middleware)
      const { categories } = await getCollections();
      const { id } = params;
      
      // Find by ObjectId or slug (filter out deleted for admin view)
      let category = null;
      const query: any = {
        deletedAt: null, // Filter out deleted categories
      };
      
      if (ObjectId.isValid(id)) {
        query._id = new ObjectId(id);
      } else {
        query.slug = id;
      }
      
      category = await categories.findOne(query);
      
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
  }, 'category:read');
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuthAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      // Permission: category:manage or product:update (checked by middleware)
      const { categories } = await getCollections();
      const { id } = params;
      const body = await req.json();
    
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
        // Check if new slug already exists
        const existing = await categories.findOne({
          slug: validatedData.slug,
          _id: { $ne: categoryId },
          deletedAt: null,
        });
        
        if (existing) {
          // Slug exists, generate unique one with suffix
          const { generateUniqueSlug } = await import('@/lib/utils/categoryHelpers');
          validatedData.slug = await generateUniqueSlug(
            validatedData.name || category.name,
            [],
            categoryId.toString()
          );
        }
      }
      
      // Validate parentId if being updated
      if (validatedData.parentId !== undefined) {
        const { checkCircularReference } = await import('@/lib/utils/categoryHelpers');
        
        // Prevent setting parent to itself
        if (validatedData.parentId === categoryId.toString()) {
          return NextResponse.json(
            { error: 'Category cannot be its own parent' },
            { status: 400 }
          );
        }
        
        // Check circular reference
        if (validatedData.parentId) {
          const isCircular = await checkCircularReference(
            categoryId.toString(),
            validatedData.parentId
          );
          
          if (isCircular) {
            return NextResponse.json(
              { error: 'Cannot set parent to a descendant category (circular reference)' },
              { status: 400 }
            );
          }
          
          // Verify parent exists and is not deleted
          const parent = await categories.findOne({
            _id: new ObjectId(validatedData.parentId),
            deletedAt: null,
          });
          
          if (!parent) {
            return NextResponse.json(
              { error: 'Parent category not found or has been deleted' },
              { status: 404 }
            );
          }
        }
      }
      
      // Validate featured count (max 4 featured categories)
      if (validatedData.featured === true) {
        const featuredCount = await categories.countDocuments({
          featured: true,
          deletedAt: null,
          _id: { $ne: categoryId }, // Exclude current category
        });
        
        if (featuredCount >= 4) {
          return NextResponse.json(
            { error: 'Chỉ có thể chọn tối đa 4 danh mục nổi bật. Vui lòng bỏ chọn một danh mục khác trước.' },
            { status: 400 }
          );
        }
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
  }, 'category:manage');
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuthAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      // Permission: category:manage or product:update (checked by middleware)
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
      
      // Check if category has children (not deleted)
      const childrenCount = await categories.countDocuments({ 
        parentId: categoryId.toString(),
        deletedAt: null, // Only count non-deleted children
      });
      
      if (childrenCount > 0) {
        return NextResponse.json(
          { error: 'Cannot delete category with subcategories. Please delete or move subcategories first.' },
          { status: 400 }
        );
      }
      
      // Check if category has products
      const productsCount = await products.countDocuments({ 
        $or: [
          { category: categoryId.toString() },
          { categories: categoryId.toString() }
        ],
        deletedAt: null, // Only count non-deleted products
      });
      
      if (productsCount > 0) {
        return NextResponse.json(
          { error: 'Cannot delete category with products. Please remove or reassign products first.' },
          { status: 400 }
        );
      }
      
      // Soft delete: Set deletedAt instead of deleting
      await categories.updateOne(
        { _id: categoryId },
        { 
          $set: { 
            deletedAt: new Date(),
            updatedAt: new Date(),
          } 
        }
      );
      
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
  }, 'category:manage');
}

