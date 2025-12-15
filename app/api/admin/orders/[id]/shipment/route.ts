/**
 * Admin Order Shipment API Route
 * POST /api/admin/orders/[id]/shipment - Create shipment for order
 * 
 * Protected route - requires authentication
 * Only allows creating shipment when order status is 'processing'
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCollections, ObjectId } from '@/lib/db';
import { z } from 'zod';
import { createShipment, type Carrier } from '@/lib/services/shipment';
import { validateTransition } from '@/lib/utils/orderStateMachine';
import {
  createHistoryEntry,
  type ActorType,
} from '@/lib/services/orderHistory';
import { withAuthAdmin, AuthenticatedRequest } from '@/lib/middleware/authMiddleware';

export const dynamic = 'force-dynamic';

// Shipment create schema
const shipmentCreateSchema = z.object({
  carrier: z.enum(['ghtk', 'ghn', 'custom']),
  weight: z.number().min(0).optional(),
  carrierService: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuthAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      const { orders } = await getCollections();
      const { id } = params;
      const body = await req.json();

    // Validate input
    const validatedData = shipmentCreateSchema.parse(body);

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

    // Validate order status (should be 'processing')
    if (order.status !== 'processing') {
      return NextResponse.json(
        {
          error: 'Invalid order status',
          message: `Shipment can only be created when order status is "processing". Current status: "${order.status}"`,
        },
        { status: 400 }
      );
    }

    // Validate status transition (processing -> shipping)
    try {
      validateTransition(order.status as any, 'shipping');
    } catch (error: any) {
      return NextResponse.json(
        {
          error: 'Invalid status transition',
          message: error.message,
        },
        { status: 400 }
      );
    }

    // Get current admin user for history logging
    // req.adminUser is available from withAuthAdmin middleware
    const actorId: string | undefined = req.adminUser?._id?.toString();
    const actorName: string | undefined = req.adminUser?.full_name || req.adminUser?.username || 'Admin';
    const actorType: ActorType = 'admin';

    // Create shipment
    const shipment = await createShipment(
      orderId.toString(),
      validatedData.carrier,
      validatedData.weight,
      validatedData.carrierService
    );

    // Update order status to 'shipping'
    await orders.updateOne(
      { _id: orderId },
      {
        $set: {
          status: 'shipping',
          trackingNumber: shipment.trackingNumber,
          carrier: shipment.carrier,
          updatedAt: new Date(),
        },
      }
    );

    // Create history entries
    await createHistoryEntry({
      orderId: orderId.toString(),
      action: 'shipment_created',
      description: `Tạo vận đơn với ${validatedData.carrier.toUpperCase()}. Mã vận đơn: ${shipment.trackingNumber}`,
      actorId,
      actorType,
      actorName,
      metadata: {
        carrier: validatedData.carrier,
        trackingNumber: shipment.trackingNumber,
        weight: shipment.weight,
      },
    });

    await createHistoryEntry({
      orderId: orderId.toString(),
      action: 'update_status',
      description: `Đổi trạng thái từ "processing" sang "shipping"`,
      oldValue: 'processing',
      newValue: 'shipping',
      actorId,
      actorType,
      actorName,
      metadata: {
        oldStatus: 'processing',
        newStatus: 'shipping',
      },
    });

    // Fetch updated order
    const updatedOrder = await orders.findOne({ _id: orderId });
    const { orderItems } = await getCollections();
    const items = await orderItems.find({ orderId: orderId.toString() }).toArray();

    return NextResponse.json({
      order: {
        ...updatedOrder,
        items,
      },
      shipment,
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

    console.error('[Admin Order Shipment API] Error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to create shipment',
        details:
          process.env.NODE_ENV === 'development'
            ? { stack: error.stack }
            : undefined,
      },
      { status: 500 }
    );
    }
  }, 'order:update'); // Shipment creation requires update permission
}

