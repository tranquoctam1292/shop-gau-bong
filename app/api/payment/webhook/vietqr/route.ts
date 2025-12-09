import { NextRequest, NextResponse } from 'next/server';
import { wcApi } from '@/lib/api/woocommerce';

/**
 * Webhook Handler: VietQR Payment Verification
 * POST /api/payment/webhook/vietqr
 * 
 * This endpoint receives payment confirmation from VietQR
 * and updates the order status in WordPress
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

    // Update order status in WordPress via WooCommerce REST API
    try {
      // Parse orderId - could be number or string
      const orderIdNumber = typeof orderId === 'string' ? parseInt(orderId, 10) : orderId;
      
      if (isNaN(orderIdNumber)) {
        console.error('Invalid orderId format:', orderId);
        return NextResponse.json(
          { error: 'Invalid order ID format' },
          { status: 400 }
        );
      }

      // Update order status to "processing" and mark as paid
      const updateData = {
        status: 'processing',
        set_paid: true, // Mark order as paid
        meta_data: [
          {
            key: '_vietqr_transaction_id',
            value: transactionId || '',
          },
          {
            key: '_payment_confirmed_at',
            value: timestamp || new Date().toISOString(),
          },
        ],
      };

      const updatedOrder = await wcApi.updateOrder(orderIdNumber, updateData);

      console.log('Order status updated successfully:', {
        orderId: orderIdNumber,
        status: updatedOrder.status,
        transactionId,
      });

      return NextResponse.json({
        success: true,
        message: 'Payment confirmed and order updated',
        orderId: orderIdNumber,
        transactionId,
        orderStatus: updatedOrder.status,
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

