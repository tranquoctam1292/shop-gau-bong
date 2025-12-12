/**
 * Admin Single Term API Route
 * GET /api/admin/attributes/[id]/terms/[termId] - Get term
 * PUT /api/admin/attributes/[id]/terms/[termId] - Update term
 * DELETE /api/admin/attributes/[id]/terms/[termId] - Delete term
 * 
 * Protected route - requires authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCollections, ObjectId } from '@/lib/db';
import { generateSlug } from '@/lib/utils/slug';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/attributes/[id]/terms/[termId]
 * Get single term
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; termId: string } }
) {
  try {
    // Authentication check
    const { requireAdmin } = await import('@/lib/auth');
    try {
      await requireAdmin();
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { productAttributes, productAttributeTerms } = await getCollections();
    const { id, termId } = params;

    // Verify attribute exists
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

    // Find term
    let term = null;
    if (ObjectId.isValid(termId)) {
      term = await productAttributeTerms.findOne({
        _id: new ObjectId(termId),
        attributeId,
      });
    }
    if (!term) {
      term = await productAttributeTerms.findOne({
        slug: termId,
        attributeId,
      });
    }

    if (!term) {
      return NextResponse.json(
        { error: 'Term not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      term: {
        ...term,
        id: term._id.toString(),
      },
    });
  } catch (error: any) {
    console.error('[Admin Term API] Error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to fetch term',
        details: process.env.NODE_ENV === 'development'
          ? { stack: error.stack }
          : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/attributes/[id]/terms/[termId]
 * Update term
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; termId: string } }
) {
  try {
    // Authentication check
    const { requireAdmin } = await import('@/lib/auth');
    try {
      await requireAdmin();
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { productAttributes, productAttributeTerms } = await getCollections();
    const { id, termId } = params;
    const body = await request.json();

    // Verify attribute exists
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
    const attributeType = attribute.type;

    // Find term
    let term = null;
    if (ObjectId.isValid(termId)) {
      term = await productAttributeTerms.findOne({
        _id: new ObjectId(termId),
        attributeId,
      });
    }
    if (!term) {
      term = await productAttributeTerms.findOne({
        slug: termId,
        attributeId,
      });
    }

    if (!term) {
      return NextResponse.json(
        { error: 'Term not found' },
        { status: 404 }
      );
    }

    const termObjectId = term._id;

    // Dynamic schema based on attribute type
    const baseSchema = z.object({
      name: z.string().min(1).optional(),
      slug: z.string().min(1).optional(),
      description: z.string().optional(),
      sortOrder: z.number().optional(),
    });

    let termSchema = baseSchema;

    // Add type-specific fields
    if (attributeType === 'color') {
      termSchema = baseSchema.extend({
        colorHex: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
        colorHex2: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
      });
    } else if (attributeType === 'image' || attributeType === 'button') {
      termSchema = baseSchema.extend({
        imageUrl: z.string().url().optional(),
        imageId: z.string().optional(),
      });
    }

    // Validate input
    const validatedData = termSchema.parse(body);

    // Handle slug generation if name is updated
    let slug = validatedData.slug;
    if (validatedData.name && !slug) {
      slug = generateSlug(validatedData.name);
      // Check if slug already exists (excluding current term)
      const existingTerm = await productAttributeTerms.findOne({
        attributeId,
        slug,
        _id: { $ne: termObjectId },
      });
      if (existingTerm) {
        // Append number to make it unique
        let counter = 1;
        let uniqueSlug = `${slug}-${counter}`;
        while (
          await productAttributeTerms.findOne({
            attributeId,
            slug: uniqueSlug,
            _id: { $ne: termObjectId },
          })
        ) {
          counter++;
          uniqueSlug = `${slug}-${counter}`;
        }
        slug = uniqueSlug;
      }
    }

    // Prepare update data with proper typing
    interface TermUpdateData {
      updatedAt: Date;
      name?: string;
      slug?: string;
      description?: string;
      sortOrder?: number;
      colorHex?: string;
      colorHex2?: string;
      imageUrl?: string;
      imageId?: string;
    }

    const updateData: TermUpdateData = {
      updatedAt: new Date(),
    };

    if (validatedData.name !== undefined) updateData.name = validatedData.name;
    if (slug) updateData.slug = slug;
    if (validatedData.description !== undefined)
      updateData.description = validatedData.description;
    if (validatedData.sortOrder !== undefined)
      updateData.sortOrder = validatedData.sortOrder;

    // Add type-specific fields
    if (attributeType === 'color') {
      if (validatedData.colorHex !== undefined)
        updateData.colorHex = validatedData.colorHex;
      if (validatedData.colorHex2 !== undefined)
        updateData.colorHex2 = validatedData.colorHex2;
    } else if (attributeType === 'image' || attributeType === 'button') {
      if (validatedData.imageUrl !== undefined)
        updateData.imageUrl = validatedData.imageUrl;
      if (validatedData.imageId !== undefined)
        updateData.imageId = validatedData.imageId;
    }

    // Update term
    await productAttributeTerms.updateOne(
      { _id: termObjectId },
      { $set: updateData }
    );

    // Fetch updated term
    const updatedTerm = await productAttributeTerms.findOne({
      _id: termObjectId,
    });

    if (!updatedTerm) {
      return NextResponse.json(
        { error: 'Failed to update term' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      term: {
        ...updatedTerm,
        id: updatedTerm._id.toString(),
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

    console.error('[Admin Term API] Error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to update term',
        details: process.env.NODE_ENV === 'development'
          ? { stack: error.stack }
          : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/attributes/[id]/terms/[termId]
 * Delete term
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; termId: string } }
) {
  try {
    // Authentication check
    const { requireAdmin } = await import('@/lib/auth');
    try {
      await requireAdmin();
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { productAttributes, productAttributeTerms } = await getCollections();
    const { id, termId } = params;

    // Verify attribute exists
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

    // Find term
    let term = null;
    if (ObjectId.isValid(termId)) {
      term = await productAttributeTerms.findOne({
        _id: new ObjectId(termId),
        attributeId,
      });
    }
    if (!term) {
      term = await productAttributeTerms.findOne({
        slug: termId,
        attributeId,
      });
    }

    if (!term) {
      return NextResponse.json(
        { error: 'Term not found' },
        { status: 404 }
      );
    }

    // Check if term is used in any products/variations
    const { products } = await getCollections();
    const termName = term.name;
    const termSlug = term.slug;

    // Check if term is used in productDataMetaBox.attributes (in values array)
    const productsUsingInAttributes = await products.countDocuments({
      'productDataMetaBox.attributes': {
        $elemMatch: {
          $or: [
            { values: termName },
            { values: termSlug },
            { globalAttributeId: attributeId, values: { $in: [termName, termSlug] } },
          ],
        },
      },
    });

    // Check if term is used in productDataMetaBox.variations (in attributes object)
    const productsUsingInVariations = await products.countDocuments({
      $or: [
        {
          'productDataMetaBox.variations': {
            $elemMatch: {
              $or: [
                // Check if any variation's attributes object contains this term
                { [`attributes.${attribute.name}`]: termName },
                { [`attributes.${attribute.name}`]: termSlug },
              ],
            },
          },
        },
        // Also check variants array (converted format)
        {
          variants: {
            $elemMatch: {
              $or: [
                { size: termName },
                { size: termSlug },
                { color: termName },
                { color: termSlug },
              ],
            },
          },
        },
      ],
    });

    const totalUsage = productsUsingInAttributes + productsUsingInVariations;

    if (totalUsage > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete term that is in use',
          details: {
            productsCount: totalUsage,
            attributesCount: productsUsingInAttributes,
            variationsCount: productsUsingInVariations,
            message: 'Please remove this term from all products first',
          },
        },
        { status: 400 }
      );
    }

    // Delete term
    await productAttributeTerms.deleteOne({ _id: term._id });

    return NextResponse.json({
      message: 'Term deleted successfully',
      deletedId: term._id.toString(),
    });
  } catch (error: any) {
    console.error('[Admin Term API] Error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to delete term',
        details: process.env.NODE_ENV === 'development'
          ? { stack: error.stack }
          : undefined,
      },
      { status: 500 }
    );
  }
}
