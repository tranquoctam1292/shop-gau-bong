/**
 * Admin Single Product Review API Route
 * GET /api/admin/products/[id]/reviews/[reviewId] - Get review
 * PUT /api/admin/products/[id]/reviews/[reviewId] - Update review
 * DELETE /api/admin/products/[id]/reviews/[reviewId] - Delete review
 * 
 * Protected route - requires authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCollections, ObjectId } from '@/lib/db';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// Review update schema
const reviewUpdateSchema = z.object({
  rating: z.number().min(1).max(5).optional(),
  title: z.string().optional(),
  content: z.string().optional(),
  authorName: z.string().optional(),
  authorEmail: z.string().email().optional(),
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
  photos: z.array(z.string()).optional(),
  helpfulCount: z.number().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; reviewId: string } }
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
    const { reviewId } = params;
    
    if (!ObjectId.isValid(reviewId)) {
      return NextResponse.json(
        { error: 'Invalid review ID' },
        { status: 400 }
      );
    }
    
    const review = await productReviews.findOne({ _id: new ObjectId(reviewId) });
    
    if (!review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ review });
  } catch (error: any) {
    console.error('[Admin Product Review API] Error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to fetch review',
        details: process.env.NODE_ENV === 'development' 
          ? { stack: error.stack }
          : undefined,
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; reviewId: string } }
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
    const { reviewId } = params;
    const body = await request.json();
    
    // Validate input
    const validatedData = reviewUpdateSchema.parse(body);
    
    if (!ObjectId.isValid(reviewId)) {
      return NextResponse.json(
        { error: 'Invalid review ID' },
        { status: 400 }
      );
    }
    
    const reviewIdObj = new ObjectId(reviewId);
    const review = await productReviews.findOne({ _id: reviewIdObj });
    
    if (!review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }
    
    // Update review
    const updateData: any = {
      ...validatedData,
      updatedAt: new Date(),
    };
    
    await productReviews.updateOne(
      { _id: reviewIdObj },
      { $set: updateData }
    );
    
    // Fetch updated review
    const updatedReview = await productReviews.findOne({ _id: reviewIdObj });
    
    if (!updatedReview) {
      return NextResponse.json(
        { error: 'Failed to update review' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ review: updatedReview });
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
    
    console.error('[Admin Product Review API] Error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to update review',
        details: process.env.NODE_ENV === 'development' 
          ? { stack: error.stack }
          : undefined,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; reviewId: string } }
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
    const { reviewId } = params;
    
    if (!ObjectId.isValid(reviewId)) {
      return NextResponse.json(
        { error: 'Invalid review ID' },
        { status: 400 }
      );
    }
    
    const reviewIdObj = new ObjectId(reviewId);
    const review = await productReviews.findOne({ _id: reviewIdObj });
    
    if (!review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }
    
    // Delete review
    await productReviews.deleteOne({ _id: reviewIdObj });
    
    return NextResponse.json(
      { message: 'Review deleted successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[Admin Product Review API] Error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to delete review',
        details: process.env.NODE_ENV === 'development' 
          ? { stack: error.stack }
          : undefined,
      },
      { status: 500 }
    );
  }
}

