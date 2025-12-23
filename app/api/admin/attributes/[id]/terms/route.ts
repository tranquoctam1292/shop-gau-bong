/**
 * Admin Attribute Terms API Route
 * GET /api/admin/attributes/[id]/terms - List terms for attribute
 * POST /api/admin/attributes/[id]/terms - Create new term
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
 * GET /api/admin/attributes/[id]/terms
 * List all terms for an attribute
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuthAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      const { productAttributes, productAttributeTerms } = await getCollections();
      const { id } = params;
      const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const perPage = parseInt(searchParams.get('per_page') || '50', 10);
    const search = searchParams.get('search');

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

    // Build query with proper typing
    interface TermQuery {
      attributeId: string;
      $or?: Array<{
        name?: { $regex: string; $options: string };
        slug?: { $regex: string; $options: string };
      }>;
    }

    const query: TermQuery = { attributeId };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } },
      ];
    }

    // Determine sort order based on attribute.sortOrder
    type SortOptions = { [key: string]: 1 | -1 };
    let sortOptions: SortOptions = { sortOrder: 1, createdAt: 1 };
    if (attribute.sortOrder === 'name') {
      sortOptions = { name: 1 };
    } else if (attribute.sortOrder === 'number') {
      sortOptions = { sortOrder: 1, name: 1 };
    } else {
      // 'id' - sort by creation order
      sortOptions = { createdAt: 1 };
    }

    // Fetch terms with pagination
    const [termsList, total] = await Promise.all([
      productAttributeTerms
        .find(query)
        .sort(sortOptions)
        .skip((page - 1) * perPage)
        .limit(perPage)
        .toArray(),
      productAttributeTerms.countDocuments(query),
    ]);

    const mappedTerms = termsList.map((term) => ({
      ...term,
      id: term._id.toString(),
    }));

    const totalPages = Math.ceil(total / perPage);

    return NextResponse.json({
      terms: mappedTerms,
      attribute: {
        ...attribute,
        id: attribute._id.toString(),
      },
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
    console.error('[Admin Terms API] Error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to fetch terms',
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
 * POST /api/admin/attributes/[id]/terms
 * Create new term for attribute
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuthAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      const { productAttributes, productAttributeTerms } = await getCollections();
      const { id } = params;
      const body = await req.json();

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
    const attributeType = attribute.type;

    // Dynamic schema based on attribute type
    const baseSchema = z.object({
      name: z.string().min(1, 'Tên giá trị không được để trống'),
      slug: z.string().min(1).optional(),
      description: z.string().optional(),
      sortOrder: z.number().optional(),
    });

    let termSchema = baseSchema;

    // Add type-specific fields
    if (attributeType === 'color') {
      termSchema = baseSchema.extend({
        colorHex: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Mã màu không hợp lệ').optional(),
        colorHex2: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Mã màu không hợp lệ').optional(), // For gradient
      });
    } else if (attributeType === 'image' || attributeType === 'button') {
      termSchema = baseSchema.extend({
        imageUrl: z.string().url().optional(),
        imageId: z.string().optional(), // Media library ID
      });
    }

    // Validate input
    const validatedData = termSchema.parse(body) as {
      name: string;
      slug?: string;
      description?: string;
      sortOrder?: number;
      colorHex?: string;
      colorHex2?: string;
      imageUrl?: string;
      imageId?: string;
    };

    // Auto-generate slug if not provided
    let slug = validatedData.slug || generateSlug(validatedData.name);

    // Check if slug already exists for this attribute
    const existingTerm = await productAttributeTerms.findOne({
      attributeId,
      slug,
    });
    if (existingTerm) {
      // Append number to make it unique
      let counter = 1;
      let uniqueSlug = `${slug}-${counter}`;
      while (
        await productAttributeTerms.findOne({
          attributeId,
          slug: uniqueSlug,
        })
      ) {
        counter++;
        uniqueSlug = `${slug}-${counter}`;
      }
      slug = uniqueSlug;
    }

    // Get max sortOrder for this attribute
    const maxSortOrder = await productAttributeTerms
      .find({ attributeId })
      .sort({ sortOrder: -1 })
      .limit(1)
      .toArray();
    const nextSortOrder =
      (maxSortOrder[0]?.sortOrder || 0) + 1;

    // Create term document with proper typing
    interface TermDocument {
      attributeId: string;
      name: string;
      slug: string;
      description?: string;
      sortOrder: number;
      createdAt: Date;
      updatedAt: Date;
      colorHex?: string;
      colorHex2?: string;
      imageUrl?: string;
      imageId?: string;
    }

    const termDoc: TermDocument = {
      attributeId,
      name: validatedData.name,
      slug,
      description: validatedData.description,
      sortOrder: validatedData.sortOrder || nextSortOrder,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Add type-specific fields
    if (attributeType === 'color') {
      if (validatedData.colorHex) termDoc.colorHex = validatedData.colorHex;
      if (validatedData.colorHex2) termDoc.colorHex2 = validatedData.colorHex2;
    } else if (attributeType === 'image' || attributeType === 'button') {
      if (validatedData.imageUrl) termDoc.imageUrl = validatedData.imageUrl;
      if (validatedData.imageId) termDoc.imageId = validatedData.imageId;
    }

    const result = await productAttributeTerms.insertOne(termDoc);

    // Fetch created term
    const createdTerm = await productAttributeTerms.findOne({
      _id: result.insertedId,
    });

    if (!createdTerm) {
      return NextResponse.json(
        { error: 'Failed to create term' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        term: {
          ...createdTerm,
          id: createdTerm._id.toString(),
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

    console.error('[Admin Terms API] Error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to create term',
        details: process.env.NODE_ENV === 'development'
          ? { stack: error.stack }
          : undefined,
      },
      { status: 500 }
    );
    }
  }, 'product:update');
}
