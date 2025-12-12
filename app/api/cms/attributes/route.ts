/**
 * Public CMS Attributes API Route
 * GET /api/cms/attributes - Get all global attributes (public)
 * GET /api/cms/attributes?attributeId=xxx - Get terms for a specific attribute
 * 
 * Public route - no authentication required
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCollections, ObjectId } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { productAttributes, productAttributeTerms } = await getCollections();
    const searchParams = request.nextUrl.searchParams;
    const attributeId = searchParams.get('attributeId');

    // If attributeId is provided, return terms for that attribute
    if (attributeId) {
      let attribute = null;
      
      // Try to find by ObjectId
      if (ObjectId.isValid(attributeId)) {
        attribute = await productAttributes.findOne({ _id: new ObjectId(attributeId) });
      }
      
      // If not found, try by slug
      if (!attribute) {
        attribute = await productAttributes.findOne({ slug: attributeId });
      }

      if (!attribute) {
        return NextResponse.json(
          { error: 'Attribute not found' },
          { status: 404 }
        );
      }

      // Fetch terms for this attribute
      const terms = await productAttributeTerms
        .find({ attributeId: attribute._id.toString() })
        .toArray();

      // Sort terms based on attribute's sortOrder
      let sortedTerms = [...terms];
      if (attribute.sortOrder === 'name') {
        sortedTerms.sort((a, b) => a.name.localeCompare(b.name));
      } else if (attribute.sortOrder === 'number') {
        sortedTerms.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
      }
      // 'id' sortOrder means keep original order (already sorted by MongoDB)

      return NextResponse.json({
        attribute: {
          id: attribute._id.toString(),
          name: attribute.name,
          slug: attribute.slug,
          type: attribute.type,
          sortOrder: attribute.sortOrder,
        },
        terms: sortedTerms.map((term) => ({
          id: term._id.toString(),
          name: term.name,
          slug: term.slug,
          description: term.description,
          colorHex: term.colorHex,
          colorHex2: term.colorHex2,
          imageUrl: term.imageUrl,
          imageId: term.imageId,
          sortOrder: term.sortOrder,
        })),
      });
    }

    // Otherwise, return all attributes
    const attributes = await productAttributes
      .find({})
      .sort({ name: 1 })
      .toArray();

    return NextResponse.json({
      attributes: attributes.map((attr) => ({
        id: attr._id.toString(),
        name: attr.name,
        slug: attr.slug,
        type: attr.type,
        sortOrder: attr.sortOrder,
      })),
    });
  } catch (error: any) {
    console.error('[CMS Attributes API] Error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to fetch attributes',
        details: process.env.NODE_ENV === 'development' 
          ? { stack: error.stack }
          : undefined,
      },
      { status: 500 }
    );
  }
}
