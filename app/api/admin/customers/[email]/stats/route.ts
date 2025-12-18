/**
 * Admin Customer Stats API Route
 * GET /api/admin/customers/[email]/stats - Get customer statistics
 * 
 * Protected route - requires authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCollections } from '@/lib/db';
import { withAuthAdmin, AuthenticatedRequest } from '@/lib/middleware/authMiddleware';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { email: string } }
) {
  return withAuthAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      const { orders } = await getCollections();
    const email = decodeURIComponent(params.email);

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Find all orders for this customer
    const customerOrders = await orders
      .find({ customerEmail: email })
      .sort({ createdAt: -1 })
      .toArray();

    if (customerOrders.length === 0) {
      return NextResponse.json({
        email,
        stats: {
          totalOrders: 0,
          totalSpent: 0,
          averageOrderValue: 0,
        },
      });
    }

    // Calculate statistics
    const totalOrders = customerOrders.length;
    const totalSpent = customerOrders.reduce((sum, order) => {
      return sum + (order.grandTotal || 0);
    }, 0);
    const averageOrderValue = totalSpent / totalOrders;

    const firstOrder = customerOrders[customerOrders.length - 1];
    const lastOrder = customerOrders[0];

    return NextResponse.json({
      email,
      stats: {
        totalOrders,
        totalSpent,
        averageOrderValue: Math.round(averageOrderValue),
        firstOrderDate: firstOrder.createdAt,
        lastOrderDate: lastOrder.createdAt,
      },
    });
  } catch (error: any) {
    console.error('[Admin Customer Stats API] Error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to fetch customer stats',
        details:
          process.env.NODE_ENV === 'development'
            ? { stack: error.stack }
            : undefined,
      },
      { status: 500 }
    );
    }
  }, 'order:read'); // Customer stats requires order read permission
}

