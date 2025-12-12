/**
 * Admin Map Images to Variations API Route
 * POST /api/admin/products/[id]/variations/map-images - Map images by attribute
 * 
 * Protected route - requires authentication
 * 
 * Body:
 * {
 *   mappings: [
 *     {
 *       attributeName: string;
 *       attributeValue: string;
 *       imageId: string;
 *       imageUrl: string;
 *     }
 *   ]
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCollections, ObjectId } from '@/lib/db';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const mapImagesSchema = z.object({
  mappings: z.array(
    z.object({
      attributeName: z.string().min(1, 'Attribute name is required'),
      attributeValue: z.string().min(1, 'Attribute value is required'),
      imageId: z.string().min(1, 'Image ID is required'),
      imageUrl: z.string().url('Invalid image URL'),
    })
  ).min(1, 'At least one mapping is required'),
});

export async function POST(
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

    const { products } = await getCollections();
    let { id } = params;
    const body = await request.json();

    // Extract ObjectId from GraphQL format if needed (backward compatibility)
    if (id.startsWith('gid://shop-gau-bong/Product/')) {
      id = id.replace('gid://shop-gau-bong/Product/', '');
    }

    // Validate input
    const validatedData = mapImagesSchema.parse(body);
    const { mappings } = validatedData;

    // Find product
    let product = null;
    let productId: ObjectId | null = null;

    if (ObjectId.isValid(id)) {
      productId = new ObjectId(id);
      product = await products.findOne({ _id: productId });
    }

    if (!product) {
      product = await products.findOne({ slug: id });
      if (product) {
        productId = product._id;
      }
    }

    if (!product || !productId) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Get current variations
    const currentVariations = product.productDataMetaBox?.variations || [];
    if (currentVariations.length === 0) {
      return NextResponse.json(
        { error: 'Product has no variations' },
        { status: 400 }
      );
    }

    // Create a map for quick lookup: attributeName:attributeValue -> imageUrl
    const imageMap = new Map<string, string>();
    mappings.forEach((mapping) => {
      const key = `${mapping.attributeName}:${mapping.attributeValue}`;
      imageMap.set(key, mapping.imageUrl);
    });

    // Track which variations were updated
    const updatedVariations = currentVariations.map((variation: any) => {
      // Check if this variation matches any mapping
      let matchedImageUrl: string | null = null;

      for (const mapping of mappings) {
        const variationValue = variation.attributes?.[mapping.attributeName];
        if (variationValue === mapping.attributeValue) {
          matchedImageUrl = mapping.imageUrl;
          break; // Use first match
        }
      }

      if (matchedImageUrl) {
        return {
          ...variation,
          image: matchedImageUrl,
        };
      }

      return variation;
    });

    // Count how many variations were actually updated
    const updatedCount = updatedVariations.filter((variation: any, index: number) => {
      const original = currentVariations[index];
      return original.image !== variation.image;
    }).length;

    // Update product with new variations
    const updateResult = await products.updateOne(
      { _id: productId },
      {
        $set: {
          'productDataMetaBox.variations': updatedVariations,
          updatedAt: new Date(),
        },
      }
    );

    if (updateResult.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      updatedCount,
      totalVariations: currentVariations.length,
      mappingsApplied: mappings.length,
      message: `Mapped images to ${updatedCount} variation(s)`,
    });
  } catch (error: any) {
    console.error('[Admin Map Images to Variations API] Error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation error',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: error.message || 'Failed to map images to variations',
        details: process.env.NODE_ENV === 'development' 
          ? { stack: error.stack }
          : undefined,
      },
      { status: 500 }
    );
  }
}
