/**
 * Phase 7 Database Test: Refund Management
 * 
 * Tests Phase 7 implementation với direct database access:
 * 1. RefundService functions (processRefund, getOrderRefunds, getTotalRefunded)
 * 2. Refund validation (only paid orders, amount validation)
 * 3. Partial and full refunds
 * 4. Multiple partial refunds
 * 5. Order status updates after refund
 */

import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

import { getCollections, closeDB, ObjectId } from '../lib/db';
import {
  processRefund,
  getOrderRefunds,
  getTotalRefunded,
  updateRefundStatus,
} from '../lib/services/refund';
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
  console.log('🚀 Starting Phase 7 Database Tests: Refund Management\n');

  try {
    const { orders, orderItems, refunds } = await getCollections();

    // Create test order với paymentStatus = 'paid'
    console.log('📦 Creating test order...');
    const testOrder = {
      orderNumber: `TEST-PHASE7-ORDER-${Date.now()}`,
      customerName: 'Phase 7 Test Customer',
      customerEmail: 'phase7test@example.com',
      status: 'completed' as OrderStatus,
      paymentStatus: 'paid' as const,
      paymentMethod: 'vietqr',
      subtotal: 500000,
      shippingTotal: 30000,
      taxTotal: 0,
      discountTotal: 0,
      grandTotal: 530000,
      total: 530000,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const orderResult = await orders.insertOne(testOrder);
    const orderId = orderResult.insertedId.toString();

    // Create order items
    await orderItems.insertMany([
      {
        orderId,
        productId: 'test-product-1',
        productName: 'Test Product 1',
        quantity: 2,
        price: 250000,
        total: 500000,
        createdAt: new Date(),
      },
    ]);

    console.log(`   ✅ Created test order: ${orderId}`);

    // Test 1: Process full refund
    await test('Process full refund', async () => {
      const refund = await processRefund(orderId, 530000, 'Customer requested full refund');

      if (refund.type !== 'full') {
        throw new Error(`Expected full refund, got ${refund.type}`);
      }

      if (refund.amount !== 530000) {
        throw new Error(`Expected amount 530000, got ${refund.amount}`);
      }

      // Check order status updated
      const order = await orders.findOne({ _id: new ObjectId(orderId) });
      if (order?.paymentStatus !== 'refunded') {
        throw new Error(`Expected paymentStatus 'refunded', got '${order?.paymentStatus}'`);
      }

      if (order?.status !== 'refunded') {
        throw new Error(`Expected status 'refunded', got '${order?.status}'`);
      }

      return {
        refundType: refund.type,
        refundAmount: refund.amount,
        orderPaymentStatus: order?.paymentStatus,
        orderStatus: order?.status,
      };
    });

    // Create another test order for partial refund tests
    const testOrder2 = {
      orderNumber: `TEST-PHASE7-ORDER2-${Date.now()}`,
      customerName: 'Phase 7 Test Customer 2',
      customerEmail: 'phase7test2@example.com',
      status: 'completed' as OrderStatus,
      paymentStatus: 'paid' as const,
      paymentMethod: 'cod',
      subtotal: 1000000,
      shippingTotal: 50000,
      taxTotal: 0,
      discountTotal: 0,
      grandTotal: 1050000,
      total: 1050000,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const orderResult2 = await orders.insertOne(testOrder2);
    const orderId2 = orderResult2.insertedId.toString();

    await orderItems.insertMany([
      {
        orderId: orderId2,
        productId: 'test-product-2',
        productName: 'Test Product 2',
        quantity: 1,
        price: 1000000,
        total: 1000000,
        createdAt: new Date(),
      },
    ]);

    // Test 2: Process partial refund
    await test('Process partial refund', async () => {
      const refund = await processRefund(orderId2, 300000, 'Partial refund for damaged item');

      if (refund.type !== 'partial') {
        throw new Error(`Expected partial refund, got ${refund.type}`);
      }

      if (refund.amount !== 300000) {
        throw new Error(`Expected amount 300000, got ${refund.amount}`);
      }

      // Check order status - should still be refunded (payment status)
      const order = await orders.findOne({ _id: new ObjectId(orderId2) });
      if (order?.paymentStatus !== 'refunded') {
        throw new Error(`Expected paymentStatus 'refunded', got '${order?.paymentStatus}'`);
      }

      return {
        refundType: refund.type,
        refundAmount: refund.amount,
        orderPaymentStatus: order?.paymentStatus,
      };
    });

    // Test 3: Process multiple partial refunds
    await test('Process multiple partial refunds', async () => {
      // Second partial refund
      const refund2 = await processRefund(orderId2, 200000, 'Second partial refund');

      if (refund2.type !== 'partial') {
        throw new Error(`Expected partial refund, got ${refund2.type}`);
      }

      // Total refunded should be 500000 (300000 + 200000)
      const totalRefunded = await getTotalRefunded(orderId2);
      if (totalRefunded !== 500000) {
        throw new Error(`Expected total refunded 500000, got ${totalRefunded}`);
      }

      return {
        secondRefundAmount: refund2.amount,
        totalRefunded,
      };
    });

    // Test 4: Get order refunds
    await test('Get order refunds', async () => {
      const refundList = await getOrderRefunds(orderId2);

      if (refundList.length !== 2) {
        throw new Error(`Expected 2 refunds, got ${refundList.length}`);
      }

      // Should be sorted by createdAt desc
      const sorted = [...refundList].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      if (JSON.stringify(refundList) !== JSON.stringify(sorted)) {
        throw new Error('Refunds are not sorted correctly');
      }

      return {
        refundCount: refundList.length,
        refunds: refundList.map((r) => ({
          amount: r.amount,
          type: r.type,
          status: r.status,
        })),
      };
    });

    // Test 5: Refund fails when order not paid
    await test('Refund fails when order not paid', async () => {
      const unpaidOrder = {
        orderNumber: `TEST-PHASE7-UNPAID-${Date.now()}`,
        customerName: 'Test Customer',
        customerEmail: 'test@example.com',
        status: 'pending' as OrderStatus,
        paymentStatus: 'pending' as const,
        paymentMethod: 'cod',
        subtotal: 100000,
        shippingTotal: 30000,
        grandTotal: 130000,
        total: 130000,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const unpaidOrderResult = await orders.insertOne(unpaidOrder);
      const unpaidOrderId = unpaidOrderResult.insertedId.toString();

      try {
        await processRefund(unpaidOrderId, 130000, 'Test refund');
        throw new Error('Should have thrown error for unpaid order');
      } catch (error: any) {
        if (!error.message.includes('payment status must be "paid"')) {
          throw error;
        }
      }

      // Cleanup
      await orders.deleteOne({ _id: unpaidOrderResult.insertedId });

      return {
        errorThrown: true,
      };
    });

    // Test 6: Refund fails when amount exceeds order total
    await test('Refund fails when amount exceeds order total', async () => {
      const testOrder3 = {
        orderNumber: `TEST-PHASE7-ORDER3-${Date.now()}`,
        customerName: 'Test Customer',
        customerEmail: 'test@example.com',
        status: 'completed' as OrderStatus,
        paymentStatus: 'paid' as const,
        paymentMethod: 'vietqr',
        subtotal: 100000,
        shippingTotal: 30000,
        grandTotal: 130000,
        total: 130000,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const orderResult3 = await orders.insertOne(testOrder3);
      const orderId3 = orderResult3.insertedId.toString();

      try {
        await processRefund(orderId3, 200000, 'Test refund');
        throw new Error('Should have thrown error for amount exceeding order total');
      } catch (error: any) {
        if (!error.message.includes('cannot exceed order total')) {
          throw error;
        }
      }

      // Cleanup
      await orders.deleteOne({ _id: orderResult3.insertedId });

      return {
        errorThrown: true,
      };
    });

    // Test 7: Refund fails when amount exceeds remaining refundable
    await test('Refund fails when amount exceeds remaining refundable', async () => {
      // Try to refund more than remaining (1050000 - 500000 = 550000 remaining)
      try {
        await processRefund(orderId2, 600000, 'Test refund');
        throw new Error('Should have thrown error for amount exceeding remaining refundable');
      } catch (error: any) {
        if (!error.message.includes('exceeds remaining refundable amount')) {
          throw error;
        }
      }

      return {
        errorThrown: true,
      };
    });

    // Test 8: Update refund status
    await test('Update refund status', async () => {
      const refundList = await getOrderRefunds(orderId2);
      const firstRefund = refundList[0];

      if (!firstRefund._id) {
        throw new Error('Refund ID not found');
      }

      await updateRefundStatus(firstRefund._id.toString(), 'completed', 'TXN123456');

      const updatedRefund = await refunds.findOne({ _id: new ObjectId(firstRefund._id.toString()) });
      if (updatedRefund?.status !== 'completed') {
        throw new Error(`Expected status 'completed', got '${updatedRefund?.status}'`);
      }

      if (updatedRefund?.transactionId !== 'TXN123456') {
        throw new Error(`Expected transactionId 'TXN123456', got '${updatedRefund?.transactionId}'`);
      }

      return {
        refundId: firstRefund._id.toString(),
        newStatus: updatedRefund?.status,
        transactionId: updatedRefund?.transactionId,
      };
    });

    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    await orderItems.deleteMany({ orderId: { $in: [orderId, orderId2] } });
    await refunds.deleteMany({ orderId: { $in: [orderId, orderId2] } });
    await orders.deleteMany({ _id: { $in: [new ObjectId(orderId), new ObjectId(orderId2)] } });
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
      console.log('🎉 All Phase 7 database tests passed!');
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

