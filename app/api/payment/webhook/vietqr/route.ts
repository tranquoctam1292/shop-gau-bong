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

      // CRITICAL FIX: Handle status transition properly
      // According to order state machine: pending/awaiting_payment → confirmed → processing
      // We must go through 'confirmed' first to trigger deductStock() logic
      const currentStatus = order.status as OrderStatus;
      
      // Get order items for inventory operations
      const { orderItems } = await getCollections();
      const items = await orderItems.find({ orderId: orderIdObj.toString() }).toArray();
      
      // CRITICAL: Deduct stock when payment is confirmed
      // Stock is reserved when order is created (pending/awaiting_payment)
      // Must be deducted when payment is confirmed
      if (items.length > 0 && (currentStatus === 'pending' || currentStatus === 'awaiting_payment')) {
        try {
          const { deductStock } = await import('@/lib/services/inventory');
          const itemsForInventory = items.map((item) => ({
            productId: item.productId,
            variationId: item.variationId,
            quantity: item.quantity,
          }));

          // Deduct stock when payment is confirmed
          await deductStock(orderIdObj.toString(), itemsForInventory);
        } catch (inventoryError: unknown) {
          // Log error but don't fail webhook (to prevent retries)
          console.error('[VietQR Webhook] Inventory deduction error:', inventoryError);
          // Continue with order update even if inventory deduction fails
          // This will be logged for manual intervention
        }
      }

      // Determine target status based on state machine
      // If current status is pending/awaiting_payment, first go to 'confirmed'
      // Then optionally move to 'processing' if needed
      let targetStatus: OrderStatus = 'processing';
      
      // Validate and determine correct transition
      if (currentStatus === 'pending' || currentStatus === 'awaiting_payment') {
        // First transition: pending/awaiting_payment → confirmed
        try {
          validateTransition(currentStatus, 'confirmed');
          targetStatus = 'confirmed'; // Go to confirmed first
        } catch (error: any) {
          console.error('Invalid status transition to confirmed:', error.message);
          // Fallback: try direct to processing (may fail validation)
          try {
            validateTransition(currentStatus, 'processing');
            targetStatus = 'processing';
          } catch (processingError: any) {
            console.error('Invalid status transition to processing:', processingError.message);
            // Keep current status if both transitions fail
            targetStatus = currentStatus;
          }
        }
      } else {
        // For other statuses, validate transition to processing
        try {
          validateTransition(currentStatus, 'processing');
          targetStatus = 'processing';
      } catch (error: any) {
        console.error('Invalid status transition:', error.message);
          // Keep current status if transition fails
          targetStatus = currentStatus;
        }
      }

      // Update order status and payment status
      const updateData: any = {
        status: targetStatus,
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
      if (currentStatus !== targetStatus) {
        await createStatusChangeHistory(
          orderIdObj.toString(),
          currentStatus,
          targetStatus,
          undefined,
          'system',
          'VietQR Webhook',
          { transactionId }
        );
      }
      
      // If we went to 'confirmed' and can transition to 'processing', do it
      if (targetStatus === 'confirmed') {
        try {
          validateTransition('confirmed', 'processing');
          // Update to processing
          await orders.updateOne(
            { _id: orderIdObj },
            { 
              $set: { 
                status: 'processing',
                updatedAt: new Date(),
              } 
            }
          );
          
          // Create history for processing transition
          await createStatusChangeHistory(
            orderIdObj.toString(),
            'confirmed',
            'processing',
            undefined,
            'system',
            'VietQR Webhook (Auto)',
            { transactionId }
          );
          
          targetStatus = 'processing'; // Update for response
        } catch (error: any) {
          // If transition to processing fails, stay at confirmed
          console.error('Failed to transition to processing:', error.message);
        }
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

      return NextResponse.json({
        success: true,
        message: 'Payment confirmed and order updated',
        orderId: orderIdObj.toString(),
        transactionId,
        orderStatus: updatedOrder?.status || targetStatus,
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

