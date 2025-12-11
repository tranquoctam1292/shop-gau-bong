/**
 * Public Posts API Route
 * GET /api/cms/posts - List published posts
 * 
 * Public route - no authentication required
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCollections, ObjectId } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const perPage = parseInt(searchParams.get('per_page') || '10', 10);
    const categoryId = searchParams.get('category');
    const tagId = searchParams.get('tag');
    const authorId = searchParams.get('author');
    const search = searchParams.get('search');
    
    const { posts } = await getCollections();
    
    // Build query - only published posts
    const query: any = {
      status: 'publish',
    };
    
    if (categoryId) {
      query.categoryId = categoryId;
    }
    
    if (tagId) {
      query.tagIds = tagId;
    }
    
    if (authorId) {
      query.authorId = authorId;
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { excerpt: { $regex: search, $options: 'i' } },
      ];
    }
    
    // Fetch posts
    const [postsList, total] = await Promise.all([
      posts
        .find(query)
        .sort({ publishedAt: -1 })
        .skip((page - 1) * perPage)
        .limit(perPage)
        .toArray(),
      posts.countDocuments(query),
    ]);
    
    const totalPages = Math.ceil(total / perPage);
    
    return NextResponse.json({
      posts: postsList,
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
    console.error('[CMS Posts API] Error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to fetch posts',
        details: process.env.NODE_ENV === 'development' 
          ? { stack: error.stack }
          : undefined,
      },
      { status: 500 }
    );
  }
}

