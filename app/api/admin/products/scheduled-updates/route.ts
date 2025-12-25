/**
 * Admin Product Scheduled Updates API Route
 * POST /api/admin/products/scheduled-updates - Schedule a product update
 * GET /api/admin/products/scheduled-updates - List scheduled updates
 * 
 * Protected route - requires authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCollections, ObjectId } from '@/lib/db';
import { z } from 'zod';
import { withAuthAdmin, AuthenticatedRequest } from '@/lib/middleware/authMiddleware';

export const dynamic = 'force-dynamic';

// Scheduled update schema
const scheduledUpdateSchema = z.object({
  productId: z.string().min(1),
  scheduledAt: z.string().datetime(),
  updateData: z.any(), // Product update data
});

export async function GET(request: NextRequest) {
  return withAuthAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      const searchParams = req.nextUrl.searchParams;
      const productId = searchParams.get('productId');
      const status = searchParams.get('status'); // 'pending' | 'completed' | 'failed'
      
      const { scheduledUpdates } = await getCollections();
      
      // Build query
      const query: Record<string, unknown> = {};
      if (productId) {
        query.productId = productId;
      }
      if (status) {
        query.status = status;
      } else {
        // Default: only pending updates
        query.status = 'pending';
      }
      
      // Fetch scheduled updates
      const updates = await scheduledUpdates
        ?.find(query)
        .sort({ scheduledAt: 1 }) // Sort by scheduled time (earliest first)
        .toArray() || [];
      
      return NextResponse.json({ updates });
    } catch (error: unknown) {
      console.error('[Admin Scheduled Updates API] Error:', error);
      return NextResponse.json(
        { 
          error: error instanceof Error ? error.message : 'Failed to fetch scheduled updates',
          details: process.env.NODE_ENV === 'development' 
            ? { stack: error instanceof Error ? error.stack : undefined }
            : undefined,
        },
        { status: 500 }
      );
    }
  }, 'product:read'); // Scheduled updates GET requires read permission
}

export async function POST(request: NextRequest) {
  return withAuthAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      const body = await req.json();
      
      // Validate input
      const validatedData = scheduledUpdateSchema.parse(body);
      
      const scheduledAt = new Date(validatedData.scheduledAt);
      if (scheduledAt <= new Date()) {
        return NextResponse.json(
          { error: 'Scheduled time must be in the future' },
          { status: 400 }
        );
      }
      
      const { scheduledUpdates, products } = await getCollections();
      
      // Verify product exists
      if (!ObjectId.isValid(validatedData.productId)) {
        return NextResponse.json(
          { error: 'Invalid product ID' },
          { status: 400 }
        );
      }
      
      const product = await products?.findOne({ _id: new ObjectId(validatedData.productId) });
      if (!product) {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        );
      }
      
      // Create scheduled update document
      const scheduledUpdateDoc = {
        productId: validatedData.productId,
        scheduledAt,
        updateData: validatedData.updateData,
        status: 'pending' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: req.adminUser?._id?.toString(),
      };
      
      const result = await scheduledUpdates?.insertOne(scheduledUpdateDoc);
      
      if (!result) {
        return NextResponse.json(
          { error: 'Failed to create scheduled update' },
          { status: 500 }
        );
      }
      
      // Fetch created scheduled update
      const createdUpdate = await scheduledUpdates?.findOne({ _id: result.insertedId });
      
      if (!createdUpdate) {
        return NextResponse.json(
          { error: 'Failed to create scheduled update' },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { scheduledUpdate: createdUpdate },
        { status: 201 }
      );
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { 
            error: 'Validation error',
            details: error.errors,
          },
          { status: 400 }
        );
      }
      
      console.error('[Admin Scheduled Updates API] Error:', error);
      return NextResponse.json(
        { 
          error: error instanceof Error ? error.message : 'Failed to create scheduled update',
          details: process.env.NODE_ENV === 'development' 
            ? { stack: error instanceof Error ? error.stack : undefined }
            : undefined,
        },
        { status: 500 }
      );
    }
  }, 'product:update'); // Scheduled updates POST requires update permission
}

