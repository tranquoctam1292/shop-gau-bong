/**
 * Admin Single Order API Route
 * GET /api/admin/orders/[id] - Get single order
 * PUT /api/admin/orders/[id] - Update order
 * 
 * Protected route - requires authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCollections, ObjectId } from '@/lib/db';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// Order update schema
const orderUpdateSchema = z.object({
  status: z.enum(['pending', 'processing', 'completed', 'cancelled', 'refunded']).optional(),
  paymentStatus: z.enum(['pending', 'paid', 'failed', 'refunded']).optional(),
  adminNote: z.string().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authentication check
    const { requireAdmin } = await import('@/lib/auth');
    try {
      await requireAdmin();
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { orders, orderItems } = await getCollections();
    const { id } = params;
    
    // Find by ObjectId or orderNumber
    let order = null;
    
    if (ObjectId.isValid(id)) {
      order = await orders.findOne({ _id: new ObjectId(id) });
    }
    
    if (!order) {
      order = await orders.findOne({ orderNumber: id });
    }
    
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }
    
    // Fetch order items
    const items = await orderItems
      .find({ orderId: order._id.toString() })
      .toArray();
    
    return NextResponse.json({
      order: {
        ...order,
        items,
      },
    });
  } catch (error: any) {
    console.error('[Admin Order API] Error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to fetch order',
        details: process.env.NODE_ENV === 'development' 
          ? { stack: error.stack }
          : undefined,
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authentication check
    const { requireAdmin } = await import('@/lib/auth');
    try {
      await requireAdmin();
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { orders } = await getCollections();
    const { id } = params;
    const body = await request.json();
    
    // Validate input
    const validatedData = orderUpdateSchema.parse(body);
    
    // Find order
    let order = null;
    let orderId: ObjectId | null = null;
    
    if (ObjectId.isValid(id)) {
      orderId = new ObjectId(id);
      order = await orders.findOne({ _id: orderId });
    }
    
    if (!order) {
      order = await orders.findOne({ orderNumber: id });
      if (order) {
        orderId = order._id;
      }
    }
    
    if (!order || !orderId) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }
    
    // Update order
    const updateData: any = {
      ...validatedData,
      updatedAt: new Date(),
    };
    
    // Update status timestamps
    if (validatedData.status === 'completed' && order.status !== 'completed') {
      updateData.completedAt = new Date();
    }
    
    if (validatedData.paymentStatus === 'paid' && order.paymentStatus !== 'paid') {
      updateData.paidAt = new Date();
    }
    
    await orders.updateOne(
      { _id: orderId },
      { $set: updateData }
    );
    
    // Fetch updated order
    const updatedOrder = await orders.findOne({ _id: orderId });
    
    if (!updatedOrder) {
      return NextResponse.json(
        { error: 'Failed to update order' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ order: updatedOrder });
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
    
    console.error('[Admin Order API] Error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to update order',
        details: process.env.NODE_ENV === 'development' 
          ? { stack: error.stack }
          : undefined,
      },
      { status: 500 }
    );
  }
}

