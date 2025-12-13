/**
 * Admin Order Refund API Route
 * POST /api/admin/orders/[id]/refund - Process refund for order
 * 
 * Protected route - requires authentication
 * Only allows refunding orders with paymentStatus = 'paid'
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCollections, ObjectId } from '@/lib/db';
import { z } from 'zod';
import { processRefund, getOrderRefunds } from '@/lib/services/refund';
import {
  createHistoryEntry,
  type ActorType,
} from '@/lib/services/orderHistory';

export const dynamic = 'force-dynamic';

// Refund create schema
const refundCreateSchema = z.object({
  amount: z.number().min(0.01),
  reason: z.string().optional(),
});

export async function POST(
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
    const validatedData = refundCreateSchema.parse(body);

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

    // Validate order can be refunded
    if (order.paymentStatus !== 'paid') {
      return NextResponse.json(
        {
          error: 'Invalid payment status',
          message: `Order can only be refunded when payment status is "paid". Current status: "${order.paymentStatus}"`,
        },
        { status: 400 }
      );
    }

    // Get current admin user for history logging
    let actorId: string | undefined;
    let actorName: string | undefined;
    let actorType: ActorType = 'admin';

    let processedBy: string | undefined;
    try {
      const { getSession } = await import('@/lib/auth');
      const session = await getSession();
      if (session?.user) {
        actorId = (session.user as any).id || session.user.email || undefined;
        actorName = session.user.name || session.user.email || 'Admin';
        processedBy = session.user.email || actorId;
      }
    } catch {
      actorType = 'system';
      actorName = 'System';
    }

    if (!processedBy) {
      processedBy = actorId || actorName;
    }

    // Process refund
    const refund = await processRefund(
      orderId.toString(),
      validatedData.amount,
      validatedData.reason,
      processedBy
    );

    // Create history entries
    const refundTypeLabel = refund.type === 'full' ? 'toàn bộ' : 'một phần';
    await createHistoryEntry({
      orderId: orderId.toString(),
      action: 'refund',
      description: `Hoàn tiền ${refundTypeLabel}: ${new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
      }).format(refund.amount)}${validatedData.reason ? `. Lý do: ${validatedData.reason}` : ''}`,
      actorId,
      actorType,
      actorName,
      metadata: {
        refundId: (refund as any)._id?.toString(),
        amount: refund.amount,
        type: refund.type,
        reason: validatedData.reason,
      },
    });

    // If full refund, also log status change
    if (refund.type === 'full') {
      await createHistoryEntry({
        orderId: orderId.toString(),
        action: 'update_status',
        description: `Đổi trạng thái từ "${order.status}" sang "refunded" (hoàn tiền toàn bộ)`,
        oldValue: order.status,
        newValue: 'refunded',
        actorId,
        actorType,
        actorName,
        metadata: {
          oldStatus: order.status,
          newStatus: 'refunded',
          reason: 'Full refund processed',
        },
      });

      await createHistoryEntry({
        orderId: orderId.toString(),
        action: 'update_payment_status',
        description: `Đổi trạng thái thanh toán từ "paid" sang "refunded"`,
        oldValue: 'paid',
        newValue: 'refunded',
        actorId,
        actorType,
        actorName,
        metadata: {
          oldPaymentStatus: 'paid',
          newPaymentStatus: 'refunded',
          reason: 'Full refund processed',
        },
      });
    } else {
      // Partial refund - log payment status change
      await createHistoryEntry({
        orderId: orderId.toString(),
        action: 'update_payment_status',
        description: `Hoàn tiền một phần. Trạng thái thanh toán: "refunded"`,
        oldValue: 'paid',
        newValue: 'refunded',
        actorId,
        actorType,
        actorName,
        metadata: {
          oldPaymentStatus: 'paid',
          newPaymentStatus: 'refunded',
          reason: 'Partial refund processed',
          refundAmount: refund.amount,
        },
      });
    }

    // Fetch updated order
    const updatedOrder = await orders.findOne({ _id: orderId });
    const { orderItems } = await getCollections();
    const items = await orderItems.find({ orderId: orderId.toString() }).toArray();

    // Get all refunds for this order
    const allRefunds = await getOrderRefunds(orderId.toString());

    return NextResponse.json({
      order: {
        ...updatedOrder,
        items,
      },
      refund,
      refunds: allRefunds,
    });
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

    console.error('[Admin Order Refund API] Error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to process refund',
        details:
          process.env.NODE_ENV === 'development'
            ? { stack: error.stack }
            : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/orders/[id]/refund - Get refunds for an order
 */
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

    const { orders } = await getCollections();
    const { id } = params;

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

    // Get all refunds
    const refunds = await getOrderRefunds(orderId.toString());

    return NextResponse.json({ refunds });
  } catch (error: any) {
    console.error('[Admin Order Refund API] Error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to fetch refunds',
      },
      { status: 500 }
    );
  }
}

