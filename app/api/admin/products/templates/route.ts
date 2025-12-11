/**
 * Admin Product Templates API Route
 * GET /api/admin/products/templates - List templates
 * POST /api/admin/products/templates - Save template
 * 
 * Protected route - requires authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCollections, ObjectId } from '@/lib/db';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// Template schema
const templateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.string().optional(),
  templateData: z.any(), // Product form data
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
    
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    
    const { productTemplates } = await getCollections();
    
    // Build query
    const query: any = {};
    if (category) {
      query.category = category;
    }
    
    // Fetch templates
    const templates = await productTemplates
      ?.find(query)
      .sort({ createdAt: -1 })
      .toArray() || [];
    
    return NextResponse.json({ templates });
  } catch (error: any) {
    console.error('[Admin Product Templates API] Error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to fetch templates',
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
    const validatedData = templateSchema.parse(body);
    
    const { productTemplates } = await getCollections();
    
    // Create template document
    const templateDoc = {
      ...validatedData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const result = await productTemplates?.insertOne(templateDoc);
    
    if (!result) {
      return NextResponse.json(
        { error: 'Failed to create template' },
        { status: 500 }
      );
    }
    
    // Fetch created template
    const createdTemplate = await productTemplates?.findOne({ _id: result.insertedId });
    
    if (!createdTemplate) {
      return NextResponse.json(
        { error: 'Failed to create template' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { template: createdTemplate },
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
    
    console.error('[Admin Product Templates API] Error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to create template',
        details: process.env.NODE_ENV === 'development' 
          ? { stack: error.stack }
          : undefined,
      },
      { status: 500 }
    );
  }
}

