/**
 * Admin Order Shipping Address API Route
 * PATCH /api/admin/orders/[id]/shipping - Update shipping address
 * 
 * Protected route - requires authentication
 * Only allows editing when order status is 'pending' or 'confirmed'
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCollections, ObjectId } from '@/lib/db';
import { z } from 'zod';
import { canEditOrder, type OrderStatus } from '@/lib/utils/orderStateMachine';
import { recalculateOrderTotals } from '@/lib/utils/recalculateOrderTotals';
import {
  createHistoryEntry,
  type ActorType,
} from '@/lib/services/orderHistory';

export const dynamic = 'force-dynamic';

// Shipping address update schema
const shippingAddressSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  address1: z.string().optional(),
  address2: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  district: z.string().optional(),
  ward: z.string().optional(),
  postcode: z.string().optional(),
  country: z.string().optional(),
  phone: z.string().optional(),
});

export async function PATCH(
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
    const body = await request.json();

    // Validate input
    const validatedData = shippingAddressSchema.parse(body);

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

    // Check if order can be edited
    if (!canEditOrder(order.status as OrderStatus)) {
      return NextResponse.json(
        {
          error: 'Order cannot be edited',
          message: `Orders can only be edited when status is "pending" or "confirmed". Current status: "${order.status}"`,
        },
        { status: 400 }
      );
    }

    // Get current admin user for history logging
    let actorId: string | undefined;
    let actorName: string | undefined;
    let actorType: ActorType = 'admin';

    try {
      const { getSession } = await import('@/lib/auth');
      const session = await getSession();
      if (session?.user) {
        actorId = (session.user as any).id || session.user.email || undefined;
        actorName = session.user.name || session.user.email || 'Admin';
      }
    } catch {
      actorType = 'system';
      actorName = 'System';
    }

    // Get current order items for recalculation
    const currentItems = await orderItems.find({ orderId: orderId.toString() }).toArray();

    // Update shipping address
    const shippingUpdate: any = {};
    Object.keys(validatedData).forEach((key) => {
      if (validatedData[key as keyof typeof validatedData] !== undefined) {
        shippingUpdate[`shipping.${key}`] = validatedData[key as keyof typeof validatedData];
      }
    });

    await orders.updateOne(
      { _id: orderId },
      {
        $set: {
          ...shippingUpdate,
          updatedAt: new Date(),
        },
      }
    );

    // Recalculate totals (shipping fee might change based on address)
    const updatedOrder = await orders.findOne({ _id: orderId });
    const totals = recalculateOrderTotals({
      items: currentItems.map((item) => ({
        _id: item._id?.toString(),
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        price: item.price,
        total: item.total,
      })),
      shippingAddress: updatedOrder?.shipping,
      currentShippingTotal: order.shippingTotal || 0,
      discountTotal: order.discountTotal || 0,
    });

    // Update totals if shipping changed
    if (totals.shippingTotal !== (order.shippingTotal || 0)) {
      await orders.updateOne(
        { _id: orderId },
        {
          $set: {
            shippingTotal: totals.shippingTotal,
            grandTotal: totals.grandTotal,
            total: totals.grandTotal,
            updatedAt: new Date(),
          },
        }
      );
    }

    // Create history entry
    await createHistoryEntry({
      orderId: orderId.toString(),
      action: 'update_address',
      description: 'Địa chỉ giao hàng đã được cập nhật',
      actorId,
      actorType,
      actorName,
      metadata: {
        oldAddress: order.shipping,
        newAddress: updatedOrder?.shipping,
      },
    });

    // Fetch updated order
    const finalOrder = await orders.findOne({ _id: orderId });
    const items = await orderItems.find({ orderId: orderId.toString() }).toArray();

    return NextResponse.json({
      order: {
        ...finalOrder,
        items,
      },
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

    console.error('[Admin Order Shipping API] Error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to update shipping address',
        details:
          process.env.NODE_ENV === 'development'
            ? { stack: error.stack }
            : undefined,
      },
      { status: 500 }
    );
  }
}

