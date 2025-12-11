/**
 * Admin Post Duplicate API Route
 * POST /api/admin/posts/[id]/duplicate - Duplicate post
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
    
    if (ObjectId.isValid(id)) {
      post = await posts.findOne({ _id: new ObjectId(id) });
    }
    
    if (!post) {
      post = await posts.findOne({ slug: id });
    }
    
    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }
    
    // Create duplicate
    const duplicatePost = {
      ...post,
      _id: undefined, // Remove _id to create new document
      title: `${post.title} (Copy)`,
      slug: `${post.slug}-copy-${Date.now()}`,
      status: 'draft',
      publishedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    delete (duplicatePost as any)._id;
    
    const result = await posts.insertOne(duplicatePost);
    
    // Fetch created post
    const createdPost = await posts.findOne({ _id: result.insertedId });
    
    if (!createdPost) {
      return NextResponse.json(
        { error: 'Failed to duplicate post' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { post: createdPost },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[Admin Post Duplicate API] Error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to duplicate post',
        details: process.env.NODE_ENV === 'development' 
          ? { stack: error.stack }
          : undefined,
      },
      { status: 500 }
    );
  }
}

