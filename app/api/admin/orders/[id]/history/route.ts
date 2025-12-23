/**
 * Admin Order History API Route
 * GET /api/admin/orders/[id]/history - Get order history
 * 
 * Protected route - requires authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCollections, ObjectId } from '@/lib/db';
import { getOrderHistory } from '@/lib/services/orderHistory';
import { withAuthAdmin, AuthenticatedRequest } from '@/lib/middleware/authMiddleware';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuthAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      const { orders } = await getCollections();
    const { id } = params;

    // Find order by ObjectId or orderNumber
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

    // Get order history
    const histories = await getOrderHistory(order._id.toString());

    return NextResponse.json({
      orderId: order._id.toString(),
      orderNumber: order.orderNumber,
      histories,
    });
  } catch (error: any) {
    console.error('[Admin Order History API] Error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to fetch order history',
        details:
          process.env.NODE_ENV === 'development'
            ? { stack: error.stack }
            : undefined,
      },
      { status: 500 }
    );
    }
  }, 'order:read'); // Order history requires read permission
}

