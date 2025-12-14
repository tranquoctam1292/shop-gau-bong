/**
 * Admin Single Attribute API Route
 * GET /api/admin/attributes/[id] - Get attribute
 * PUT /api/admin/attributes/[id] - Update attribute
 * DELETE /api/admin/attributes/[id] - Delete attribute
 * 
 * Protected route - requires authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCollections, ObjectId } from '@/lib/db';
import { generateSlug } from '@/lib/utils/slug';
import { z } from 'zod';
import { withAuthAdmin, AuthenticatedRequest } from '@/lib/middleware/authMiddleware';

export const dynamic = 'force-dynamic';

// Attribute update schema (all fields optional except name)
const attributeUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  type: z.enum(['text', 'color', 'image', 'button']).optional(),
  sortOrder: z.enum(['name', 'number', 'id']).optional(),
});

/**
 * GET /api/admin/attributes/[id]
 * Get single attribute
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuthAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      const { productAttributes, productAttributeTerms } = await getCollections();
      const { id } = params;

      // Try to find by ObjectId first, then by slug
      let attribute = null;

      if (ObjectId.isValid(id)) {
        attribute = await productAttributes.findOne({
          _id: new ObjectId(id),
        });
      }

      if (!attribute) {
        attribute = await productAttributes.findOne({ slug: id });
      }

      if (!attribute) {
        return NextResponse.json(
          { error: 'Attribute not found' },
          { status: 404 }
        );
      }

      // Get terms count
      const termsCount = await productAttributeTerms.countDocuments({
        attributeId: attribute._id.toString(),
      });

      return NextResponse.json({
        attribute: {
          ...attribute,
          id: attribute._id.toString(),
          termsCount,
        },
      });
  } catch (error: any) {
    console.error('[Admin Attribute API] Error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to fetch attribute',
        details: process.env.NODE_ENV === 'development'
          ? { stack: error.stack }
          : undefined,
      },
      { status: 500 }
    );
    }
  });
}

/**
 * PUT /api/admin/attributes/[id]
 * Update attribute
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuthAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      const { productAttributes } = await getCollections();
      const { id } = params;
      const body = await req.json();

      // Validate input
      const validatedData = attributeUpdateSchema.parse(body);

        // Find attribute
      let attribute = null;
      if (ObjectId.isValid(id)) {
        attribute = await productAttributes.findOne({
          _id: new ObjectId(id),
        });
      }
      if (!attribute) {
        attribute = await productAttributes.findOne({ slug: id });
      }

      if (!attribute) {
        return NextResponse.json(
          { error: 'Attribute not found' },
          { status: 404 }
        );
      }

      const attributeId = attribute._id;

      // Handle slug generation if name is updated
      let slug = validatedData.slug;
      if (validatedData.name && !slug) {
        slug = generateSlug(validatedData.name);
        // Check if slug already exists (excluding current attribute)
        const existingAttribute = await productAttributes.findOne({
          slug,
          _id: { $ne: attributeId },
        });
        if (existingAttribute) {
          // Append number to make it unique
          let counter = 1;
          let uniqueSlug = `${slug}-${counter}`;
          while (
            await productAttributes.findOne({
              slug: uniqueSlug,
              _id: { $ne: attributeId },
            })
          ) {
            counter++;
            uniqueSlug = `${slug}-${counter}`;
          }
          slug = uniqueSlug;
        }
      }

      // Prepare update data with proper typing
      interface AttributeUpdateData {
        name?: string;
        slug?: string;
        type?: 'text' | 'color' | 'image' | 'button';
        sortOrder?: 'name' | 'number' | 'id';
        updatedAt: Date;
      }

      const updateData: AttributeUpdateData = {
        ...validatedData,
        updatedAt: new Date(),
      };
      if (slug) {
        updateData.slug = slug;
      }

      // Update attribute
      await productAttributes.updateOne(
        { _id: attributeId },
        { $set: updateData }
      );

      // Fetch updated attribute
      const updatedAttribute = await productAttributes.findOne({
        _id: attributeId,
      });

      if (!updatedAttribute) {
        return NextResponse.json(
          { error: 'Failed to update attribute' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        attribute: {
          ...updatedAttribute,
          id: updatedAttribute._id.toString(),
        },
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

    console.error('[Admin Attribute API] Error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to update attribute',
        details: process.env.NODE_ENV === 'development'
          ? { stack: error.stack }
          : undefined,
      },
      { status: 500 }
    );
    }
  }, 'product:update');
}

/**
 * DELETE /api/admin/attributes/[id]
 * Delete attribute
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuthAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      const { productAttributes, productAttributeTerms } = await getCollections();
      const { id } = params;

      // Find attribute
      let attribute = null;
      if (ObjectId.isValid(id)) {
        attribute = await productAttributes.findOne({
          _id: new ObjectId(id),
        });
      }
      if (!attribute) {
        attribute = await productAttributes.findOne({ slug: id });
      }

      if (!attribute) {
        return NextResponse.json(
          { error: 'Attribute not found' },
          { status: 404 }
        );
      }

      const attributeId = attribute._id.toString();

      // Check if attribute has terms
      const termsCount = await productAttributeTerms.countDocuments({
        attributeId,
      });

      if (termsCount > 0) {
        return NextResponse.json(
          {
            error: 'Cannot delete attribute with existing terms',
            details: {
              termsCount,
              message: 'Please delete all terms first',
            },
          },
          { status: 400 }
        );
      }

      // Delete attribute
      await productAttributes.deleteOne({ _id: attribute._id });

      return NextResponse.json({
        message: 'Attribute deleted successfully',
        deletedId: attributeId,
      });
    } catch (error: any) {
      console.error('[Admin Attribute API] Error:', error);
      return NextResponse.json(
        {
          error: error.message || 'Failed to delete attribute',
          details: process.env.NODE_ENV === 'development'
            ? { stack: error.stack }
            : undefined,
        },
        { status: 500 }
      );
    }
  }, 'product:update');
}
