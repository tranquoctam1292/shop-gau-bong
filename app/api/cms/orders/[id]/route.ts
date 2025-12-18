/**
 * Public Orders API Route
 * GET /api/cms/orders/[id] - Get single order by ID or orderNumber
 * 
 * Public endpoint for customers to view their order details
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCollections, ObjectId } from '@/lib/db';
import { mapOrderToPublicDTO } from '@/lib/dto/PublicOrderDTO';

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
    
    // Map to Public Order DTO (sanitized - excludes sensitive fields)
    // SECURITY: Only return fields necessary for customer-facing features
    // Excludes: paymentMetadata, adminNotes, cancelledReason, version, updatedAt, _id, etc.
    const publicOrder = mapOrderToPublicDTO(order, items);
    
    return NextResponse.json({ order: publicOrder });
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
