/**
 * Admin Comments API Route
 * GET /api/admin/comments - List comments (with filters)
 * 
 * Protected route - requires authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCollections, ObjectId } from '@/lib/db';
import { withAuthAdmin, AuthenticatedRequest } from '@/lib/middleware/authMiddleware';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return withAuthAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      // Permission: blog:read (checked by middleware)
      const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const perPage = parseInt(searchParams.get('per_page') || '20', 10);
    const status = searchParams.get('status'); // pending, approved, rejected, spam
    const postId = searchParams.get('post');
    
    const { comments } = await getCollections();
    
    // Build query
    const query: any = {};
    
    if (status) {
      query.status = status;
    }
    
    if (postId) {
      query.postId = postId;
    }
    
    // Fetch comments
    const [commentsList, total] = await Promise.all([
      comments
        .find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * perPage)
        .limit(perPage)
        .toArray(),
      comments.countDocuments(query),
    ]);
    
    const totalPages = Math.ceil(total / perPage);
    
    return NextResponse.json({
      comments: commentsList,
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
    console.error('[Admin Comments API] Error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to fetch comments',
        details: process.env.NODE_ENV === 'development' 
          ? { stack: error.stack }
          : undefined,
      },
      { status: 500 }
    );
    }
  }, 'blog:read');
}

