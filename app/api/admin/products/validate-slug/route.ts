/**
 * Validate Slug API Route
 * GET /api/admin/products/validate-slug?slug=xxx&excludeId=yyy
 * 
 * Check if a slug already exists in the database
 * Protected route - requires authentication via withAuthAdmin middleware
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCollections, ObjectId } from '@/lib/db';
import { withAuthAdmin, AuthenticatedRequest } from '@/lib/middleware/authMiddleware';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return withAuthAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      const searchParams = request.nextUrl.searchParams;
      const slug = searchParams.get('slug');
      const excludeId = searchParams.get('excludeId');

      if (!slug) {
        return NextResponse.json({ exists: false });
      }

      const { products } = await getCollections();

      // Build query
      const query: any = { slug };
      if (excludeId) {
        // Exclude current product when editing
        try {
          if (ObjectId.isValid(excludeId)) {
            query._id = { $ne: new ObjectId(excludeId) };
          } else {
            // If excludeId is a slug, exclude by slug
            query.slug = { $ne: excludeId };
          }
        } catch {
          // Invalid ObjectId, ignore
        }
      }

      const existingProduct = await products.findOne(query);

      return NextResponse.json({ exists: !!existingProduct });
    } catch (error: any) {
      console.error('[Validate Slug API] Error:', error);
      return NextResponse.json(
        {
          error: error.message || 'Failed to validate slug',
          exists: false, // Default to false on error
        },
        { status: 500 }
      );
    }
  });
}
