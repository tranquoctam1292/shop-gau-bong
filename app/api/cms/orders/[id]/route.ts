/**
 * Public Orders API Route
 * GET /api/cms/orders/[id] - Get single order by ID or orderNumber
 * 
 * Public endpoint for customers to view their order details
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCollections, ObjectId } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { orders, orderItems } = await getCollections();
    const { id } = params;
    
    // Find by ObjectId or orderNumber
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
    
    // Fetch order items
    const items = await orderItems
      .find({ orderId: order._id.toString() })
      .toArray();
    
    // Map to frontend format (compatible with WooCommerceOrder format for backward compatibility)
    const mappedOrder = {
      id: order._id.toString(),
      number: order.orderNumber,
      status: order.status,
      payment_method: order.paymentMethod,
      payment_method_title: order.paymentMethodTitle,
      payment_status: order.paymentStatus,
      total: String(order.total),
      currency: order.currency || 'VND',
      customer_note: order.customerNote || '',
      billing: {
        first_name: order.billing?.firstName || '',
        last_name: order.billing?.lastName || '',
        email: order.customerEmail || '',
        phone: order.customerPhone || '',
        address_1: order.billing?.address1 || '',
        address_2: order.billing?.address2 || '',
        city: order.billing?.city || '',
        postcode: order.billing?.postcode || '',
        country: order.billing?.country || 'VN',
      },
      shipping: {
        first_name: order.shipping?.firstName || '',
        last_name: order.shipping?.lastName || '',
        address_1: order.shipping?.address1 || '',
        address_2: order.shipping?.address2 || '',
        city: order.shipping?.city || '',
        postcode: order.shipping?.postcode || '',
        country: order.shipping?.country || 'VN',
      },
      line_items: items.map((item) => ({
        id: item._id.toString(),
        name: item.productName,
        product_id: item.productId,
        variation_id: item.variationId || null,
        quantity: item.quantity,
        price: String(item.price),
        subtotal: String(item.subtotal),
        total: String(item.total),
      })),
      // Include raw MongoDB fields for compatibility
      _id: order._id.toString(),
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
    
    return NextResponse.json({ order: mappedOrder });
  } catch (error: any) {
    console.error('[CMS Orders API] Error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to fetch order',
        details: process.env.NODE_ENV === 'development' 
          ? { stack: error.stack }
          : undefined,
      },
      { status: 500 }
    );
  }
}
