/**
 * Admin Orders API Route
 * GET /api/admin/orders - List orders (with filters)
 * POST /api/admin/orders - Create new order (for testing)
 * 
 * Protected route - requires authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCollections, ObjectId } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const { requireAdmin } = await import('@/lib/auth');
    try {
      await requireAdmin();
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const perPage = parseInt(searchParams.get('per_page') || '10', 10);
    const status = searchParams.get('status');
    const orderType = searchParams.get('orderType'); // 'personal' | 'gift'
    const search = searchParams.get('search');
    
    const { orders } = await getCollections();
    
    // Build query
    const query: any = {};
    
    if (status) {
      query.status = status;
    }
    
    if (orderType) {
      query.orderType = orderType;
    }
    
    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'customerEmail': { $regex: search, $options: 'i' } },
        { 'customerName': { $regex: search, $options: 'i' } },
      ];
    }
    
    // Fetch orders
    const [ordersList, total] = await Promise.all([
      orders
        .find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * perPage)
        .limit(perPage)
        .toArray(),
      orders.countDocuments(query),
    ]);
    
    const totalPages = Math.ceil(total / perPage);
    
    return NextResponse.json({
      orders: ordersList,
      pagination: {
        total,
        totalPages,
        currentPage: page,
        perPage,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error: any) {
    console.error('[Admin Orders API] Error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to fetch orders',
        details: process.env.NODE_ENV === 'development' 
          ? { stack: error.stack }
          : undefined,
      },
      { status: 500 }
    );
  }
}

