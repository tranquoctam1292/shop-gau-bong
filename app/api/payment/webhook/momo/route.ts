import { NextRequest, NextResponse } from 'next/server';
import { verifyMoMoCallback } from '@/lib/services/momo';
import { wcApi } from '@/lib/api/woocommerce';

/**
 * Webhook Handler: MoMo Payment Callback
 * POST /api/payment/webhook/momo
 * 
 * This endpoint receives payment confirmation from MoMo
 * and updates the order status in WordPress
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
      console.log('MoMo Payment Failed:', {
        orderId,
        amount,
        transId,
        resultCode,
        message,
      });

      return NextResponse.json({
        success: false,
        message: 'Payment failed',
      });
    }

    // Payment successful
    console.log('MoMo Payment Confirmed:', {
      orderId,
      amount,
      transId,
      payType,
      timestamp: new Date().toISOString(),
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
            key: '_momo_transaction_id',
            value: transId || '',
          },
          {
            key: '_momo_payment_type',
            value: payType || '',
          },
          {
            key: '_payment_confirmed_at',
            value: new Date().toISOString(),
          },
        ],
      };

      const updatedOrder = await wcApi.updateOrder(orderIdNumber, updateData);

      console.log('Order status updated successfully:', {
        orderId: orderIdNumber,
        status: updatedOrder.status,
        transactionId: transId,
      });

      return NextResponse.json({
        success: true,
        message: 'Payment confirmed and order updated',
        orderId: orderIdNumber,
        transId,
        orderStatus: updatedOrder.status,
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

