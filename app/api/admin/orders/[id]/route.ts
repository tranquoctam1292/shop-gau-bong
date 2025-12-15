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
import {
  validateTransition,
  type OrderStatus,
  getStatusLabel,
} from '@/lib/utils/orderStateMachine';
import {
  createStatusChangeHistory,
  createPaymentStatusChangeHistory,
  type ActorType,
} from '@/lib/services/orderHistory';
import { handleValidationError } from '@/lib/utils/validation-errors';
import { withAuthAdmin, AuthenticatedRequest } from '@/lib/middleware/authMiddleware';

export const dynamic = 'force-dynamic';

// Order update schema - Updated to include all statuses from spec
const orderUpdateSchema = z.object({
  status: z
    .enum([
      'pending',
      'awaiting_payment',
      'confirmed',
      'processing',
      'shipping',
      'completed',
      'cancelled',
      'refunded',
      'failed',
    ])
    .optional(),
  paymentStatus: z.enum(['pending', 'paid', 'failed', 'refunded']).optional(),
  adminNotes: z.string().optional(), // Changed from adminNote to adminNotes to match spec
  cancelledReason: z.string().optional(), // For cancellation reason
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuthAdmin(request, async (req: AuthenticatedRequest) => {
    try {
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
  }, 'order:read'); // Order GET requires read permission
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuthAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      const { orders } = await getCollections();
      const { id } = params;
      const body = await req.json();
    
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
    
    // Get current admin user for history logging
    // req.adminUser is available from withAuthAdmin middleware
    const actorId: string | undefined = req.adminUser?._id?.toString();
    const actorName: string | undefined = req.adminUser?.full_name || req.adminUser?.username || 'Admin';
    const actorType: ActorType = 'admin';

    // Validate status transition if status is being changed
    if (validatedData.status && validatedData.status !== order.status) {
      try {
        validateTransition(
          order.status as OrderStatus,
          validatedData.status as OrderStatus
        );
      } catch (error: any) {
        return NextResponse.json(
          {
            error: 'Invalid status transition',
            message: error.message,
            currentStatus: order.status,
            requestedStatus: validatedData.status,
          },
          { status: 400 }
        );
      }
    }

    // Update order
    const updateData: any = {
      updatedAt: new Date(),
    };

    // Update status if provided
    if (validatedData.status !== undefined) {
      updateData.status = validatedData.status;
    }

    // Update payment status if provided
    if (validatedData.paymentStatus !== undefined) {
      updateData.paymentStatus = validatedData.paymentStatus;
    }

    // Update admin notes if provided
    if (validatedData.adminNotes !== undefined) {
      updateData.adminNotes = validatedData.adminNotes;
    }

    // Update cancelled reason if provided
    if (validatedData.cancelledReason !== undefined) {
      updateData.cancelledReason = validatedData.cancelledReason;
    }

    // Update status timestamps
    if (validatedData.status === 'completed' && order.status !== 'completed') {
      updateData.completedAt = new Date();
    }

    if (validatedData.status === 'cancelled' && order.status !== 'cancelled') {
      updateData.cancelledAt = new Date();
    }

    if (
      validatedData.paymentStatus === 'paid' &&
      order.paymentStatus !== 'paid'
    ) {
      updateData.paidAt = new Date();
    }

    // Perform update
    await orders.updateOne({ _id: orderId }, { $set: updateData });

    // Handle inventory changes based on status transitions
    if (validatedData.status && validatedData.status !== order.status) {
      const { orderItems } = await getCollections();
      const items = await orderItems.find({ orderId: orderId.toString() }).toArray();

      try {
        const { reserveStock, deductStock, releaseStock } = await import('@/lib/services/inventory');
        const itemsForInventory = items.map((item) => ({
          productId: item.productId,
          variationId: item.variationId,
          quantity: item.quantity,
        }));

        // Release stock if order is being cancelled
        if (validatedData.status === 'cancelled' && order.status !== 'cancelled') {
          await releaseStock(orderId.toString(), itemsForInventory);
        }

        // Deduct stock if order is being confirmed (from pending/awaiting_payment)
        // Stock is reserved when order is created, and deducted when confirmed
        if (
          validatedData.status === 'confirmed' &&
          (order.status === 'pending' || order.status === 'awaiting_payment')
        ) {
          await deductStock(orderId.toString(), itemsForInventory);
        }

        // Reserve stock if order is being moved back to pending (shouldn't happen normally, but handle it)
        if (validatedData.status === 'pending' && order.status !== 'pending') {
          await reserveStock(orderId.toString(), itemsForInventory);
        }
      } catch (error: any) {
        // Log error but don't fail status update
        console.error('[Order Update] Inventory error:', error);
      }

      // Create history entry for status change
      await createStatusChangeHistory(
        orderId.toString(),
        order.status,
        validatedData.status,
        actorId,
        actorType,
        actorName
      );
    }

    // Create history entry for payment status changes
    if (
      validatedData.paymentStatus &&
      validatedData.paymentStatus !== order.paymentStatus
    ) {
      // Note: Stock is deducted when order is confirmed, not when payment status changes
      // This is to handle cases where order is confirmed before payment
      
      await createPaymentStatusChangeHistory(
        orderId.toString(),
        order.paymentStatus || 'pending',
        validatedData.paymentStatus,
        actorId,
        actorType,
        actorName
      );
    }
    
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
    // Handle Zod validation errors
    const validationError = handleValidationError(error);
    if (validationError) {
      return validationError;
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
  }, 'order:update'); // Order PUT requires update permission
}

