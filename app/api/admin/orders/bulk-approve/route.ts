/**
 * Admin Bulk Approve Orders API Route
 * POST /api/admin/orders/bulk-approve - Bulk approve orders (Pending -> Confirmed)
 * 
 * Protected route - requires authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCollections, ObjectId } from '@/lib/db';
import { z } from 'zod';
import { validateTransition } from '@/lib/utils/orderStateMachine';
import {
  createStatusChangeHistory,
  type ActorType,
} from '@/lib/services/orderHistory';
import { withAuthAdmin, AuthenticatedRequest } from '@/lib/middleware/authMiddleware';

export const dynamic = 'force-dynamic';

const bulkApproveSchema = z.object({
  orderIds: z.array(z.string()).min(1),
});

export async function POST(request: NextRequest) {
  return withAuthAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      const body = await req.json();
      const validatedData = bulkApproveSchema.parse(body);

      const { orders } = await getCollections();

      // Get current admin user for history logging
      // req.adminUser is available from withAuthAdmin middleware
      const actorId: string | undefined = req.adminUser?._id?.toString();
      const actorName: string | undefined = req.adminUser?.full_name || req.adminUser?.username || 'Admin';
      const actorType: ActorType = 'admin';

    const orderIds = validatedData.orderIds.map((id) => new ObjectId(id));
    const orderList = await orders
      .find({ _id: { $in: orderIds } })
      .toArray();

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const order of orderList) {
      try {
        // Only approve orders with status 'pending'
        if (order.status !== 'pending') {
          results.failed++;
          results.errors.push(`Order ${order.orderNumber}: Invalid status (${order.status})`);
          continue;
        }

        // Validate transition
        try {
          validateTransition(order.status as any, 'confirmed');
        } catch (error: any) {
          results.failed++;
          results.errors.push(`Order ${order.orderNumber}: ${error.message}`);
          continue;
        }

        // Update order status
        await orders.updateOne(
          { _id: order._id },
          {
            $set: {
              status: 'confirmed',
              updatedAt: new Date(),
            },
          }
        );

        // Create history entry
        await createStatusChangeHistory(
          order._id.toString(),
          'pending',
          'confirmed',
          actorId,
          actorType,
          actorName
        );

        results.success++;
      } catch (error: any) {
        results.failed++;
        results.errors.push(`Order ${order.orderNumber}: ${error.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      results,
      message: `Đã xác nhận ${results.success} đơn hàng thành công${results.failed > 0 ? `, ${results.failed} đơn hàng thất bại` : ''}`,
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

    console.error('[Admin Bulk Approve API] Error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to bulk approve orders',
      },
      { status: 500 }
    );
    }
  }, 'order:update'); // Bulk approve requires update permission
}

