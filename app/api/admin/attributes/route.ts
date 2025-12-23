/**
 * Admin Attributes API Route
 * GET /api/admin/attributes - List attributes
 * POST /api/admin/attributes - Create new attribute
 * 
 * Protected route - requires authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCollections, ObjectId } from '@/lib/db';
import { generateSlug } from '@/lib/utils/slug';
import { z } from 'zod';
import { withAuthAdmin, AuthenticatedRequest } from '@/lib/middleware/authMiddleware';

export const dynamic = 'force-dynamic';

// Attribute schema for validation
const attributeSchema = z.object({
  name: z.string().min(1, 'Tên thuộc tính không được để trống'),
  slug: z.string().min(1).optional(),
  type: z.enum(['text', 'color', 'image', 'button']).default('text'),
  sortOrder: z.enum(['name', 'number', 'id']).default('name'),
});

/**
 * GET /api/admin/attributes
 * List all attributes
 */
export async function GET(request: NextRequest) {
  return withAuthAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      const { productAttributes, productAttributeTerms } = await getCollections();
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const perPage = parseInt(searchParams.get('per_page') || '20', 10);
    const search = searchParams.get('search');

    // Build query with proper typing
    interface AttributeQuery {
      $or?: Array<{
        name?: { $regex: string; $options: string };
        slug?: { $regex: string; $options: string };
      }>;
    }

    const query: AttributeQuery = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } },
      ];
    }

    // Fetch attributes with pagination
    const [attributesList, total] = await Promise.all([
      productAttributes
        .find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * perPage)
        .limit(perPage)
        .toArray(),
      productAttributes.countDocuments(query),
    ]);

    // Get terms count for each attribute
    const attributesWithCounts = await Promise.all(
      attributesList.map(async (attr) => {
        const termsCount = await productAttributeTerms.countDocuments({
          attributeId: attr._id.toString(),
        });
        return {
          ...attr,
          id: attr._id.toString(),
          termsCount,
        };
      })
    );

    const totalPages = Math.ceil(total / perPage);

    return NextResponse.json({
      attributes: attributesWithCounts,
      pagination: {
        total,
        totalPages,
        currentPage: page,
        perPage,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error: any) {
    console.error('[Admin Attributes API] Error:', error);
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
  });
}

/**
 * POST /api/admin/attributes
 * Create new attribute
 */
export async function POST(request: NextRequest) {
  return withAuthAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      const { productAttributes } = await getCollections();
      const body = await req.json();

      // Validate input
      const validatedData = attributeSchema.parse(body);

      // Auto-generate slug if not provided
      let slug = validatedData.slug || generateSlug(validatedData.name);

      // Check if slug already exists
      const existingAttribute = await productAttributes.findOne({ slug });
      if (existingAttribute) {
        // Append number to make it unique
        let counter = 1;
        let uniqueSlug = `${slug}-${counter}`;
        while (await productAttributes.findOne({ slug: uniqueSlug })) {
          counter++;
          uniqueSlug = `${slug}-${counter}`;
        }
        slug = uniqueSlug;
      }

      // Create attribute document
      const attributeDoc = {
        ...validatedData,
        slug,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await productAttributes.insertOne(attributeDoc);

      // Fetch created attribute
      const createdAttribute = await productAttributes.findOne({
        _id: result.insertedId,
      });

      if (!createdAttribute) {
        return NextResponse.json(
          { error: 'Failed to create attribute' },
          { status: 500 }
        );
      }

      return NextResponse.json(
        {
          attribute: {
            ...createdAttribute,
            id: createdAttribute._id.toString(),
          },
        },
        { status: 201 }
      );
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

      console.error('[Admin Attributes API] Error:', error);
      return NextResponse.json(
        {
          error: error.message || 'Failed to create attribute',
          details: process.env.NODE_ENV === 'development'
            ? { stack: error.stack }
            : undefined,
        },
        { status: 500 }
      );
    }
  }, 'product:update'); // Require product:update permission
}
