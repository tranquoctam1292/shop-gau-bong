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
import { withAuthAdmin, AuthenticatedRequest } from '@/lib/middleware/authMiddleware';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/attributes/[id]/terms/[termId]
 * Get single term
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; termId: string } }
) {
  return withAuthAdmin(request, async (req: AuthenticatedRequest) => {
    try {
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
  });
}

/**
 * PUT /api/admin/attributes/[id]/terms/[termId]
 * Update term
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; termId: string } }
) {
  return withAuthAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      const { productAttributes, productAttributeTerms } = await getCollections();
      const { id, termId } = params;
      const body = await req.json();

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
    const validatedData = termSchema.parse(body) as {
      name?: string;
      slug?: string;
      description?: string;
      sortOrder?: number;
      colorHex?: string;
      colorHex2?: string;
      imageUrl?: string;
      imageId?: string;
    };

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
    
    // BUSINESS LOGIC FIX: Attribute Sync - Cập nhật tất cả products khi đổi tên attribute term
    // Nếu tên term thay đổi, cần sync lại trong tất cả products đang sử dụng term này
    if (validatedData.name && validatedData.name !== term.name) {
      const { products } = await getCollections();
      const oldTermName = term.name;
      const newTermName = validatedData.name;
      const attributeName = attribute.name;
      
      // Tìm tất cả products có sử dụng term này
      const productsToUpdate = await products.find({
        $or: [
          // Check trong productDataMetaBox.attributes.values
          {
            'productDataMetaBox.attributes': {
              $elemMatch: {
                name: attributeName,
                values: oldTermName,
              },
            },
          },
          // Check trong productDataMetaBox.variations.attributes
          {
            'productDataMetaBox.variations.attributes': {
              $exists: true,
            },
            [`productDataMetaBox.variations.attributes.${attributeName}`]: oldTermName,
          },
          // Check trong variants array (converted format)
          {
            $or: [
              { 'variants.size': oldTermName },
              { 'variants.color': oldTermName },
            ],
          },
        ],
      }).toArray();
      
      if (productsToUpdate.length > 0) {
        // Sử dụng bulkWrite để update hiệu quả
        const bulkOps: any[] = [];
        
        for (const product of productsToUpdate) {
          const updateOps: any = {};
          let hasChanges = false;
          
          // Update productDataMetaBox.attributes.values
          if (product.productDataMetaBox?.attributes) {
            const updatedAttributes = product.productDataMetaBox.attributes.map((attr: any) => {
              if (attr.name === attributeName && attr.values && Array.isArray(attr.values)) {
                const updatedValues = attr.values.map((val: string) => 
                  val === oldTermName ? newTermName : val
                );
                if (JSON.stringify(updatedValues) !== JSON.stringify(attr.values)) {
                  hasChanges = true;
                  return { ...attr, values: updatedValues };
                }
              }
              return attr;
            });
            
            if (hasChanges) {
              updateOps['productDataMetaBox.attributes'] = updatedAttributes;
            }
          }
          
          // Update productDataMetaBox.variations.attributes
          if (product.productDataMetaBox?.variations) {
            let variationsChanged = false;
            const updatedVariations = product.productDataMetaBox.variations.map((variation: any) => {
              if (variation.attributes && variation.attributes[attributeName] === oldTermName) {
                variationsChanged = true;
                hasChanges = true;
                return {
                  ...variation,
                  attributes: {
                    ...variation.attributes,
                    [attributeName]: newTermName,
                  },
                };
              }
              return variation;
            });
            
            if (variationsChanged) {
              updateOps['productDataMetaBox.variations'] = updatedVariations;
            }
          }
          
          // Update variants array (converted format)
          const isSizeAttribute = attributeName.toLowerCase().includes('size') || 
                                 attributeName.toLowerCase() === 'pa_size' ||
                                 attributeName.toLowerCase().includes('kích thước');
          const isColorAttribute = attributeName.toLowerCase().includes('color') || 
                                  attributeName.toLowerCase() === 'pa_color' ||
                                  attributeName.toLowerCase().includes('màu');
          
          if (product.variants && Array.isArray(product.variants)) {
            let variantsChanged = false;
            const updatedVariants = product.variants.map((variant: any) => {
              if (isSizeAttribute && variant.size === oldTermName) {
                variantsChanged = true;
                hasChanges = true;
                return { ...variant, size: newTermName };
              } else if (isColorAttribute && variant.color === oldTermName) {
                variantsChanged = true;
                hasChanges = true;
                return { ...variant, color: newTermName };
              }
              return variant;
            });
            
            if (variantsChanged) {
              updateOps.variants = updatedVariants;
            }
          }
          
          // Thêm vào bulk operations nếu có thay đổi
          if (hasChanges && Object.keys(updateOps).length > 0) {
            bulkOps.push({
              updateOne: {
                filter: { _id: product._id },
                update: {
                  $set: {
                    ...updateOps,
                    updatedAt: new Date(),
                  },
                },
              },
            });
          }
        }
        
        // Execute bulk update nếu có operations
        if (bulkOps.length > 0) {
          await products.bulkWrite(bulkOps);
        }
      }
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
  }, 'product:update');
}

/**
 * DELETE /api/admin/attributes/[id]/terms/[termId]
 * Delete term
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; termId: string } }
) {
  return withAuthAdmin(request, async (req: AuthenticatedRequest) => {
    try {
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
  }, 'product:update');
}
