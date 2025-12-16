import { NextRequest, NextResponse } from 'next/server';
import { verifyMoMoCallback } from '@/lib/services/momo';
import { getCollections, ObjectId } from '@/lib/db';
import {
  validateTransition,
  type OrderStatus,
} from '@/lib/utils/orderStateMachine';
import {
  createStatusChangeHistory,
  createPaymentStatusChangeHistory,
} from '@/lib/services/orderHistory';

/**
 * Webhook Handler: MoMo Payment Callback
 * POST /api/payment/webhook/momo
 * 
 * This endpoint receives payment confirmation from MoMo
 * and updates the order status in MongoDB
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Get secret key from environment
    const secretKey = process.env.MOMO_SECRET_KEY || '';

    if (!secretKey) {
      return NextResponse.json(
        { error: 'MoMo secret key not configured' },
        { status: 500 }
      );
    }

    // Verify signature
    const isValid = await verifyMoMoCallback(body, secretKey);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Extract payment information
    const {
      orderId,
      amount,
      transId,
      resultCode,
      message,
      payType,
    } = body;

    // Check payment status
    // resultCode: 0 = success, others = failed
    if (resultCode !== 0) {
      return NextResponse.json({
        success: false,
        message: 'Payment failed',
      });
    }

    // Payment successful

    // Update order status in MongoDB
    try {
      const { orders } = await getCollections();
      
      // Find order by orderNumber or ObjectId
      // orderId from webhook body could be string (orderNumber) or number
      let order = null;
      let orderIdObj: ObjectId | null = null;
      const orderIdFromWebhook = orderId; // From webhook body
      
      // Try to find by orderNumber first (common format from payment providers)
      if (typeof orderIdFromWebhook === 'string') {
        order = await orders.findOne({ orderNumber: orderIdFromWebhook });
        if (order) {
          orderIdObj = order._id;
        }
      }
      
      // Try ObjectId if not found
      if (!order && typeof orderIdFromWebhook === 'string' && ObjectId.isValid(orderIdFromWebhook)) {
        orderIdObj = new ObjectId(orderIdFromWebhook);
        order = await orders.findOne({ _id: orderIdObj });
      }
      
      // Try parsing as number (legacy support)
      if (!order && orderIdFromWebhook) {
        const orderIdNum = typeof orderIdFromWebhook === 'string' ? parseInt(orderIdFromWebhook, 10) : orderIdFromWebhook;
        if (!isNaN(orderIdNum)) {
          // Try to find by orderNumber that matches the number
          order = await orders.findOne({ orderNumber: String(orderIdNum) });
          if (order) {
            orderIdObj = order._id;
          }
        }
      }
      
      if (!order || !orderIdObj) {
        console.error('Order not found:', orderIdFromWebhook);
        return NextResponse.json(
          { error: 'Order not found' },
          { status: 404 }
        );
      }

      // Validate status transition
      const currentStatus = order.status as OrderStatus;
      const newStatus: OrderStatus = 'processing';
      
      try {
        validateTransition(currentStatus, newStatus);
      } catch (error: any) {
        console.error('Invalid status transition:', error.message);
        // Still update payment status even if status transition fails
      }

      // Update order status and payment status
      const updateData: any = {
        status: newStatus,
        paymentStatus: 'paid',
        paidAt: new Date(),
        updatedAt: new Date(),
        // Store payment metadata
        paymentMetadata: {
          ...(order.paymentMetadata || {}),
          momoTransactionId: transId || '',
          momoPaymentType: payType || '',
          paymentConfirmedAt: new Date().toISOString(),
          },
      };

      await orders.updateOne({ _id: orderIdObj }, { $set: updateData });

      // Create history entries
      if (currentStatus !== newStatus) {
        await createStatusChangeHistory(
          orderIdObj.toString(),
          currentStatus,
          newStatus,
          undefined,
          'system',
          'MoMo Webhook',
          { transactionId: transId }
        );
      }

      await createPaymentStatusChangeHistory(
        orderIdObj.toString(),
        order.paymentStatus || 'pending',
        'paid',
        undefined,
        'system',
        'MoMo Webhook'
      );

      // Fetch updated order
      const updatedOrder = await orders.findOne({ _id: orderIdObj });

      return NextResponse.json({
        success: true,
        message: 'Payment confirmed and order updated',
        orderId: orderIdObj.toString(),
        transId,
        orderStatus: updatedOrder?.status,
      });
    } catch (updateError: any) {
      // Log error but don't fail the webhook (to prevent retries)
      console.error('Failed to update order status:', {
        orderId,
        error: updateError.message,
        stack: updateError.stack,
      });

      // Still return success to MoMo to prevent retries
      // But log the error for manual intervention
      return NextResponse.json({
        success: true,
        message: 'Payment confirmed but order update failed',
        orderId,
        transId,
        warning: 'Order status update failed. Please update manually.',
      });
    }
  } catch (error: any) {
    console.error('MoMo webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

// Handle GET requests (for webhook verification)
export async function GET() {
  return NextResponse.json({
    message: 'MoMo Webhook Endpoint',
    status: 'active',
  });
}

