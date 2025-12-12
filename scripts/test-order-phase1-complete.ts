/**
 * Complete Phase 1 Test
 * 
 * Tests Phase 1 implementation với direct database access:
 * - Order State Machine validation
 * - Order History creation
 * - Status transitions
 * - History entries
 * 
 * Usage: npx tsx scripts/test-order-phase1-complete.ts
 */

// Load environment variables from .env.local
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') });

import { getCollections, closeDB, ObjectId } from '../lib/db';
import {
  validateTransition,
  canTransition,
  getValidNextStatuses,
  type OrderStatus,
} from '../lib/utils/orderStateMachine';
import {
  createStatusChangeHistory,
  createPaymentStatusChangeHistory,
  createOrderCreationHistory,
  getOrderHistory,
  type ActorType,
} from '../lib/services/orderHistory';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  details?: any;
}

async function testPhase1Complete() {
  console.log('🧪 Testing Phase 1 Complete Implementation...\n');

  const results: TestResult[] = [];

  try {
    const { orders, orderItems, orderHistories } = await getCollections();

    // Test 1: Create test order
    console.log('📦 Test 1: Create Test Order');
    const testOrder = {
      orderNumber: `TEST-PHASE1-${Date.now()}`,
      customerName: 'Phase 1 Test Customer',
      customerEmail: 'phase1test@example.com',
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
        firstName: 'Phase1',
        lastName: 'Test',
        address1: '123 Test Street',
        city: 'Ho Chi Minh',
        postcode: '70000',
        country: 'VN',
      },
      shipping: {
        firstName: 'Phase1',
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
    results.push({ name: 'Create Order', passed: true, details: { orderId } });

    // Test 2: Create order history entry
    console.log('\n📋 Test 2: Create Order History Entry');
    try {
      await createOrderCreationHistory(
        orderId,
        testOrder.orderNumber,
        testOrder.customerName
      );
      console.log('   ✅ Order creation history entry created');
      results.push({ name: 'Create Order History', passed: true });
    } catch (error: any) {
      console.log(`   ❌ Failed: ${error.message}`);
      results.push({
        name: 'Create Order History',
        passed: false,
        error: error.message,
      });
    }

    // Test 3: Test valid status transitions với history
    console.log('\n✅ Test 3: Valid Status Transitions với History');
    const transitions = [
      { from: 'pending', to: 'confirmed' },
      { from: 'confirmed', to: 'processing' },
      { from: 'processing', to: 'shipping' },
      { from: 'shipping', to: 'completed' },
    ];

    let currentStatus = testOrder.status;
    for (const transition of transitions) {
      // Validate transition
      const can = canTransition(
        currentStatus as OrderStatus,
        transition.to as OrderStatus
      );
      if (!can) {
        console.log(
          `   ❌ ${currentStatus} -> ${transition.to}: Transition not allowed`
        );
        results.push({
          name: `Transition ${currentStatus}->${transition.to}`,
          passed: false,
          error: 'Transition not allowed',
        });
        break;
      }

      // Update order status
      await orders.updateOne(
        { _id: new ObjectId(orderId) },
        {
          $set: {
            status: transition.to,
            updatedAt: new Date(),
          },
        }
      );

      // Create history entry
      await createStatusChangeHistory(
        orderId,
        currentStatus,
        transition.to,
        'test-admin-id',
        'admin',
        'Test Admin'
      );

      console.log(`   ✅ ${currentStatus} -> ${transition.to}: Success`);
      currentStatus = transition.to;
    }
    results.push({ name: 'Valid Transitions với History', passed: true });

    // Test 4: Test invalid transition
    console.log('\n❌ Test 4: Invalid Status Transition');
    try {
      validateTransition('completed' as OrderStatus, 'pending' as OrderStatus);
      console.log('   ❌ Should have thrown error');
      results.push({
        name: 'Invalid Transition Rejection',
        passed: false,
        error: 'Should have thrown error',
      });
    } catch (error: any) {
      console.log(`   ✅ Correctly rejected: ${error.message}`);
      results.push({ name: 'Invalid Transition Rejection', passed: true });
    }

    // Test 5: Test payment status change với history
    console.log('\n💰 Test 5: Payment Status Change với History');
    await orders.updateOne(
      { _id: new ObjectId(orderId) },
      {
        $set: {
          paymentStatus: 'paid',
          paidAt: new Date(),
          updatedAt: new Date(),
        },
      }
    );

    await createPaymentStatusChangeHistory(
      orderId,
      'pending',
      'paid',
      'test-admin-id',
      'admin',
      'Test Admin'
    );
    console.log('   ✅ Payment status changed to paid với history');
    results.push({ name: 'Payment Status Change với History', passed: true });

    // Test 6: Get order history
    console.log('\n📋 Test 6: Get Order History');
    const histories = await getOrderHistory(orderId);
    console.log(`   ✅ Found ${histories.length} history entries:`);
    histories.forEach((h, i) => {
      const date = new Date(h.createdAt).toLocaleString('vi-VN');
      console.log(`      ${i + 1}. [${date}] ${h.action}: ${h.description}`);
      if (h.actorName) {
        console.log(`         Actor: ${h.actorName} (${h.actorType})`);
      }
    });
    results.push({
      name: 'Get Order History',
      passed: true,
      details: { count: histories.length },
    });

    // Test 7: Verify history entries in database
    console.log('\n🔍 Test 7: Verify History Entries in Database');
    const dbHistories = await orderHistories
      .find({ orderId })
      .sort({ createdAt: -1 })
      .toArray();
    console.log(`   ✅ Found ${dbHistories.length} entries in database`);
    
    // Verify all expected entries exist
    const expectedActions = ['create', 'update_status', 'update_payment_status'];
    const foundActions = dbHistories.map((h) => h.action);
    const allFound = expectedActions.every((action) =>
      foundActions.includes(action)
    );
    
    if (allFound) {
      console.log('   ✅ All expected action types found');
      results.push({ name: 'Verify History Entries', passed: true });
    } else {
      console.log('   ⚠️  Some expected actions missing');
      results.push({
        name: 'Verify History Entries',
        passed: false,
        error: 'Missing expected actions',
      });
    }

    // Test 8: Test terminal states
    console.log('\n🚫 Test 8: Terminal States (No Further Transitions)');
    const terminalStatuses: OrderStatus[] = ['cancelled', 'refunded'];
    for (const status of terminalStatuses) {
      const nextStatuses = getValidNextStatuses(status);
      if (nextStatuses.length === 0) {
        console.log(`   ✅ ${status}: Correctly identified as terminal`);
      } else {
        console.log(`   ❌ ${status}: Should be terminal but has transitions`);
        results.push({
          name: `Terminal State ${status}`,
          passed: false,
          error: 'Has valid transitions',
        });
      }
    }
    results.push({ name: 'Terminal States', passed: true });

    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    await orderHistories.deleteMany({ orderId });
    await orderItems.deleteMany({ orderId });
    await orders.deleteOne({ _id: new ObjectId(orderId) });
    console.log('   ✅ Test data cleaned up');

    // Summary
    console.log('\n📊 Test Summary:');
    const passed = results.filter((r) => r.passed).length;
    const total = results.length;
    console.log(`   ✅ Passed: ${passed}/${total}`);
    console.log(`   ❌ Failed: ${total - passed}/${total}\n`);

    results.forEach((result) => {
      console.log(
        `   ${result.passed ? '✅' : '❌'} ${result.name}${result.error ? ` - ${result.error}` : ''}`
      );
    });

    console.log('\n');

    if (passed === total) {
      console.log('🎉 All Phase 1 tests passed!\n');
      await closeDB();
      process.exit(0);
    } else {
      console.log('⚠️  Some tests failed. Check the output above.\n');
      await closeDB();
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Test execution failed!\n');

    if (error instanceof Error) {
      console.error('Error details:');
      console.error(`   Message: ${error.message}`);
      console.error(`   Stack: ${error.stack}`);
    } else {
      console.error('Unknown error:', error);
    }

    await closeDB();
    process.exit(1);
  }
}

// Run tests
testPhase1Complete();

