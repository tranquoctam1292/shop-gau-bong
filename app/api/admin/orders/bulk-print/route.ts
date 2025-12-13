/**
 * Admin Bulk Print Shipping Labels API Route
 * POST /api/admin/orders/bulk-print - Generate printable shipping labels
 * 
 * Protected route - requires authentication
 * Returns HTML for printing shipping labels
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCollections, ObjectId } from '@/lib/db';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const bulkPrintSchema = z.object({
  orderIds: z.array(z.string()).min(1),
});

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const { requireAdmin } = await import('@/lib/auth');
    try {
      await requireAdmin();
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = bulkPrintSchema.parse(body);

    const { orders, orderItems } = await getCollections();

    const orderIds = validatedData.orderIds.map((id) => new ObjectId(id));
    const orderList = await orders
      .find({ _id: { $in: orderIds } })
      .toArray();

    // Fetch order items for each order
    const ordersWithItems = await Promise.all(
      orderList.map(async (order: any) => {
        const items = await orderItems
          .find({ orderId: order._id.toString() })
          .toArray();
        return { ...order, items };
      })
    );

    // Generate HTML for printing
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Nhãn vận chuyển</title>
  <style>
    @media print {
      @page {
        size: A4;
        margin: 10mm;
      }
      .label {
        page-break-after: always;
      }
      .label:last-child {
        page-break-after: auto;
      }
    }
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 20px;
    }
    .label {
      border: 2px solid #000;
      padding: 20px;
      margin-bottom: 20px;
      width: 100%;
      max-width: 800px;
      box-sizing: border-box;
    }
    .label-header {
      border-bottom: 2px solid #000;
      padding-bottom: 10px;
      margin-bottom: 15px;
    }
    .label-title {
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 5px;
    }
    .label-section {
      margin-bottom: 15px;
    }
    .label-section-title {
      font-weight: bold;
      font-size: 14px;
      margin-bottom: 5px;
      text-transform: uppercase;
    }
    .label-content {
      font-size: 14px;
      line-height: 1.6;
    }
    .label-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 10px;
    }
    .label-items {
      margin-top: 10px;
    }
    .label-item {
      padding: 5px 0;
      border-bottom: 1px dotted #ccc;
    }
  </style>
</head>
<body>
  ${ordersWithItems
    .map(
      (order) => `
    <div class="label">
      <div class="label-header">
        <div class="label-title">NHÃN VẬN CHUYỂN</div>
        <div class="label-content">Mã đơn: <strong>${order.orderNumber}</strong></div>
      </div>
      
      <div class="label-section">
        <div class="label-section-title">Thông tin người nhận</div>
        <div class="label-content">
          <div><strong>${order.customerName}</strong></div>
          ${order.customerPhone ? `<div>ĐT: ${order.customerPhone}</div>` : ''}
          ${order.customerEmail ? `<div>Email: ${order.customerEmail}</div>` : ''}
        </div>
      </div>
      
      <div class="label-section">
        <div class="label-section-title">Địa chỉ giao hàng</div>
        <div class="label-content">
          ${order.shippingAddress?.address1 || order.shipping?.address1 || ''}
          ${order.shippingAddress?.ward || order.shipping?.ward ? `, ${order.shippingAddress?.ward || order.shipping?.ward}` : ''}
          ${order.shippingAddress?.district || order.shipping?.district ? `, ${order.shippingAddress?.district || order.shipping?.district}` : ''}
          ${order.shippingAddress?.province || order.shipping?.province ? `, ${order.shippingAddress?.province || order.shipping?.province}` : ''}
        </div>
      </div>
      
      <div class="label-section">
        <div class="label-section-title">Sản phẩm</div>
        <div class="label-items">
          ${order.items
            .map(
              (item: any) => `
            <div class="label-item">
              ${item.productName} x ${item.quantity}
            </div>
          `
            )
            .join('')}
        </div>
      </div>
      
      ${order.trackingNumber ? `
      <div class="label-section">
        <div class="label-section-title">Mã vận đơn</div>
        <div class="label-content"><strong>${order.trackingNumber}</strong></div>
      </div>
      ` : ''}
      
      <div class="label-row">
        <div>Ngày tạo: ${new Date(order.createdAt).toLocaleDateString('vi-VN')}</div>
        <div>Tổng tiền: ${new Intl.NumberFormat('vi-VN', {
          style: 'currency',
          currency: 'VND',
        }).format(order.grandTotal || order.total || 0)}</div>
      </div>
    </div>
  `
    )
    .join('')}
  
  <script>
    window.onload = function() {
      window.print();
    };
  </script>
</body>
</html>
    `;

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation error',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    console.error('[Admin Bulk Print API] Error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to generate shipping labels',
      },
      { status: 500 }
    );
  }
}

