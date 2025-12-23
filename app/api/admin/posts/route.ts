/**
 * Admin Posts API Route
 * GET /api/admin/posts - List posts (with filters)
 * POST /api/admin/posts - Create new post
 * 
 * Protected route - requires authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCollections, ObjectId } from '@/lib/db';
import { z } from 'zod';
import { handleValidationError } from '@/lib/utils/validation-errors';
import { withAuthAdmin, AuthenticatedRequest } from '@/lib/middleware/authMiddleware';

export const dynamic = 'force-dynamic';

// Post schema for validation
const postSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  content: z.string().optional(),
  excerpt: z.string().optional(),
  featuredImage: z.string().optional(),
  authorId: z.string().optional(),
  categoryId: z.string().optional(),
  tagIds: z.array(z.string()).default([]),
  status: z.enum(['draft', 'publish']).default('draft'),
  publishedAt: z.string().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  seoKeywords: z.string().optional(),
});

export async function GET(request: NextRequest) {
  return withAuthAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      // Permission: blog:read (checked by middleware)
      const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const perPage = parseInt(searchParams.get('per_page') || '10', 10);
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const categoryId = searchParams.get('category');
    const authorId = searchParams.get('author');
    
    const { posts } = await getCollections();
    
    // Build query
    const query: any = {};
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { excerpt: { $regex: search, $options: 'i' } },
      ];
    }
    
    if (status) {
      query.status = status;
    }
    
    if (categoryId) {
      query.categoryId = categoryId;
    }
    
    if (authorId) {
      query.authorId = authorId;
    }
    
    // Fetch posts
    const [postsList, total] = await Promise.all([
      posts
        .find(query)
        .sort({ createdAt: -1 })
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
    console.error('[Admin Posts API] Error:', error);
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
  }, 'blog:read');
}

export async function POST(request: NextRequest) {
  return withAuthAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      // Permission: blog:manage (checked by middleware)
      const body = await req.json();
    
    // Validate input
    const validatedData = postSchema.parse(body);
    
    const { posts } = await getCollections();
    
    // Check if slug already exists
    const existingPost = await posts.findOne({ slug: validatedData.slug });
    if (existingPost) {
      return NextResponse.json(
        { error: 'Post with this slug already exists' },
        { status: 409 }
      );
    }
    
    // Set publishedAt if status is publish
    const publishedAt = validatedData.status === 'publish' 
      ? (validatedData.publishedAt ? new Date(validatedData.publishedAt) : new Date())
      : null;
    
    // Create post document
    const postDoc = {
      ...validatedData,
      publishedAt,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const result = await posts.insertOne(postDoc);
    
    // Fetch created post
    const createdPost = await posts.findOne({ _id: result.insertedId });
    
    if (!createdPost) {
      return NextResponse.json(
        { error: 'Failed to create post' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { post: createdPost },
      { status: 201 }
    );
  } catch (error: any) {
    // Handle Zod validation errors
    const validationError = handleValidationError(error);
    if (validationError) {
      return validationError;
    }
    
    console.error('[Admin Posts API] Error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to create post',
        details: process.env.NODE_ENV === 'development' 
          ? { stack: error.stack }
          : undefined,
      },
      { status: 500 }
    );
    }
  }, 'blog:manage');
}

