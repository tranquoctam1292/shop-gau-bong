/**
 * Phase 8 Database Test: Bulk Operations
 * 
 * Tests Phase 8 implementation với direct database access:
 * 1. Bulk approve orders (Pending -> Confirmed)
 * 2. Bulk update status với validation
 * 3. Export orders to CSV format
 * 4. Bulk print shipping labels HTML generation
 */

import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

import { getCollections, closeDB, ObjectId } from '../lib/db';
import { validateTransition, type OrderStatus } from '../lib/utils/orderStateMachine';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  details?: any;
}

const results: TestResult[] = [];

async function test(name: string, testFn: () => Promise<any>): Promise<void> {
  try {
    console.log(`\n🧪 Testing: ${name}`);
    const result = await testFn();
    results.push({ name, passed: true, details: result });
    console.log(`   ✅ PASSED`);
    if (result && typeof result === 'object') {
      Object.entries(result).forEach(([key, value]) => {
        if (key !== 'query') {
          console.log(`      ${key}: ${JSON.stringify(value)}`);
        }
      });
    }
  } catch (error: any) {
    results.push({ name, passed: false, error: error.message });
    console.log(`   ❌ FAILED: ${error.message}`);
  }
}

async function runTests() {
  console.log('🚀 Starting Phase 8 Database Tests: Bulk Operations\n');

  try {
    const { orders, orderItems } = await getCollections();

    // Create test orders với different statuses
    console.log('📦 Creating test orders...');
    const testOrders = [
      {
        orderNumber: `TEST-PHASE8-PENDING-${Date.now()}-1`,
        customerName: 'Test Customer 1',
        customerEmail: 'test1@example.com',
        status: 'pending' as OrderStatus,
        paymentStatus: 'pending' as const,
        paymentMethod: 'cod',
        subtotal: 100000,
        shippingTotal: 30000,
        grandTotal: 130000,
        total: 130000,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        orderNumber: `TEST-PHASE8-PENDING-${Date.now()}-2`,
        customerName: 'Test Customer 2',
        customerEmail: 'test2@example.com',
        status: 'pending' as OrderStatus,
        paymentStatus: 'pending' as const,
        paymentMethod: 'vietqr',
        subtotal: 200000,
        shippingTotal: 30000,
        grandTotal: 230000,
        total: 230000,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        orderNumber: `TEST-PHASE8-CONFIRMED-${Date.now()}`,
        customerName: 'Test Customer 3',
        customerEmail: 'test3@example.com',
        status: 'confirmed' as OrderStatus,
        paymentStatus: 'paid' as const,
        paymentMethod: 'cod',
        subtotal: 150000,
        shippingTotal: 30000,
        grandTotal: 180000,
        total: 180000,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const orderResults = await orders.insertMany(testOrders);
    const orderIds = Object.values(orderResults.insertedIds).map((id) => id.toString());
    const pendingOrderIds = orderIds.slice(0, 2);
    const confirmedOrderId = orderIds[2];

    // Create order items
    for (let i = 0; i < orderIds.length; i++) {
      await orderItems.insertMany([
        {
          orderId: orderIds[i],
          productId: `test-product-${i}`,
          productName: `Test Product ${i + 1}`,
          quantity: 1,
          price: testOrders[i].subtotal,
          total: testOrders[i].subtotal,
          createdAt: new Date(),
        },
      ]);
    }

    console.log(`   ✅ Created ${testOrders.length} test orders`);

    // Test 1: Bulk approve pending orders
    await test('Bulk approve pending orders', async () => {
      // Simulate bulk approve logic
      const orderList = await orders
        .find({ _id: { $in: pendingOrderIds.map((id) => new ObjectId(id)) } })
        .toArray();

      let successCount = 0;
      let failedCount = 0;

      for (const order of orderList) {
        if (order.status !== 'pending') {
          failedCount++;
          continue;
        }

        try {
          validateTransition(order.status as any, 'confirmed');
        } catch {
          failedCount++;
          continue;
        }

        await orders.updateOne(
          { _id: order._id },
          {
            $set: {
              status: 'confirmed',
              updatedAt: new Date(),
            },
          }
        );
        successCount++;
      }

      // Verify orders were updated
      const updatedOrders = await orders
        .find({ _id: { $in: pendingOrderIds.map((id) => new ObjectId(id)) } })
        .toArray();

      const allConfirmed = updatedOrders.every((o) => o.status === 'confirmed');
      if (!allConfirmed) {
        throw new Error('Not all orders were confirmed');
      }

      return {
        successCount,
        failedCount,
        totalProcessed: orderList.length,
      };
    });

    // Test 2: Bulk update status với validation
    await test('Bulk update status với validation', async () => {
      // Create orders với statuses that can transition to 'shipping'
      // 'processing' can transition to 'shipping', but 'confirmed' cannot directly
      const testOrder1 = {
        orderNumber: `TEST-PHASE8-BULK-1-${Date.now()}`,
        customerName: 'Test Customer',
        customerEmail: 'test@example.com',
        status: 'processing' as OrderStatus, // Can transition to shipping
        paymentStatus: 'paid' as const,
        paymentMethod: 'cod',
        subtotal: 100000,
        shippingTotal: 30000,
        grandTotal: 130000,
        total: 130000,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const testOrder2 = {
        orderNumber: `TEST-PHASE8-BULK-2-${Date.now()}`,
        customerName: 'Test Customer',
        customerEmail: 'test@example.com',
        status: 'processing' as OrderStatus, // Can transition to shipping
        paymentStatus: 'paid' as const,
        paymentMethod: 'cod',
        subtotal: 100000,
        shippingTotal: 30000,
        grandTotal: 130000,
        total: 130000,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const bulkOrderResults = await orders.insertMany([testOrder1, testOrder2]);
      const bulkOrderIds = Object.values(bulkOrderResults.insertedIds).map((id) =>
        id.toString()
      );

      // Simulate bulk update to 'shipping'
      const orderList = await orders
        .find({ _id: { $in: bulkOrderIds.map((id) => new ObjectId(id)) } })
        .toArray();

      let successCount = 0;
      let failedCount = 0;
      const errors: string[] = [];

      for (const order of orderList) {
        const currentStatus = order.status as OrderStatus;
        const newStatus = 'shipping' as OrderStatus;

        if (currentStatus === newStatus) {
          successCount++;
          continue;
        }

        try {
          validateTransition(currentStatus, newStatus);
        } catch (error: any) {
          failedCount++;
          errors.push(`Order ${order.orderNumber}: ${error.message}`);
          continue;
        }

        await orders.updateOne(
          { _id: order._id },
          {
            $set: {
              status: newStatus,
              updatedAt: new Date(),
            },
          }
        );
        successCount++;
      }

      // Verify orders were updated correctly
      const updatedOrders = await orders
        .find({ _id: { $in: bulkOrderIds.map((id) => new ObjectId(id)) } })
        .toArray();

      const allShipping = updatedOrders.every((o) => o.status === 'shipping');
      if (!allShipping) {
        throw new Error(`Not all valid orders were updated to shipping. Statuses: ${updatedOrders.map((o) => o.status).join(', ')}`);
      }

      if (successCount !== orderList.length) {
        throw new Error(`Expected ${orderList.length} successes, got ${successCount}`);
      }

      // Cleanup
      await orders.deleteMany({ _id: { $in: bulkOrderIds.map((id) => new ObjectId(id)) } });

      return {
        successCount,
        failedCount,
        errors: errors.length,
        allUpdated: allShipping,
      };
    });

    // Test 3: Export orders to CSV format
    await test('Export orders to CSV format', async () => {
      const exportOrderIds = [orderIds[0], confirmedOrderId];
      const orderList = await orders
        .find({ _id: { $in: exportOrderIds.map((id) => new ObjectId(id)) } })
        .toArray();

      // Generate CSV headers
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

      // Generate CSV rows
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
          order.status || '',
          order.paymentStatus || '',
          order.paymentMethod || '',
          order.channel || '',
          new Date(order.createdAt).toLocaleString('vi-VN'),
          new Date(order.updatedAt).toLocaleString('vi-VN'),
        ];
      });

      const csvContent = [
        headers.join(','),
        ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
      ].join('\n');

      if (!csvContent.includes('Mã đơn')) {
        throw new Error('CSV headers not found');
      }

      if (rows.length !== orderList.length) {
        throw new Error(`Expected ${orderList.length} rows, got ${rows.length}`);
      }

      return {
        csvRows: rows.length,
        csvLength: csvContent.length,
        hasHeaders: csvContent.includes('Mã đơn'),
      };
    });

    // Test 4: Bulk print shipping labels HTML generation
    await test('Bulk print shipping labels HTML generation', async () => {
      const printOrderIds = [orderIds[0], orderIds[1]];
      const orderList = await orders
        .find({ _id: { $in: printOrderIds.map((id) => new ObjectId(id)) } })
        .toArray();

      // Fetch order items
      const ordersWithItems = await Promise.all(
        orderList.map(async (order) => {
          const items = await orderItems
            .find({ orderId: order._id.toString() })
            .toArray();
          return { ...order, items };
        })
      );

      // Generate HTML (simplified version)
      const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Nhãn vận chuyển</title>
</head>
<body>
      ${ordersWithItems
    .map(
      (order: any) => `
    <div class="label">
      <div>NHÃN VẬN CHUYỂN</div>
      <div>Mã đơn: ${order.orderNumber}</div>
      <div>Khách hàng: ${order.customerName}</div>
      <div>Email: ${order.customerEmail}</div>
      <div>Sản phẩm: ${order.items.map((item: any) => `${item.productName} x ${item.quantity}`).join(', ')}</div>
    </div>
  `
    )
    .join('')}
</body>
</html>
      `;

      if (!html.includes('NHÃN VẬN CHUYỂN')) {
        throw new Error('HTML does not contain label header');
      }

      if (!html.includes(orderList[0].orderNumber)) {
        throw new Error('HTML does not contain order number');
      }

      const labelCount = (html.match(/NHÃN VẬN CHUYỂN/g) || []).length;
      if (labelCount !== orderList.length) {
        throw new Error(`Expected ${orderList.length} labels, got ${labelCount}`);
      }

      return {
        htmlLength: html.length,
        labelCount,
        hasOrderNumbers: orderList.every((o) => html.includes(o.orderNumber)),
      };
    });

    // Test 5: Bulk approve skips invalid orders
    await test('Bulk approve skips invalid orders', async () => {
      // Create order với invalid status for approval
      const invalidOrder = {
        orderNumber: `TEST-PHASE8-INVALID-${Date.now()}`,
        customerName: 'Test Customer',
        customerEmail: 'test@example.com',
        status: 'completed' as OrderStatus, // Cannot approve completed order
        paymentStatus: 'paid' as const,
        paymentMethod: 'cod',
        subtotal: 100000,
        shippingTotal: 30000,
        grandTotal: 130000,
        total: 130000,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const invalidOrderResult = await orders.insertOne(invalidOrder);
      const invalidOrderId = invalidOrderResult.insertedId.toString();

      // Try to bulk approve (should skip)
      const orderList = await orders
        .find({ _id: { $in: [new ObjectId(invalidOrderId)] } })
        .toArray();

      let successCount = 0;
      let failedCount = 0;

      for (const order of orderList) {
        if (order.status !== 'pending') {
          failedCount++;
          continue;
        }

        try {
          validateTransition(order.status as any, 'confirmed');
        } catch {
          failedCount++;
          continue;
        }

        await orders.updateOne(
          { _id: order._id },
          {
            $set: {
              status: 'confirmed',
              updatedAt: new Date(),
            },
          }
        );
        successCount++;
      }

      // Verify order was not changed
      const unchangedOrder = await orders.findOne({ _id: new ObjectId(invalidOrderId) });
      if (unchangedOrder?.status !== 'completed') {
        throw new Error('Order status should not have changed');
      }

      // Cleanup
      await orders.deleteOne({ _id: new ObjectId(invalidOrderId) });

      return {
        successCount,
        failedCount,
        orderStatusUnchanged: unchangedOrder?.status === 'completed',
      };
    });

    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    await orderItems.deleteMany({ orderId: { $in: orderIds } });
    await orders.deleteMany({ _id: { $in: orderIds.map((id) => new ObjectId(id)) } });
    console.log('   ✅ Test data cleaned up');

    // Print Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));

    const passed = results.filter((r) => r.passed).length;
    const failed = results.filter((r) => !r.passed).length;

    console.log(`\n✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Total: ${results.length}`);

    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      results.filter((r) => !r.passed).forEach((r) => {
        console.log(`   - ${r.name}: ${r.error}`);
      });
    }

    console.log('\n' + '='.repeat(60));

    if (failed === 0) {
      console.log('🎉 All Phase 8 database tests passed!');
      await closeDB();
      process.exit(0);
    } else {
      console.log('❌ Some tests failed. Please review the errors above.');
      await closeDB();
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    await closeDB();
    process.exit(1);
  }
}

// Run tests
runTests();

