/**
 * Product Variations API Route
 * GET /api/cms/products/[id]/variations
 * 
 * Fetch product variations from MongoDB
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCollections, ObjectId } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { products } = await getCollections();
    let { id } = params;
    
    // FIX: Handle scientific notation (e.g., "3.257312785587351e+28")
    // This happens when databaseId was converted from ObjectId to number
    // Try to convert back to ObjectId hex string if it's scientific notation
    if (id.includes('e+') || id.includes('e-') || id.includes('E+') || id.includes('E-')) {
      try {
        // Parse scientific notation to number
        const numId = parseFloat(id);
        // Convert back to hex string (ObjectId format)
        // ObjectId is 24 hex characters, so we need to pad with zeros
        const hexId = Math.floor(numId).toString(16).padStart(24, '0');
        if (ObjectId.isValid(hexId)) {
          id = hexId;
        }
      } catch (e) {
        // If conversion fails, continue with original id
      }
    }
    
    // Decode URL-encoded ID
    id = decodeURIComponent(id);
    
    // Find product by ID or slug
    let product = null;
    
    if (ObjectId.isValid(id)) {
      product = await products.findOne({
        _id: new ObjectId(id),
      });
    }
    
    if (!product) {
      product = await products.findOne({
        slug: id,
      });
    }
    
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    // Return variations (nested in product document)
    const variations = product.variants || [];
    
    return NextResponse.json({ variations });
  } catch (error: any) {
    console.error('[Variations API] Error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to fetch variations',
        details: process.env.NODE_ENV === 'development' 
          ? { stack: error.stack }
          : undefined,
      },
      { status: 500 }
    );
  }
}

