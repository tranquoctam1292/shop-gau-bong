/**
 * Admin Auto-Cancel Orders API Route
 * POST /api/admin/orders/auto-cancel - Auto-cancel pending orders that have timed out
 * 
 * Protected route - requires authentication
 * Can be called by cron job or scheduled task
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCollections, ObjectId } from '@/lib/db';
import { releaseStock } from '@/lib/services/inventory';
import {
  createHistoryEntry,
  createCancellationHistory,
} from '@/lib/services/orderHistory';
import { withAuthAdmin, AuthenticatedRequest } from '@/lib/middleware/authMiddleware';

export const dynamic = 'force-dynamic';

// Timeout thresholds (in milliseconds)
const QR_PAYMENT_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const COD_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours

export async function POST(request: NextRequest) {
  return withAuthAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      const { orders, orderItems } = await getCollections();
    const now = new Date();

    // Find pending orders that have timed out
    const qrTimeoutDate = new Date(now.getTime() - QR_PAYMENT_TIMEOUT);
    const codTimeoutDate = new Date(now.getTime() - COD_TIMEOUT);

    // Orders with QR payment methods that are older than 30 minutes
    const qrOrders = await orders
      .find({
        status: 'pending',
        paymentMethod: { $in: ['vietqr', 'momo', 'stripe'] },
        createdAt: { $lt: qrTimeoutDate },
      })
      .toArray();

    // Orders with COD that are older than 24 hours
    const codOrders = await orders
      .find({
        status: 'pending',
        paymentMethod: 'cod',
        createdAt: { $lt: codTimeoutDate },
      })
      .toArray();

    const ordersToCancel = [...qrOrders, ...codOrders];
    const cancelledOrders: string[] = [];
    const errors: Array<{ orderId: string; error: string }> = [];

    for (const order of ordersToCancel) {
      try {
        const orderId = order._id.toString();

        // Get order items
        const items = await orderItems.find({ orderId }).toArray();

        // Release reserved stock
        try {
          await releaseStock(
            orderId,
            items.map((item) => ({
              productId: item.productId,
              variationId: item.variationId,
              quantity: item.quantity,
            }))
          );
        } catch (stockError: any) {
          console.error(`[Auto-Cancel] Error releasing stock for order ${orderId}:`, stockError);
          // Continue with cancellation even if stock release fails
        }

        // Update order status
        await orders.updateOne(
          { _id: order._id },
          {
            $set: {
              status: 'cancelled',
              cancelledAt: new Date(),
              cancelledReason: 'Tự động hủy do quá thời gian chờ thanh toán',
              updatedAt: new Date(),
            },
          }
        );

        // Create history entries
        await createCancellationHistory(
          orderId,
          'Tự động hủy do quá thời gian chờ thanh toán',
          undefined,
          'system',
          'Hệ thống'
        );

        await createHistoryEntry({
          orderId,
          action: 'update_status',
          description: 'Đơn hàng tự động hủy do quá thời gian chờ thanh toán',
          actorType: 'system',
          actorName: 'Hệ thống',
          metadata: {
            oldStatus: 'pending',
            newStatus: 'cancelled',
            autoCancelled: true,
            reason: 'Tự động hủy do quá thời gian chờ thanh toán',
          },
        });

        cancelledOrders.push(orderId);
      } catch (error: any) {
        errors.push({
          orderId: order._id.toString(),
          error: error.message || 'Unknown error',
        });
      }
    }

    return NextResponse.json({
      success: true,
      cancelled: cancelledOrders.length,
      errors: errors.length,
      cancelledOrderIds: cancelledOrders,
      errorsList: errors,
    });
  } catch (error: any) {
    console.error('[Admin Auto-Cancel Orders API] Error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to auto-cancel orders',
        details:
          process.env.NODE_ENV === 'development'
            ? { stack: error.stack }
            : undefined,
      },
      { status: 500 }
    );
    }
  }, 'order:update');
}

