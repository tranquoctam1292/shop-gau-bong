/**
 * Admin Single Product Template API Route
 * GET /api/admin/products/templates/[id] - Get template
 * PUT /api/admin/products/templates/[id] - Update template
 * DELETE /api/admin/products/templates/[id] - Delete template
 * 
 * Protected route - requires authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCollections, ObjectId } from '@/lib/db';
import { z } from 'zod';
import { withAuthAdmin, AuthenticatedRequest } from '@/lib/middleware/authMiddleware';

export const dynamic = 'force-dynamic';

// Template update schema
const templateUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  templateData: z.any().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuthAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      const { productTemplates } = await getCollections();
    const { id } = params;
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid template ID' },
        { status: 400 }
      );
    }
    
    const template = await productTemplates?.findOne({ _id: new ObjectId(id) });
    
    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ template });
  } catch (error: any) {
    console.error('[Admin Product Template API] Error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to fetch template',
        details: process.env.NODE_ENV === 'development' 
          ? { stack: error.stack }
          : undefined,
      },
      { status: 500 }
    );
    }
  }, 'product:read'); // Template GET requires read permission
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuthAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      const { productTemplates } = await getCollections();
    const { id } = params;
    const body = await req.json();
    
    // Validate input
    const validatedData = templateUpdateSchema.parse(body);
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid template ID' },
        { status: 400 }
      );
    }
    
    const templateId = new ObjectId(id);
    const template = await productTemplates?.findOne({ _id: templateId });
    
    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }
    
    // Update template
    const updateData: any = {
      ...validatedData,
      updatedAt: new Date(),
    };
    
    await productTemplates?.updateOne(
      { _id: templateId },
      { $set: updateData }
    );
    
    // Fetch updated template
    const updatedTemplate = await productTemplates?.findOne({ _id: templateId });
    
    if (!updatedTemplate) {
      return NextResponse.json(
        { error: 'Failed to update template' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ template: updatedTemplate });
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
    
    console.error('[Admin Product Template API] Error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to update template',
        details: process.env.NODE_ENV === 'development' 
          ? { stack: error.stack }
          : undefined,
      },
      { status: 500 }
    );
    }
  }, 'product:update'); // Template PUT requires update permission
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuthAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      const { productTemplates } = await getCollections();
      const { id } = params;
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid template ID' },
        { status: 400 }
      );
    }
    
    const templateId = new ObjectId(id);
    const template = await productTemplates?.findOne({ _id: templateId });
    
    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }
    
    // Delete template
    await productTemplates?.deleteOne({ _id: templateId });
    
    return NextResponse.json(
      { message: 'Template deleted successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[Admin Product Template API] Error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to delete template',
        details: process.env.NODE_ENV === 'development' 
          ? { stack: error.stack }
          : undefined,
      },
      { status: 500 }
    );
    }
  }, 'product:delete'); // Template DELETE requires delete permission
}

