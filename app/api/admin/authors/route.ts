/**
 * Admin Authors API Route
 * GET /api/admin/authors - List authors
 * POST /api/admin/authors - Create new author
 * 
 * Protected route - requires authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCollections, ObjectId } from '@/lib/db';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// Author schema for validation
const authorSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
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

export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const { requireAdmin } = await import('@/lib/auth');
    try {
      await requireAdmin();
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { authors } = await getCollections();
    
    // Fetch all authors
    const authorsList = await authors
      .find({})
      .sort({ name: 1 })
      .toArray();
    
    return NextResponse.json({ authors: authorsList });
  } catch (error: any) {
    console.error('[Admin Authors API] Error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to fetch authors',
        details: process.env.NODE_ENV === 'development' 
          ? { stack: error.stack }
          : undefined,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const { requireAdmin } = await import('@/lib/auth');
    try {
      await requireAdmin();
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    
    // Validate input
    const validatedData = authorSchema.parse(body);
    
    const { authors } = await getCollections();
    
    // Check if slug already exists
    const existingAuthor = await authors.findOne({ slug: validatedData.slug });
    if (existingAuthor) {
      return NextResponse.json(
        { error: 'Author with this slug already exists' },
        { status: 409 }
      );
    }
    
    // Check if email already exists (if provided)
    if (validatedData.email) {
      const existingEmail = await authors.findOne({ email: validatedData.email });
      if (existingEmail) {
        return NextResponse.json(
          { error: 'Author with this email already exists' },
          { status: 409 }
        );
      }
    }
    
    // Create author document
    const authorDoc = {
      ...validatedData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const result = await authors.insertOne(authorDoc);
    
    // Fetch created author
    const createdAuthor = await authors.findOne({ _id: result.insertedId });
    
    if (!createdAuthor) {
      return NextResponse.json(
        { error: 'Failed to create author' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { author: createdAuthor },
      { status: 201 }
    );
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
    
    console.error('[Admin Authors API] Error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to create author',
        details: process.env.NODE_ENV === 'development' 
          ? { stack: error.stack }
          : undefined,
      },
      { status: 500 }
    );
  }
}

