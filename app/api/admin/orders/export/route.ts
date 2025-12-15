/**
 * Admin Export Orders API Route
 * GET /api/admin/orders/export - Export orders to CSV
 * 
 * Protected route - requires authentication
 * Query params: orderIds (comma-separated) or filters
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCollections, ObjectId } from '@/lib/db';
import { getStatusLabel } from '@/lib/utils/orderStateMachine';
import { withAuthAdmin, AuthenticatedRequest } from '@/lib/middleware/authMiddleware';

export const dynamic = 'force-dynamic';

function escapeCSV(value: any): string {
  if (value === null || value === undefined) {
    return '';
  }
  const stringValue = String(value);
  // Escape quotes and wrap in quotes if contains comma, newline, or quote
  if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

export async function GET(request: NextRequest) {
  return withAuthAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      const { searchParams } = new URL(req.url);
    const orderIdsParam = searchParams.get('orderIds');

    const { orders } = await getCollections();

    let orderList: any[] = [];

    if (orderIdsParam) {
      // Export specific orders
      const orderIds = orderIdsParam.split(',').map((id) => new ObjectId(id.trim()));
      orderList = await orders.find({ _id: { $in: orderIds } }).toArray();
    } else {
      // Export all orders (with limit for safety)
      orderList = await orders
        .find({})
        .sort({ createdAt: -1 })
        .limit(1000)
        .toArray();
    }

    // Generate CSV
    const headers = [
      'Mã đơn',
      'Khách hàng',
      'Email',
      'Số điện thoại',
      'Địa chỉ',
      'Tổng tiền',
      'Trạng thái',
      'Trạng thái thanh toán',
      'Phương thức thanh toán',
      'Kênh',
      'Ngày tạo',
      'Ngày cập nhật',
    ];

    const rows = orderList.map((order) => {
      const address = order.shippingAddress || order.shipping || {};
      const fullAddress = [
        address.address1 || '',
        address.ward || '',
        address.district || '',
        address.province || '',
      ]
        .filter(Boolean)
        .join(', ');

      return [
        order.orderNumber || '',
        order.customerName || '',
        order.customerEmail || '',
        order.customerPhone || address.phone || '',
        fullAddress,
        order.grandTotal || order.total || 0,
        getStatusLabel(order.status as any),
        order.paymentStatus || '',
        order.paymentMethod || '',
        order.channel || '',
        new Date(order.createdAt).toLocaleString('vi-VN'),
        new Date(order.updatedAt).toLocaleString('vi-VN'),
      ];
    });

    const csvContent = [
      headers.map(escapeCSV).join(','),
      ...rows.map((row) => row.map(escapeCSV).join(',')),
    ].join('\n');

    // Add BOM for Excel compatibility
    const bom = '\uFEFF';
    const csvWithBom = bom + csvContent;

    return new NextResponse(csvWithBom, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="orders-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error: any) {
    console.error('[Admin Export Orders API] Error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to export orders',
      },
      { status: 500 }
    );
    }
  }, 'order:read'); // Export requires read permission
}

