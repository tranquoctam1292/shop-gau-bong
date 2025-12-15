/**
 * Admin Order Coupon API Route
 * PATCH /api/admin/orders/[id]/coupon - Apply or remove coupon
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
import { withAuthAdmin, AuthenticatedRequest } from '@/lib/middleware/authMiddleware';

export const dynamic = 'force-dynamic';

// Coupon update schema
const couponUpdateSchema = z.object({
  action: z.enum(['apply', 'remove']),
  couponCode: z.string().optional(), // Required for 'apply'
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuthAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      const { orders, orderItems } = await getCollections();
      const { id } = params;
      const body = await req.json();

    // Validate input
    const validatedData = couponUpdateSchema.parse(body);

    // Validate coupon code for apply action
    if (validatedData.action === 'apply' && !validatedData.couponCode) {
      return NextResponse.json(
        { error: 'Coupon code is required for apply action' },
        { status: 400 }
      );
    }

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
    // req.adminUser is available from withAuthAdmin middleware
    const actorId: string | undefined = req.adminUser?._id?.toString();
    const actorName: string | undefined = req.adminUser?.full_name || req.adminUser?.username || 'Admin';
    const actorType: ActorType = 'admin';

    // Get current order items for recalculation
    const currentItems = await orderItems.find({ orderId: orderId.toString() }).toArray();

    let discountTotal = 0;
    let couponCode: string | null = null;
    let historyDescription = '';

    if (validatedData.action === 'apply') {
      // TODO: Validate coupon code against coupons collection
      // For now, we'll do a simple validation
      // In production, you'd check:
      // - Coupon exists
      // - Coupon is valid (not expired, within usage limit)
      // - Coupon applies to this order (minimum order value, product restrictions, etc.)
      // - Calculate discount amount/percentage

      // Placeholder: Simple coupon validation
      // In production, replace this with actual coupon lookup
      const couponCodeUpper = validatedData.couponCode!.toUpperCase().trim();
      
      // Example: Simple discount calculation (10% off for demo)
      // In production, get discount from coupon document
      const discountPercent = 0.1; // 10%
      const subtotal = currentItems.reduce((sum, item) => sum + (item.total || 0), 0);
      discountTotal = Math.round(subtotal * discountPercent);
      couponCode = couponCodeUpper;

      historyDescription = `Áp dụng mã giảm giá "${couponCode}" (Giảm: ${new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
      }).format(discountTotal)})`;
    } else {
      // Remove coupon
      couponCode = null;
      discountTotal = 0;
      historyDescription = 'Xóa mã giảm giá';
    }

    // Recalculate totals
    const totals = recalculateOrderTotals({
      items: currentItems.map((item) => ({
        _id: item._id?.toString(),
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        price: item.price,
        total: item.total,
      })),
      shippingAddress: order.shipping,
      currentShippingTotal: order.shippingTotal || 0,
      discountTotal,
    });

    // Update order
    await orders.updateOne(
      { _id: orderId },
      {
        $set: {
          couponCode: couponCode || null,
          discountTotal: totals.discountTotal,
          grandTotal: totals.grandTotal,
          total: totals.grandTotal,
          updatedAt: new Date(),
        },
      }
    );

    // Create history entry
    await createHistoryEntry({
      orderId: orderId.toString(),
      action: 'apply_coupon',
      description: historyDescription,
      actorId,
      actorType,
      actorName,
      metadata: {
        action: validatedData.action,
        couponCode: validatedData.couponCode,
        discountTotal,
      },
    });

    // Fetch updated order
    const updatedOrder = await orders.findOne({ _id: orderId });
    const items = await orderItems.find({ orderId: orderId.toString() }).toArray();

    return NextResponse.json({
      order: {
        ...updatedOrder,
        items,
      },
      totals,
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

    console.error('[Admin Order Coupon API] Error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to update coupon',
        details:
          process.env.NODE_ENV === 'development'
            ? { stack: error.stack }
            : undefined,
      },
      { status: 500 }
    );
    }
  }, 'order:update'); // Coupon update requires update permission
}

