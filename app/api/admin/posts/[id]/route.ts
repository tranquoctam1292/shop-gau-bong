/**
 * Admin Single Post API Route
 * GET /api/admin/posts/[id] - Get single post
 * PUT /api/admin/posts/[id] - Update post
 * DELETE /api/admin/posts/[id] - Delete post
 * 
 * Protected route - requires authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCollections, ObjectId } from '@/lib/db';
import { z } from 'zod';
import { handleValidationError } from '@/lib/utils/validation-errors';
import { withAuthAdmin, AuthenticatedRequest } from '@/lib/middleware/authMiddleware';

export const dynamic = 'force-dynamic';

// Post update schema
const postUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  content: z.string().optional(),
  excerpt: z.string().optional(),
  featuredImage: z.string().optional(),
  authorId: z.string().optional(),
  categoryId: z.string().optional(),
  tagIds: z.array(z.string()).default([]).optional(),
  status: z.enum(['draft', 'publish']).optional(),
  publishedAt: z.string().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  seoKeywords: z.string().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuthAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      // Permission: blog:read (checked by middleware)
      const { posts } = await getCollections();
      const { id } = params;
      
      // Find by ObjectId or slug
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
      
      return NextResponse.json({ post });
    } catch (error: any) {
      console.error('[Admin Post API] Error:', error);
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
  }, 'blog:read');
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuthAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      // Permission: blog:manage (checked by middleware)
    
    const { posts } = await getCollections();
    const { id } = params;
    const body = await req.json();
    
    // Validate input
    const validatedData = postUpdateSchema.parse(body);
    
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
    
    // Check slug uniqueness if slug is being updated
    if (validatedData.slug && validatedData.slug !== post.slug) {
      const existingPost = await posts.findOne({ 
        slug: validatedData.slug,
        _id: { $ne: postId },
      });
      if (existingPost) {
        return NextResponse.json(
          { error: 'Post with this slug already exists' },
          { status: 409 }
        );
      }
    }
    
    // Update publishedAt if status changed to publish
    const updateData: any = { ...validatedData };
    if (validatedData.status === 'publish' && post.status !== 'publish') {
      updateData.publishedAt = validatedData.publishedAt 
        ? new Date(validatedData.publishedAt)
        : new Date();
    } else if (validatedData.status === 'draft') {
      updateData.publishedAt = null;
    }
    
    updateData.updatedAt = new Date();
    
    // Update post
    await posts.updateOne(
      { _id: postId },
      { $set: updateData }
    );
    
    // Fetch updated post
    const updatedPost = await posts.findOne({ _id: postId });
    
    if (!updatedPost) {
      return NextResponse.json(
        { error: 'Failed to update post' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ post: updatedPost });
  } catch (error: any) {
    // Handle Zod validation errors
    const validationError = handleValidationError(error);
    if (validationError) {
      return validationError;
    }
    
    console.error('[Admin Post API] Error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to update post',
        details: process.env.NODE_ENV === 'development' 
          ? { stack: error.stack }
          : undefined,
      },
      { status: 500 }
    );
    }
  }, 'blog:manage');
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuthAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      // Permission: blog:manage (checked by middleware)
    
    const { posts } = await getCollections();
    const { id } = params;
    
    // Find post
    let postId: ObjectId | null = null;
    
    if (ObjectId.isValid(id)) {
      postId = new ObjectId(id);
    } else {
      const post = await posts.findOne({ slug: id });
      if (post) {
        postId = post._id;
      }
    }
    
    if (!postId) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }
    
    // Delete post
    await posts.deleteOne({ _id: postId });
    
    return NextResponse.json(
      { message: 'Post deleted successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[Admin Post API] Error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to delete post',
        details: process.env.NODE_ENV === 'development' 
          ? { stack: error.stack }
          : undefined,
      },
      { status: 500 }
    );
    }
  }, 'blog:manage');
}

