/**
 * Admin Product Reviews API Route
 * GET /api/admin/products/[id]/reviews - List reviews for a product
 * POST /api/admin/products/[id]/reviews - Create a review (admin)
 * 
 * Protected route - requires authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCollections, ObjectId } from '@/lib/db';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// Review schema
const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  title: z.string().optional(),
  content: z.string().min(1),
  authorName: z.string().min(1),
  authorEmail: z.string().email(),
  status: z.enum(['pending', 'approved', 'rejected']).default('pending'),
  photos: z.array(z.string()).optional(),
  helpfulCount: z.number().default(0),
});

export async function GET(
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
    
    const { productReviews } = await getCollections();
    const { id } = params;
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    
    // Build query
    const query: any = { productId: id };
    if (status) {
      query.status = status;
    }
    
    // Fetch reviews
    const skip = (page - 1) * limit;
    const reviews = await productReviews
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
    
    const total = await productReviews.countDocuments(query);
    
    return NextResponse.json({
      reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('[Admin Product Reviews API] Error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to fetch reviews',
        details: process.env.NODE_ENV === 'development' 
          ? { stack: error.stack }
          : undefined,
      },
      { status: 500 }
    );
  }
}

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
    
    const { productReviews, products } = await getCollections();
    const { id } = params;
    const body = await request.json();
    
    // Validate input
    const validatedData = reviewSchema.parse(body);
    
    // Verify product exists
    let product = null;
    if (ObjectId.isValid(id)) {
      product = await products.findOne({ _id: new ObjectId(id) });
    }
    if (!product) {
      product = await products.findOne({ slug: id });
    }
    
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    // Create review
    const reviewDoc = {
      productId: product._id.toString(),
      ...validatedData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const result = await productReviews.insertOne(reviewDoc);
    
    // Fetch created review
    const createdReview = await productReviews.findOne({ _id: result.insertedId });
    
    if (!createdReview) {
      return NextResponse.json(
        { error: 'Failed to create review' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { review: createdReview },
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
    
    console.error('[Admin Product Reviews API] Error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to create review',
        details: process.env.NODE_ENV === 'development' 
          ? { stack: error.stack }
          : undefined,
      },
      { status: 500 }
    );
  }
}

