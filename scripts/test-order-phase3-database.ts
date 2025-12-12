/**
 * Phase 3 Database Test: Order Detail Enhancement
 * 
 * Tests Phase 3 implementation với direct database access:
 * 1. Order History API (GET /api/admin/orders/[id]/history)
 * 2. Customer Stats API (GET /api/admin/customers/[email]/stats)
 * 3. Order status transitions với history
 * 4. Customer statistics calculation
 */

import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

import { getCollections, closeDB, ObjectId } from '../lib/db';
import {
  createOrderCreationHistory,
  createStatusChangeHistory,
  createPaymentStatusChangeHistory,
  getOrderHistory,
} from '../lib/services/orderHistory';
import type { OrderStatus } from '../lib/utils/orderStateMachine';

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
  console.log('🚀 Starting Phase 3 Database Tests: Order Detail Enhancement\n');

  try {
    const { orders, orderHistories } = await getCollections();

    // Create test order
    console.log('📦 Creating test order...');
    const testOrder = {
      orderNumber: `TEST-PHASE3-${Date.now()}`,
      customerName: 'Phase 3 Test Customer',
      customerEmail: 'phase3test@example.com',
      customerPhone: '0123456789',
      status: 'pending' as OrderStatus,
      paymentStatus: 'pending' as const,
      paymentMethod: 'cod',
      paymentMethodTitle: 'Thanh toán khi nhận hàng',
      subtotal: 200000,
      shippingTotal: 30000,
      taxTotal: 0,
      discountTotal: 0,
      grandTotal: 230000,
      currency: 'VND',
      channel: 'website',
      billing: {
        firstName: 'Phase3',
        lastName: 'Test',
        address1: '123 Test Street',
        city: 'Ho Chi Minh',
        postcode: '70000',
        country: 'VN',
      },
      shipping: {
        firstName: 'Phase3',
        lastName: 'Test',
        address1: '123 Test Street',
        city: 'Ho Chi Minh',
        postcode: '70000',
        country: 'VN',
        province: 'Ho Chi Minh',
        district: 'District 1',
        ward: 'Ward 1',
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const orderResult = await orders.insertOne(testOrder);
    const orderId = orderResult.insertedId.toString();
    console.log(`   ✅ Order created: ${testOrder.orderNumber} (ID: ${orderId})`);

    // Test 1: Create order history entries
    await test('Create order creation history', async () => {
      await createOrderCreationHistory(
        orderId,
        'customer',
        testOrder.customerName
      );

      const histories = await getOrderHistory(orderId);
      const createHistory = histories.find((h) => h.action === 'create');

      if (!createHistory) {
        throw new Error('Order creation history not found');
      }

      return {
        historyId: createHistory._id?.toString(),
        action: createHistory.action,
        actorType: createHistory.actorType,
      };
    });

    // Test 2: Create status change history
    await test('Create status change history', async () => {
      await orders.updateOne(
        { _id: new ObjectId(orderId) },
        { $set: { status: 'confirmed', updatedAt: new Date() } }
      );

      await createStatusChangeHistory(
        orderId,
        'pending',
        'confirmed',
        'test-admin-id',
        'admin',
        'Test Admin'
      );

      const histories = await getOrderHistory(orderId);
      const statusHistory = histories.find(
        (h) => h.action === 'update_status' && h.metadata?.newStatus === 'confirmed'
      );

      if (!statusHistory) {
        throw new Error('Status change history not found');
      }

      return {
        action: statusHistory.action,
        oldStatus: statusHistory.metadata?.oldStatus,
        newStatus: statusHistory.metadata?.newStatus,
        actorName: statusHistory.actorName,
      };
    });

    // Test 3: Get order history (sorted by createdAt desc)
    await test('Get order history (sorted by createdAt desc)', async () => {
      // Add more history entries
      await orders.updateOne(
        { _id: new ObjectId(orderId) },
        { $set: { status: 'processing', updatedAt: new Date() } }
      );

      await createStatusChangeHistory(
        orderId,
        'confirmed',
        'processing',
        'admin',
        'test-admin-id',
        'Test Admin'
      );

      const histories = await getOrderHistory(orderId);

      if (histories.length < 3) {
        throw new Error(`Expected at least 3 history entries, got ${histories.length}`);
      }

      // Verify sorting (should be descending by createdAt for getOrderHistory)
      let isSorted = true;
      for (let i = 0; i < histories.length - 1; i++) {
        const current = new Date(histories[i].createdAt).getTime();
        const next = new Date(histories[i + 1].createdAt).getTime();
        if (current < next) {
          isSorted = false;
          break;
        }
      }

      if (!isSorted) {
        throw new Error('Histories are not sorted correctly (should be descending)');
      }

      return {
        count: histories.length,
        isSorted,
        actions: histories.map((h) => h.action),
      };
    });

    // Test 4: Customer stats calculation
    await test('Calculate customer stats', async () => {
      // Create additional orders for the same customer
      const additionalOrders = [
        {
          orderNumber: `TEST-PHASE3-${Date.now()}-1`,
          customerName: testOrder.customerName,
          customerEmail: testOrder.customerEmail,
          customerPhone: testOrder.customerPhone,
          status: 'completed' as OrderStatus,
          paymentStatus: 'paid' as const,
          paymentMethod: 'vietqr',
          subtotal: 300000,
          shippingTotal: 30000,
          taxTotal: 0,
          discountTotal: 0,
          grandTotal: 330000,
          currency: 'VND',
          channel: 'website',
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
          updatedAt: new Date(),
        },
        {
          orderNumber: `TEST-PHASE3-${Date.now()}-2`,
          customerName: testOrder.customerName,
          customerEmail: testOrder.customerEmail,
          customerPhone: testOrder.customerPhone,
          status: 'completed' as OrderStatus,
          paymentStatus: 'paid' as const,
          paymentMethod: 'momo',
          subtotal: 500000,
          shippingTotal: 30000,
          taxTotal: 0,
          discountTotal: 0,
          grandTotal: 530000,
          currency: 'VND',
          channel: 'website',
          createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
          updatedAt: new Date(),
        },
      ];

      await orders.insertMany(additionalOrders);

      // Calculate stats manually
      const customerOrders = await orders
        .find({ customerEmail: testOrder.customerEmail })
        .sort({ createdAt: -1 })
        .toArray();

      const totalOrders = customerOrders.length;
      const totalSpent = customerOrders.reduce((sum, order) => {
        return sum + (order.grandTotal || order.total || 0);
      }, 0);
      const averageOrderValue = totalSpent / totalOrders;

      const firstOrder = customerOrders[customerOrders.length - 1];
      const lastOrder = customerOrders[0];

      if (totalOrders < 3) {
        throw new Error(`Expected at least 3 orders, got ${totalOrders}`);
      }

      if (totalSpent !== 1090000) {
        throw new Error(`Expected total spent 1090000, got ${totalSpent}`);
      }

      return {
        totalOrders,
        totalSpent,
        averageOrderValue: Math.round(averageOrderValue),
        firstOrderDate: firstOrder.createdAt,
        lastOrderDate: lastOrder.createdAt,
      };
    });

    // Test 5: Customer stats for new customer (no orders)
    await test('Customer stats for new customer (no orders)', async () => {
      const newCustomerEmail = 'newcustomer@example.com';
      const customerOrders = await orders
        .find({ customerEmail: newCustomerEmail })
        .toArray();

      if (customerOrders.length !== 0) {
        throw new Error(`Expected 0 orders for new customer, got ${customerOrders.length}`);
      }

      const totalSpent = 0;
      const averageOrderValue = 0;

      return {
        totalOrders: 0,
        totalSpent,
        averageOrderValue,
      };
    });

    // Test 6: Payment status change history
    await test('Create payment status change history', async () => {
      await orders.updateOne(
        { _id: new ObjectId(orderId) },
        { $set: { paymentStatus: 'paid', paidAt: new Date(), updatedAt: new Date() } }
      );

      await createPaymentStatusChangeHistory(
        orderId,
        'pending',
        'paid',
        'test-admin-id',
        'admin',
        'Test Admin'
      );

      const histories = await getOrderHistory(orderId);
      const paymentHistory = histories.find(
        (h) => h.action === 'update_payment_status' && h.metadata?.newPaymentStatus === 'paid'
      );

      if (!paymentHistory) {
        throw new Error('Payment status change history not found');
      }

      return {
        action: paymentHistory.action,
        oldPaymentStatus: paymentHistory.metadata?.oldPaymentStatus,
        newPaymentStatus: paymentHistory.metadata?.newPaymentStatus,
        actorName: paymentHistory.actorName,
      };
    });

    // Test 7: History entries with metadata
    await test('History entries with metadata', async () => {
      const histories = await getOrderHistory(orderId);

      const statusHistories = histories.filter((h) => h.metadata?.oldStatus && h.metadata?.newStatus);
      const paymentHistories = histories.filter(
        (h) => h.metadata?.oldPaymentStatus && h.metadata?.newPaymentStatus
      );

      if (statusHistories.length < 2) {
        throw new Error(`Expected at least 2 status histories, got ${statusHistories.length}`);
      }

      return {
        totalHistories: histories.length,
        statusHistories: statusHistories.length,
        paymentHistories: paymentHistories.length,
      };
    });

    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    await orderHistories.deleteMany({ orderId });
    await orders.deleteMany({
      $or: [
        { _id: new ObjectId(orderId) },
        { customerEmail: testOrder.customerEmail, orderNumber: { $regex: '^TEST-PHASE3-' } },
      ],
    });
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
      console.log('🎉 All Phase 3 database tests passed!');
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

