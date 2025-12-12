/**
 * Admin Bulk Update Order Status API Route
 * POST /api/admin/orders/bulk-update-status - Bulk update order status
 * 
 * Protected route - requires authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCollections, ObjectId } from '@/lib/db';
import { z } from 'zod';
import { validateTransition, type OrderStatus } from '@/lib/utils/orderStateMachine';
import {
  createStatusChangeHistory,
  type ActorType,
} from '@/lib/services/orderHistory';

export const dynamic = 'force-dynamic';

const bulkUpdateStatusSchema = z.object({
  orderIds: z.array(z.string()).min(1),
  status: z.enum([
    'pending',
    'awaiting_payment',
    'confirmed',
    'processing',
    'shipping',
    'completed',
    'cancelled',
    'refunded',
    'failed',
  ]),
});

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const { requireAdmin } = await import('@/lib/auth');
    try {
      await requireAdmin();
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = bulkUpdateStatusSchema.parse(body);

    const { orders } = await getCollections();

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
        const currentStatus = order.status as OrderStatus;
        const newStatus = validatedData.status as OrderStatus;

        // Skip if already at target status
        if (currentStatus === newStatus) {
          results.success++;
          continue;
        }

        // Validate transition
        try {
          validateTransition(currentStatus, newStatus);
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
              status: newStatus,
              updatedAt: new Date(),
            },
          }
        );

        // Create history entry
        await createStatusChangeHistory({
          orderId: order._id.toString(),
          oldStatus: currentStatus,
          newStatus,
          actorId,
          actorType,
          actorName,
        });

        results.success++;
      } catch (error: any) {
        results.failed++;
        results.errors.push(`Order ${order.orderNumber}: ${error.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      results,
      message: `Đã cập nhật ${results.success} đơn hàng thành công${results.failed > 0 ? `, ${results.failed} đơn hàng thất bại` : ''}`,
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

    console.error('[Admin Bulk Update Status API] Error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to bulk update order status',
      },
      { status: 500 }
    );
  }
}

