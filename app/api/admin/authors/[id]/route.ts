/**
 * Admin Single Author API Route
 * GET /api/admin/authors/[id] - Get single author
 * PUT /api/admin/authors/[id] - Update author
 * DELETE /api/admin/authors/[id] - Delete author
 * 
 * Protected route - requires authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCollections, ObjectId } from '@/lib/db';
import { z } from 'zod';
import { withAuthAdmin, AuthenticatedRequest } from '@/lib/middleware/authMiddleware';
import { Permission } from '@/types/admin';

export const dynamic = 'force-dynamic';

// Author update schema
const authorUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  email: z.string().email().optional(),
  bio: z.string().optional(),
  avatar: z.string().optional(),
  socialLinks: z.object({
    website: z.string().optional(),
    twitter: z.string().optional(),
    facebook: z.string().optional(),
    linkedin: z.string().optional(),
  }).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuthAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      const { authors } = await getCollections();
    const { id } = params;
    
    // Find by ObjectId or slug
    let author = null;
    
    if (ObjectId.isValid(id)) {
      author = await authors.findOne({ _id: new ObjectId(id) });
    }
    
    if (!author) {
      author = await authors.findOne({ slug: id });
    }
    
    if (!author) {
      return NextResponse.json(
        { error: 'Author not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ author });
  } catch (error: any) {
    console.error('[Admin Author API] Error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to fetch author',
        details: process.env.NODE_ENV === 'development' 
          ? { stack: error.stack }
          : undefined,
      },
      { status: 500 }
    );
    }
  }, 'author:read' as Permission); // Author GET requires read permission
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuthAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      const { authors } = await getCollections();
      const { id } = params;
      const body = await req.json();
    
    // Validate input
    const validatedData = authorUpdateSchema.parse(body);
    
    // Find author
    let author = null;
    let authorId: ObjectId | null = null;
    
    if (ObjectId.isValid(id)) {
      authorId = new ObjectId(id);
      author = await authors.findOne({ _id: authorId });
    }
    
    if (!author) {
      author = await authors.findOne({ slug: id });
      if (author) {
        authorId = author._id;
      }
    }
    
    if (!author || !authorId) {
      return NextResponse.json(
        { error: 'Author not found' },
        { status: 404 }
      );
    }
    
    // Check slug uniqueness if slug is being updated
    if (validatedData.slug && validatedData.slug !== author.slug) {
      const existingAuthor = await authors.findOne({ 
        slug: validatedData.slug,
        _id: { $ne: authorId },
      });
      if (existingAuthor) {
        return NextResponse.json(
          { error: 'Author with this slug already exists' },
          { status: 409 }
        );
      }
    }
    
    // Check email uniqueness if email is being updated
    if (validatedData.email && validatedData.email !== author.email) {
      const existingEmail = await authors.findOne({ 
        email: validatedData.email,
        _id: { $ne: authorId },
      });
      if (existingEmail) {
        return NextResponse.json(
          { error: 'Author with this email already exists' },
          { status: 409 }
        );
      }
    }
    
    // Update author
    const updateData: any = {
      ...validatedData,
      updatedAt: new Date(),
    };
    
    await authors.updateOne(
      { _id: authorId },
      { $set: updateData }
    );
    
    // Fetch updated author
    const updatedAuthor = await authors.findOne({ _id: authorId });
    
    if (!updatedAuthor) {
      return NextResponse.json(
        { error: 'Failed to update author' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ author: updatedAuthor });
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
    
    console.error('[Admin Author API] Error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to update author',
        details: process.env.NODE_ENV === 'development' 
          ? { stack: error.stack }
          : undefined,
      },
      { status: 500 }
    );
    }
  }, 'author:update' as Permission); // Author PUT requires update permission
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuthAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      const { authors, posts } = await getCollections();
    const { id } = params;
    
    // Find author
    let authorId: ObjectId | null = null;
    
    if (ObjectId.isValid(id)) {
      authorId = new ObjectId(id);
    } else {
      const author = await authors.findOne({ slug: id });
      if (author) {
        authorId = author._id;
      }
    }
    
    if (!authorId) {
      return NextResponse.json(
        { error: 'Author not found' },
        { status: 404 }
      );
    }
    
    // Check if author has posts
    const postsCount = await posts.countDocuments({ 
      authorId: authorId.toString() 
    });
    
    if (postsCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete author with posts. Please reassign or delete posts first.' },
        { status: 400 }
      );
    }
    
    // Delete author
    await authors.deleteOne({ _id: authorId });
    
    return NextResponse.json(
      { message: 'Author deleted successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[Admin Author API] Error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to delete author',
        details: process.env.NODE_ENV === 'development' 
          ? { stack: error.stack }
          : undefined,
      },
      { status: 500 }
    );
    }
  }, 'author:delete' as Permission); // Author DELETE requires delete permission
}

