import { NextRequest, NextResponse } from 'next/server';
import { wcApi } from '@/lib/api/woocommerce';

/**
 * API Route: Proxy WooCommerce Orders API
 * GET /api/woocommerce/orders - Get orders list
 * POST /api/woocommerce/orders - Create new order
 * 
 * Proxy requests từ client đến WooCommerce REST API
 */
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Convert URLSearchParams to object
    const params: Record<string, any> = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });

    const orders = await wcApi.getOrders(params);

    return NextResponse.json({ orders });
  } catch (error: any) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const order = await wcApi.createOrder(body);

    return NextResponse.json({ order });
  } catch (error: any) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create order' },
      { status: 500 }
    );
  }
}

