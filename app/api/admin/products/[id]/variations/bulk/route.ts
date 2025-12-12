/**
 * Admin Bulk Update Variations API Route
 * PUT /api/admin/products/[id]/variations/bulk - Bulk update variations
 * 
 * Protected route - requires authentication
 * 
 * Body:
 * {
 *   filter: {
 *     applyToAll?: boolean;
 *     attributeName?: string;
 *     attributeValue?: string;
 *   };
 *   updates: {
 *     regularPrice?: number;
 *     salePrice?: number;
 *     stockQuantity?: number;
 *     stockStatus?: 'instock' | 'outofstock';
 *     sku?: string;
 *   };
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCollections, ObjectId } from '@/lib/db';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const bulkUpdateSchema = z.object({
  filter: z.object({
    applyToAll: z.boolean().optional().default(false),
    attributeName: z.string().optional(),
    attributeValue: z.string().optional(),
  }),
  updates: z.object({
    regularPrice: z.number().optional(),
    salePrice: z.number().optional(),
    stockQuantity: z.number().optional(),
    stockStatus: z.enum(['instock', 'outofstock']).optional(),
    sku: z.string().optional(),
  }),
});

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

    const { products } = await getCollections();
    let { id } = params;
    const body = await request.json();

    // Extract ObjectId from GraphQL format if needed (backward compatibility)
    if (id.startsWith('gid://shop-gau-bong/Product/')) {
      id = id.replace('gid://shop-gau-bong/Product/', '');
    }

    // Validate input
    const validatedData = bulkUpdateSchema.parse(body);
    const { filter, updates } = validatedData;

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

    // Filter variations based on filter criteria
    const filteredVariations = currentVariations.filter((variation: any) => {
      if (filter.applyToAll) {
        return true;
      }

      if (filter.attributeName && filter.attributeValue) {
        const variationValue = variation.attributes?.[filter.attributeName];
        return variationValue === filter.attributeValue;
      }

      return false;
    });

    if (filteredVariations.length === 0) {
      return NextResponse.json(
        { 
          error: 'No variations match the filter criteria',
          matchedCount: 0,
        },
        { status: 400 }
      );
    }

    // Apply updates to filtered variations
    const updatedVariations = currentVariations.map((variation: any) => {
      // Check if this variation matches the filter
      const matchesFilter = filter.applyToAll
        ? true
        : filter.attributeName && filter.attributeValue
        ? variation.attributes?.[filter.attributeName] === filter.attributeValue
        : false;

      if (!matchesFilter) {
        return variation;
      }

      // Apply updates
      const updated = { ...variation };

      if (updates.regularPrice !== undefined) {
        updated.regularPrice = updates.regularPrice;
      }

      if (updates.salePrice !== undefined) {
        updated.salePrice = updates.salePrice;
      }

      if (updates.stockQuantity !== undefined) {
        updated.stockQuantity = updates.stockQuantity;
      }

      if (updates.stockStatus !== undefined) {
        // Update stockQuantity based on stockStatus if stockQuantity not explicitly set
        if (updates.stockQuantity === undefined) {
          updated.stockQuantity = updates.stockStatus === 'instock' ? 1 : 0;
        }
        // Note: stockStatus is not stored in variation, it's derived from stockQuantity
        // But we can store it if needed for future use
      }

      if (updates.sku !== undefined) {
        updated.sku = updates.sku;
      }

      return updated;
    });

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
      updatedCount: filteredVariations.length,
      totalVariations: currentVariations.length,
      message: `Updated ${filteredVariations.length} variation(s)`,
    });
  } catch (error: any) {
    console.error('[Admin Bulk Update Variations API] Error:', error);
    
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
        error: error.message || 'Failed to bulk update variations',
        details: process.env.NODE_ENV === 'development' 
          ? { stack: error.stack }
          : undefined,
      },
      { status: 500 }
    );
  }
}
