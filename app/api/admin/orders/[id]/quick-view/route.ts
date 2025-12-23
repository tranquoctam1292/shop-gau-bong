/**
 * Admin Order Quick View API Route
 * GET /api/admin/orders/[id]/quick-view - Get lightweight order data for quick view
 * 
 * Protected route - requires authentication
 * Returns only essential fields for quick view dialog (no histories, refunds, shipments)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCollections, ObjectId } from '@/lib/db';
import { withAuthAdmin, AuthenticatedRequest } from '@/lib/middleware/authMiddleware';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuthAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      const { orders, orderItems } = await getCollections();
      const { id } = params;
    
      // Find by ObjectId or orderNumber (follow pattern from existing endpoint)
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
      
      // Fetch order items (lightweight - only fields needed for quick view)
      const items = await orderItems
        .find({ orderId: order._id.toString() })
        .toArray();
      
      // Map items to quick view format
      const quickViewItems = items.map((item) => ({
        _id: item._id.toString(),
        productName: item.productName || '',
        quantity: item.quantity || 0,
        price: item.price || 0,
        total: item.total || item.subtotal || 0,
        variant: item.attributes ? {
          size: item.attributes.size,
          color: item.attributes.color,
        } : undefined,
      }));
      
      // Return only essential fields for quick view
      return NextResponse.json({
        order: {
          _id: order._id.toString(),
          orderNumber: order.orderNumber,
          status: order.status,
          paymentStatus: order.paymentStatus,
          paymentMethod: order.paymentMethod,
          customerName: order.customerName,
          customerEmail: order.customerEmail,
          customerPhone: order.customerPhone,
          grandTotal: order.grandTotal || 0,
          subtotal: order.subtotal || 0,
          shippingTotal: order.shippingTotal || 0,
          discountTotal: order.discountTotal || 0,
          taxTotal: order.taxTotal || 0,
          shippingAddress: order.shippingAddress,
          shipping: order.shipping, // Support both structures for backward compatibility
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
          items: quickViewItems,
        },
      });
    } catch (error: unknown) {
      console.error('[Admin Order Quick View API] Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch order';
      return NextResponse.json(
        { 
          error: errorMessage,
          details: process.env.NODE_ENV === 'development' 
            ? (error instanceof Error ? { stack: error.stack } : undefined)
            : undefined,
        },
        { status: 500 }
      );
    }
  }, 'order:read'); // Order GET requires read permission
}

