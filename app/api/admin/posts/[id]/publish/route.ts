/**
 * Admin Post Publish API Route
 * POST /api/admin/posts/[id]/publish - Publish post
 * 
 * Protected route - requires authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCollections, ObjectId } from '@/lib/db';

export const dynamic = 'force-dynamic';

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
    
    const { posts } = await getCollections();
    const { id } = params;
    
    // Find post
    let post = null;
    let postId: ObjectId | null = null;
    
    if (ObjectId.isValid(id)) {
      postId = new ObjectId(id);
      post = await posts.findOne({ _id: postId });
    }
    
    if (!post) {
      post = await posts.findOne({ slug: id });
      if (post) {
        postId = post._id;
      }
    }
    
    if (!post || !postId) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }
    
    // Update post to published
    await posts.updateOne(
      { _id: postId },
      { 
        $set: { 
          status: 'publish',
          publishedAt: post.publishedAt || new Date(),
          updatedAt: new Date(),
        } 
      }
    );
    
    // Fetch updated post
    const updatedPost = await posts.findOne({ _id: postId });
    
    if (!updatedPost) {
      return NextResponse.json(
        { error: 'Failed to publish post' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ post: updatedPost });
  } catch (error: any) {
    console.error('[Admin Post Publish API] Error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to publish post',
        details: process.env.NODE_ENV === 'development' 
          ? { stack: error.stack }
          : undefined,
      },
      { status: 500 }
    );
  }
}

