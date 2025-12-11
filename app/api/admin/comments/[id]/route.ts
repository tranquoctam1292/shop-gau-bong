/**
 * Admin Single Comment API Route
 * GET /api/admin/comments/[id] - Get single comment
 * PUT /api/admin/comments/[id] - Update comment (approve, reject, mark spam, delete)
 * DELETE /api/admin/comments/[id] - Delete comment
 * 
 * Protected route - requires authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCollections, ObjectId } from '@/lib/db';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// Comment update schema
const commentUpdateSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected', 'spam']).optional(),
  content: z.string().optional(),
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
    
    const { comments } = await getCollections();
    const { id } = params;
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid comment ID' },
        { status: 400 }
      );
    }
    
    const comment = await comments.findOne({ _id: new ObjectId(id) });
    
    if (!comment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ comment });
  } catch (error: any) {
    console.error('[Admin Comment API] Error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to fetch comment',
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
    
    const { comments } = await getCollections();
    const { id } = params;
    const body = await request.json();
    
    // Validate input
    const validatedData = commentUpdateSchema.parse(body);
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid comment ID' },
        { status: 400 }
      );
    }
    
    const commentId = new ObjectId(id);
    const comment = await comments.findOne({ _id: commentId });
    
    if (!comment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }
    
    // Update comment
    const updateData: any = {
      ...validatedData,
      updatedAt: new Date(),
    };
    
    await comments.updateOne(
      { _id: commentId },
      { $set: updateData }
    );
    
    // Fetch updated comment
    const updatedComment = await comments.findOne({ _id: commentId });
    
    if (!updatedComment) {
      return NextResponse.json(
        { error: 'Failed to update comment' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ comment: updatedComment });
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
    
    console.error('[Admin Comment API] Error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to update comment',
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
    
    const { comments } = await getCollections();
    const { id } = params;
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid comment ID' },
        { status: 400 }
      );
    }
    
    const commentId = new ObjectId(id);
    const comment = await comments.findOne({ _id: commentId });
    
    if (!comment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }
    
    // Delete comment
    await comments.deleteOne({ _id: commentId });
    
    return NextResponse.json(
      { message: 'Comment deleted successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[Admin Comment API] Error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to delete comment',
        details: process.env.NODE_ENV === 'development' 
          ? { stack: error.stack }
          : undefined,
      },
      { status: 500 }
    );
  }
}

