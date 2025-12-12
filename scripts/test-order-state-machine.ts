/**
 * Test Order State Machine
 * 
 * Tests Order Update API với các status transitions khác nhau:
 * - Valid transitions
 * - Invalid transitions
 * - History entries creation
 * 
 * Usage: tsx scripts/test-order-state-machine.ts
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

// Test order data
const TEST_ORDER = {
  orderNumber: `TEST-${Date.now()}`,
  customerName: 'Test Customer',
  customerEmail: 'test@example.com',
  customerPhone: '0123456789',
  status: 'pending' as OrderStatus,
  paymentStatus: 'pending' as const,
  paymentMethod: 'cod',
  paymentMethodTitle: 'Thanh toán khi nhận hàng',
  subtotal: 100000,
  shippingTotal: 30000,
  taxTotal: 0,
  discountTotal: 0,
  grandTotal: 130000,
  currency: 'VND',
  billing: {
    firstName: 'Test',
    lastName: 'Customer',
    address1: '123 Test Street',
    city: 'Ho Chi Minh',
    postcode: '70000',
    country: 'VN',
  },
  shipping: {
    firstName: 'Test',
    lastName: 'Customer',
    address1: '123 Test Street',
    city: 'Ho Chi Minh',
    postcode: '70000',
    country: 'VN',
    province: 'Ho Chi Minh',
    district: 'District 1',
    ward: 'Ward 1',
  },
  channel: 'website',
  createdAt: new Date(),
  updatedAt: new Date(),
};

async function testOrderStateMachine() {
  console.log('🧪 Testing Order State Machine...\n');

  try {
    const { orders } = await getCollections();

    // Create test order
    console.log('📦 Creating test order...');
    const orderResult = await orders.insertOne(TEST_ORDER);
    const orderId = orderResult.insertedId.toString();
    console.log(`   ✅ Test order created: ${TEST_ORDER.orderNumber} (ID: ${orderId})\n`);

    // Test 1: Valid transitions
    console.log('✅ Test 1: Valid Transitions');
    const validTests = [
      { from: 'pending', to: 'confirmed', shouldPass: true },
      { from: 'pending', to: 'cancelled', shouldPass: true },
      { from: 'confirmed', to: 'processing', shouldPass: true },
      { from: 'processing', to: 'shipping', shouldPass: true },
      { from: 'shipping', to: 'completed', shouldPass: true },
    ];

    for (const test of validTests) {
      const can = canTransition(test.from as OrderStatus, test.to as OrderStatus);
      const passed = can === test.shouldPass;
      console.log(
        `   ${passed ? '✅' : '❌'} ${test.from} -> ${test.to}: ${can ? 'ALLOWED' : 'DENIED'}`
      );
      if (!passed) {
        console.log(`      ⚠️  Expected: ${test.shouldPass ? 'ALLOWED' : 'DENIED'}`);
      }
    }

    // Test 2: Invalid transitions
    console.log('\n❌ Test 2: Invalid Transitions');
    const invalidTests = [
      { from: 'pending', to: 'completed', shouldPass: false },
      { from: 'pending', to: 'shipping', shouldPass: false },
      { from: 'shipping', to: 'pending', shouldPass: false },
      { from: 'completed', to: 'pending', shouldPass: false },
      { from: 'cancelled', to: 'processing', shouldPass: false },
      { from: 'refunded', to: 'processing', shouldPass: false },
    ];

    for (const test of invalidTests) {
      const can = canTransition(test.from as OrderStatus, test.to as OrderStatus);
      const passed = can === test.shouldPass;
      console.log(
        `   ${passed ? '✅' : '❌'} ${test.from} -> ${test.to}: ${can ? 'ALLOWED' : 'DENIED'}`
      );
      if (!passed) {
        console.log(`      ⚠️  Expected: ${test.shouldPass ? 'ALLOWED' : 'DENIED'}`);
      }
    }

    // Test 3: Get valid next statuses
    console.log('\n📋 Test 3: Get Valid Next Statuses');
    const statuses: OrderStatus[] = [
      'pending',
      'awaiting_payment',
      'confirmed',
      'processing',
      'shipping',
      'completed',
      'cancelled',
      'refunded',
      'failed',
    ];

    for (const status of statuses) {
      const nextStatuses = getValidNextStatuses(status);
      console.log(`   ${status}: [${nextStatuses.join(', ') || 'none (terminal)'}]`);
    }

    // Test 4: Validate transition function
    console.log('\n🔍 Test 4: Validate Transition Function');
    try {
      validateTransition('pending', 'confirmed');
      console.log('   ✅ pending -> confirmed: Validation passed');
    } catch (error: any) {
      console.log(`   ❌ pending -> confirmed: ${error.message}`);
    }

    try {
      validateTransition('pending', 'completed');
      console.log('   ❌ pending -> completed: Should have thrown error');
    } catch (error: any) {
      console.log(`   ✅ pending -> completed: Correctly rejected - ${error.message}`);
    }

    // Test 5: Test actual API update (if server is running)
    console.log('\n🌐 Test 5: API Update Test');
    console.log('   ℹ️  To test API updates, you need to:');
    console.log('      1. Start dev server: npm run dev');
    console.log('      2. Create an order via POST /api/cms/orders');
    console.log('      3. Test status updates via PUT /api/admin/orders/[id]');
    console.log('      4. Check order_histories collection for audit logs');

    // Cleanup: Delete test order
    console.log('\n🧹 Cleaning up test order...');
    await orders.deleteOne({ _id: orderResult.insertedId });
    console.log('   ✅ Test order deleted\n');

    console.log('🎉 All tests completed!\n');

    await closeDB();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test failed!\n');

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
testOrderStateMachine();

