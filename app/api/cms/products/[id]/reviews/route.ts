/**
 * Public Product Reviews API Route
 * GET /api/cms/products/[id]/reviews - Get approved reviews for a product
 * POST /api/cms/products/[id]/reviews - Submit a review
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCollections, ObjectId } from '@/lib/db';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// Review submission schema
const reviewSubmissionSchema = z.object({
  rating: z.number().min(1).max(5),
  title: z.string().optional(),
  content: z.string().min(1),
  authorName: z.string().min(1),
  authorEmail: z.string().email(),
  photos: z.array(z.string()).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { productReviews, products } = await getCollections();
    const { id } = params;
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    
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
    
    const productId = product._id.toString();
    
    // Fetch only approved reviews
    const query = {
      productId,
      status: 'approved',
    };
    
    const skip = (page - 1) * limit;
    const reviews = await productReviews
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
    
    const total = await productReviews.countDocuments(query);
    
    // Calculate average rating
    const allApprovedReviews = await productReviews
      .find(query)
      .toArray();
    
    const avgRating =
      allApprovedReviews.length > 0
        ? allApprovedReviews.reduce((sum, review: any) => sum + (review.rating || 0), 0) /
          allApprovedReviews.length
        : 0;
    
    return NextResponse.json({
      reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      averageRating: parseFloat(avgRating.toFixed(2)),
      totalReviews: allApprovedReviews.length,
    });
  } catch (error: any) {
    console.error('[Public Product Reviews API] Error:', error);
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
    const { productReviews, products } = await getCollections();
    const { id } = params;
    const body = await request.json();
    
    // Validate input
    const validatedData = reviewSubmissionSchema.parse(body);
    
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
    
    // Create review with pending status
    const reviewDoc = {
      productId: product._id.toString(),
      ...validatedData,
      status: 'pending', // Requires moderation
      helpfulCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const result = await productReviews.insertOne(reviewDoc);
    
    // Fetch created review
    const createdReview = await productReviews.findOne({ _id: result.insertedId });
    
    if (!createdReview) {
      return NextResponse.json(
        { error: 'Failed to submit review' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { 
        review: createdReview,
        message: 'Review submitted successfully. It will be published after moderation.',
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
    
    console.error('[Public Product Reviews API] Error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to submit review',
        details: process.env.NODE_ENV === 'development' 
          ? { stack: error.stack }
          : undefined,
      },
      { status: 500 }
    );
  }
}

