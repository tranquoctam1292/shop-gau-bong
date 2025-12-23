/**
 * Public Product Review Helpful API Route
 * POST /api/cms/products/[id]/reviews/[reviewId]/helpful - Mark review as helpful
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCollections, ObjectId } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; reviewId: string } }
) {
  try {
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
    
    // Increment helpful count
    await productReviews.updateOne(
      { _id: reviewIdObj },
      {
        $inc: { helpfulCount: 1 },
        $set: { updatedAt: new Date() },
      }
    );
    
    // Fetch updated review
    const updatedReview = await productReviews.findOne({ _id: reviewIdObj });
    
    return NextResponse.json({
      review: updatedReview,
      message: 'Review marked as helpful',
    });
  } catch (error: any) {
    console.error('[Public Product Review Helpful API] Error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to mark review as helpful',
        details: process.env.NODE_ENV === 'development' 
          ? { stack: error.stack }
          : undefined,
      },
      { status: 500 }
    );
  }
}

