import { NextRequest, NextResponse } from 'next/server';
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
 * Webhook Handler: VietQR Payment Verification
 * POST /api/payment/webhook/vietqr
 * 
 * This endpoint receives payment confirmation from VietQR
 * and updates the order status in MongoDB
 * 
 * Note: VietQR webhook format may vary. This is a template.
 * Adjust based on actual VietQR webhook documentation.
 */
export async function POST(request: NextRequest) {
  try {
    // Verify webhook signature (if provided by VietQR)
    const signature = request.headers.get('x-vietqr-signature');
    const webhookSecret = process.env.VIETQR_WEBHOOK_SECRET;

    if (webhookSecret && signature) {
      // TODO: Implement signature verification
      // const isValid = verifySignature(body, signature, webhookSecret);
      // if (!isValid) {
      //   return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      // }
    }

    const body = await request.json();

    // Extract payment information from webhook
    const {
      orderId,
      amount,
      transactionId,
      status,
      timestamp,
    } = body;

    // Validate payment status
    if (status !== 'success' && status !== 'completed') {
      return NextResponse.json({ received: true });
    }

    // Log payment confirmation
    console.log('VietQR Payment Confirmed:', {
      orderId,
      amount,
      transactionId,
      timestamp,
    });

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
          vietqrTransactionId: transactionId || '',
          paymentConfirmedAt: timestamp || new Date().toISOString(),
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
          'VietQR Webhook',
          { transactionId }
        );
      }

      await createPaymentStatusChangeHistory(
        orderIdObj.toString(),
        order.paymentStatus || 'pending',
        'paid',
        undefined,
        'system',
        'VietQR Webhook'
      );

      // Fetch updated order
      const updatedOrder = await orders.findOne({ _id: orderIdObj });

      console.log('Order status updated successfully:', {
        orderId: orderIdObj.toString(),
        status: updatedOrder?.status,
        transactionId,
      });

      return NextResponse.json({
        success: true,
        message: 'Payment confirmed and order updated',
        orderId: orderIdObj.toString(),
        transactionId,
        orderStatus: updatedOrder?.status,
      });
    } catch (updateError: any) {
      // Log error but don't fail the webhook (to prevent retries)
      console.error('Failed to update order status:', {
        orderId,
        error: updateError.message,
        stack: updateError.stack,
      });

      // Still return success to VietQR to prevent retries
      // But log the error for manual intervention
      return NextResponse.json({
        success: true,
        message: 'Payment confirmed but order update failed',
        orderId,
        transactionId,
        warning: 'Order status update failed. Please update manually.',
      });
    }
  } catch (error: any) {
    console.error('VietQR webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

// Handle GET requests (for webhook verification)
export async function GET() {
  return NextResponse.json({
    message: 'VietQR Webhook Endpoint',
    status: 'active',
  });
}

