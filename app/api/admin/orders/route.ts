/**
 * Admin Orders API Route
 * GET /api/admin/orders - List orders (with filters)
 * POST /api/admin/orders - Create new order (for testing)
 * 
 * Protected route - requires authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCollections, ObjectId } from '@/lib/db';
import { withAuthAdmin, AuthenticatedRequest } from '@/lib/middleware/authMiddleware';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return withAuthAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      // Permission: order:read (checked by middleware)
      const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const perPage = parseInt(searchParams.get('per_page') || '20', 10);
    
    // Filter parameters
    const statusParam = searchParams.get('status'); // Single status or comma-separated
    const orderType = searchParams.get('orderType'); // 'personal' | 'gift'
    const channel = searchParams.get('channel'); // 'website', 'app', 'pos'
    const paymentMethod = searchParams.get('paymentMethod');
    const paymentStatus = searchParams.get('paymentStatus');
    const fromDate = searchParams.get('fromDate'); // ISO date string
    const toDate = searchParams.get('toDate'); // ISO date string
    const search = searchParams.get('search'); // Search by order number, email, phone
    const sortBy = searchParams.get('sortBy') || 'createdAt'; // 'createdAt', 'total', 'status'
    const sortOrder = searchParams.get('sortOrder') || 'desc'; // 'asc' | 'desc'
    
    const { orders } = await getCollections();
    
    // Build query
    const query: any = {};
    
    // Status filter (support multiple statuses)
    if (statusParam) {
      const statuses = statusParam.split(',').map((s) => s.trim()).filter(Boolean);
      if (statuses.length === 1) {
        query.status = statuses[0];
      } else if (statuses.length > 1) {
        query.status = { $in: statuses };
      }
    }
    
    // Order type filter
    if (orderType) {
      query.orderType = orderType;
    }
    
    // Channel filter
    if (channel) {
      query.channel = channel;
    }
    
    // Payment method filter
    if (paymentMethod) {
      query.paymentMethod = paymentMethod;
    }
    
    // Payment status filter
    if (paymentStatus) {
      query.paymentStatus = paymentStatus;
    }
    
    // Date range filter
    if (fromDate || toDate) {
      query.createdAt = {};
      if (fromDate) {
        query.createdAt.$gte = new Date(fromDate);
      }
      if (toDate) {
        // Add 1 day to include the entire toDate
        const toDateEnd = new Date(toDate);
        toDateEnd.setHours(23, 59, 59, 999);
        query.createdAt.$lte = toDateEnd;
      }
    }
    
    // Search filter (order number, email, phone)
    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { customerEmail: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { customerPhone: { $regex: search, $options: 'i' } },
      ];
    }
    
    // Build sort object
    const sort: any = {};
    if (sortBy === 'total') {
      sort.grandTotal = sortOrder === 'asc' ? 1 : -1;
    } else if (sortBy === 'status') {
      sort.status = sortOrder === 'asc' ? 1 : -1;
    } else {
      // Default: createdAt
      sort.createdAt = sortOrder === 'asc' ? 1 : -1;
    }
    
    // Fetch orders
    const [ordersList, total] = await Promise.all([
      orders
        .find(query)
        .sort(sort)
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
      filters: {
        status: statusParam,
        orderType,
        channel,
        paymentMethod,
        paymentStatus,
        fromDate,
        toDate,
        search,
        sortBy,
        sortOrder,
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
  }, 'order:read');
}

