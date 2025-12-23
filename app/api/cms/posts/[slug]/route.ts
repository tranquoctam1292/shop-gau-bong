/**
 * Public Single Post API Route
 * GET /api/cms/posts/[slug] - Get single published post
 * 
 * Public route - no authentication required
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCollections, ObjectId } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { posts } = await getCollections();
    const { slug } = params;
    
    // Find published post by slug
    const post = await posts.findOne({ 
      slug,
      status: 'publish',
    });
    
    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ post });
  } catch (error: any) {
    console.error('[CMS Post API] Error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to fetch post',
        details: process.env.NODE_ENV === 'development' 
          ? { stack: error.stack }
          : undefined,
      },
      { status: 500 }
    );
  }
}

