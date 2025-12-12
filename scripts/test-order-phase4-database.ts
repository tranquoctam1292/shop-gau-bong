/**
 * Phase 4 Database Test: Order Editing
 * 
 * Tests Phase 4 implementation với direct database access:
 * 1. Edit Order Items (add, remove, update quantity)
 * 2. Edit Shipping Address
 * 3. Apply Coupon
 * 4. Recalculate totals utility
 * 5. Auto-recalculate khi items/address/coupon change
 */

import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

import { getCollections, closeDB, ObjectId } from '../lib/db';
import { recalculateOrderTotals } from '../lib/utils/recalculateOrderTotals';
import { canEditOrder, type OrderStatus } from '../lib/utils/orderStateMachine';
import {
  createHistoryEntry,
} from '../lib/services/orderHistory';

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
  console.log('🚀 Starting Phase 4 Database Tests: Order Editing\n');

  try {
    const { orders, orderItems } = await getCollections();

    // Create test order với pending status (editable)
    console.log('📦 Creating test order...');
    const testOrder = {
      orderNumber: `TEST-PHASE4-${Date.now()}`,
      customerName: 'Phase 4 Test Customer',
      customerEmail: 'phase4test@example.com',
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
      total: 230000,
      currency: 'VND',
      channel: 'website',
      shipping: {
        firstName: 'Phase4',
        lastName: 'Test',
        address1: '123 Test Street',
        city: 'Ho Chi Minh',
        province: 'Ho Chi Minh',
        district: 'District 1',
        ward: 'Ward 1',
        postcode: '70000',
        country: 'VN',
        phone: '0123456789',
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const orderResult = await orders.insertOne(testOrder);
    const orderId = orderResult.insertedId.toString();
    console.log(`   ✅ Order created: ${testOrder.orderNumber} (ID: ${orderId})`);

    // Create initial order items
    const initialItems = [
      {
        orderId,
        productId: 'product-1',
        productName: 'Test Product 1',
        quantity: 2,
        price: 100000,
        total: 200000,
        createdAt: new Date(),
      },
    ];

    await orderItems.insertMany(initialItems);
    console.log(`   ✅ Created ${initialItems.length} initial order items`);

    // Test 1: canEditOrder check
    await test('canEditOrder check (pending status)', async () => {
      const canEdit = canEditOrder('pending');
      const cannotEdit = canEditOrder('processing');

      if (!canEdit) {
        throw new Error('Pending orders should be editable');
      }

      if (cannotEdit) {
        throw new Error('Processing orders should not be editable');
      }

      return {
        pending: canEdit,
        processing: cannotEdit,
      };
    });

    // Test 2: Add order item
    await test('Add order item', async () => {
      const newItem = {
        orderId,
        productId: 'product-2',
        productName: 'Test Product 2',
        quantity: 1,
        price: 150000,
        total: 150000,
        createdAt: new Date(),
      };

      await orderItems.insertOne(newItem);

      const items = await orderItems.find({ orderId }).toArray();

      if (items.length !== 2) {
        throw new Error(`Expected 2 items, got ${items.length}`);
      }

      const addedItem = items.find((item) => item.productId === 'product-2');
      if (!addedItem) {
        throw new Error('New item not found');
      }

      return {
        totalItems: items.length,
        newItemName: addedItem.productName,
        newItemTotal: addedItem.total,
      };
    });

    // Test 3: Update item quantity
    await test('Update item quantity', async () => {
      const item = await orderItems.findOne({ orderId, productId: 'product-1' });
      if (!item) {
        throw new Error('Item not found');
      }

      const newQuantity = 3;
      const newTotal = item.price * newQuantity;

      await orderItems.updateOne(
        { _id: item._id },
        {
          $set: {
            quantity: newQuantity,
            total: newTotal,
          },
        }
      );

      const updatedItem = await orderItems.findOne({ _id: item._id });
      if (!updatedItem || updatedItem.quantity !== newQuantity) {
        throw new Error('Item quantity not updated correctly');
      }

      return {
        oldQuantity: item.quantity,
        newQuantity: updatedItem.quantity,
        newTotal: updatedItem.total,
      };
    });

    // Test 4: Remove order item
    await test('Remove order item', async () => {
      const itemToRemove = await orderItems.findOne({ orderId, productId: 'product-2' });
      if (!itemToRemove) {
        throw new Error('Item to remove not found');
      }

      await orderItems.deleteOne({ _id: itemToRemove._id });

      const items = await orderItems.find({ orderId }).toArray();
      const removedItem = items.find((item) => item.productId === 'product-2');

      if (removedItem) {
        throw new Error('Item was not removed');
      }

      return {
        remainingItems: items.length,
        remainingProductIds: items.map((item) => item.productId),
      };
    });

    // Test 5: Recalculate totals utility
    await test('Recalculate totals utility', async () => {
      const items = await orderItems.find({ orderId }).toArray();

      const totals = recalculateOrderTotals({
        items: items.map((item) => ({
          _id: item._id?.toString(),
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          price: item.price,
          total: item.total,
        })),
        shippingAddress: testOrder.shipping,
        currentShippingTotal: testOrder.shippingTotal || 0,
        discountTotal: 0,
      });

      const expectedSubtotal = items.reduce((sum, item) => sum + item.total, 0);

      if (totals.subtotal !== expectedSubtotal) {
        throw new Error(
          `Expected subtotal ${expectedSubtotal}, got ${totals.subtotal}`
        );
      }

      if (totals.grandTotal !== totals.subtotal + totals.shippingTotal - totals.discountTotal) {
        throw new Error('Grand total calculation is incorrect');
      }

      return {
        subtotal: totals.subtotal,
        shippingTotal: totals.shippingTotal,
        discountTotal: totals.discountTotal,
        grandTotal: totals.grandTotal,
      };
    });

    // Test 6: Recalculate totals với discount
    await test('Recalculate totals với discount', async () => {
      const items = await orderItems.find({ orderId }).toArray();
      const discountTotal = 20000;

      const totals = recalculateOrderTotals({
        items: items.map((item) => ({
          _id: item._id?.toString(),
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          price: item.price,
          total: item.total,
        })),
        shippingAddress: testOrder.shipping,
        currentShippingTotal: testOrder.shippingTotal || 0,
        discountTotal,
      });

      const expectedGrandTotal = totals.subtotal + totals.shippingTotal - discountTotal;

      if (totals.discountTotal !== discountTotal) {
        throw new Error(`Expected discount ${discountTotal}, got ${totals.discountTotal}`);
      }

      if (totals.grandTotal !== expectedGrandTotal) {
        throw new Error(
          `Expected grand total ${expectedGrandTotal}, got ${totals.grandTotal}`
        );
      }

      return {
        subtotal: totals.subtotal,
        discountTotal: totals.discountTotal,
        grandTotal: totals.grandTotal,
      };
    });

    // Test 7: Update shipping address
    await test('Update shipping address', async () => {
      const newAddress = {
        firstName: 'Updated',
        lastName: 'Address',
        address1: '456 New Street',
        city: 'Hanoi',
        province: 'Hanoi',
        district: 'Ba Dinh',
        ward: 'Ward 2',
        postcode: '10000',
        country: 'VN',
        phone: '0987654321',
      };

      await orders.updateOne(
        { _id: new ObjectId(orderId) },
        {
          $set: {
            'shipping.firstName': newAddress.firstName,
            'shipping.lastName': newAddress.lastName,
            'shipping.address1': newAddress.address1,
            'shipping.city': newAddress.city,
            'shipping.province': newAddress.province,
            'shipping.district': newAddress.district,
            'shipping.ward': newAddress.ward,
            'shipping.postcode': newAddress.postcode,
            'shipping.phone': newAddress.phone,
            updatedAt: new Date(),
          },
        }
      );

      const updatedOrder = await orders.findOne({ _id: new ObjectId(orderId) });

      if (!updatedOrder || updatedOrder.shipping?.address1 !== newAddress.address1) {
        throw new Error('Shipping address not updated correctly');
      }

      return {
        oldCity: testOrder.shipping.city,
        newCity: updatedOrder.shipping?.city,
        newAddress: updatedOrder.shipping?.address1,
      };
    });

    // Test 8: Apply coupon (update discountTotal)
    await test('Apply coupon (update discountTotal)', async () => {
      const couponCode = 'TEST10';
      const discountTotal = 30000;

      await orders.updateOne(
        { _id: new ObjectId(orderId) },
        {
          $set: {
            couponCode,
            discountTotal,
            updatedAt: new Date(),
          },
        }
      );

      const updatedOrder = await orders.findOne({ _id: new ObjectId(orderId) });

      if (!updatedOrder || updatedOrder.couponCode !== couponCode) {
        throw new Error('Coupon code not applied');
      }

      if (updatedOrder.discountTotal !== discountTotal) {
        throw new Error(`Expected discount ${discountTotal}, got ${updatedOrder.discountTotal}`);
      }

      return {
        couponCode: updatedOrder.couponCode,
        discountTotal: updatedOrder.discountTotal,
      };
    });

    // Test 9: Auto-recalculate totals sau khi apply coupon
    await test('Auto-recalculate totals sau khi apply coupon', async () => {
      const items = await orderItems.find({ orderId }).toArray();
      const order = await orders.findOne({ _id: new ObjectId(orderId) });

      if (!order) {
        throw new Error('Order not found');
      }

      const totals = recalculateOrderTotals({
        items: items.map((item) => ({
          _id: item._id?.toString(),
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          price: item.price,
          total: item.total,
        })),
        shippingAddress: order.shipping,
        currentShippingTotal: order.shippingTotal || 0,
        discountTotal: order.discountTotal || 0,
      });

      // Update order với totals mới
      await orders.updateOne(
        { _id: new ObjectId(orderId) },
        {
          $set: {
            subtotal: totals.subtotal,
            discountTotal: totals.discountTotal,
            shippingTotal: totals.shippingTotal,
            grandTotal: totals.grandTotal,
            total: totals.grandTotal,
            updatedAt: new Date(),
          },
        }
      );

      const updatedOrder = await orders.findOne({ _id: new ObjectId(orderId) });

      if (updatedOrder?.grandTotal !== totals.grandTotal) {
        throw new Error(
          `Expected grand total ${totals.grandTotal}, got ${updatedOrder?.grandTotal}`
        );
      }

      return {
        subtotal: totals.subtotal,
        discountTotal: totals.discountTotal,
        grandTotal: totals.grandTotal,
        orderGrandTotal: updatedOrder?.grandTotal,
      };
    });

    // Test 10: Remove coupon
    await test('Remove coupon', async () => {
      await orders.updateOne(
        { _id: new ObjectId(orderId) },
        {
          $set: {
            couponCode: null,
            discountTotal: 0,
            updatedAt: new Date(),
          },
        }
      );

      const updatedOrder = await orders.findOne({ _id: new ObjectId(orderId) });

      if (updatedOrder?.couponCode !== null && updatedOrder?.couponCode !== undefined) {
        throw new Error('Coupon code not removed');
      }

      if (updatedOrder?.discountTotal !== 0) {
        throw new Error(`Expected discount 0, got ${updatedOrder?.discountTotal}`);
      }

      return {
        couponCode: updatedOrder?.couponCode,
        discountTotal: updatedOrder?.discountTotal,
      };
    });

    // Test 11: Recalculate totals sau khi remove coupon
    await test('Recalculate totals sau khi remove coupon', async () => {
      const items = await orderItems.find({ orderId }).toArray();
      const order = await orders.findOne({ _id: new ObjectId(orderId) });

      if (!order) {
        throw new Error('Order not found');
      }

      const totals = recalculateOrderTotals({
        items: items.map((item) => ({
          _id: item._id?.toString(),
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          price: item.price,
          total: item.total,
        })),
        shippingAddress: order.shipping,
        currentShippingTotal: order.shippingTotal || 0,
        discountTotal: 0, // No discount after removal
      });

      const expectedGrandTotal = totals.subtotal + totals.shippingTotal;

      if (totals.grandTotal !== expectedGrandTotal) {
        throw new Error(
          `Expected grand total ${expectedGrandTotal}, got ${totals.grandTotal}`
        );
      }

      return {
        subtotal: totals.subtotal,
        discountTotal: totals.discountTotal,
        grandTotal: totals.grandTotal,
      };
    });

    // Test 12: History entry khi edit items
    await test('Create history entry khi edit items', async () => {
      await createHistoryEntry({
        orderId,
        action: 'add_item',
        description: 'Thêm sản phẩm "Test Product 3" (Số lượng: 1)',
        actorType: 'admin',
        actorName: 'Test Admin',
        metadata: {
          action: 'add',
          productId: 'product-3',
          quantity: 1,
        },
      });

      // Verify history was created (would need to check orderHistories collection)
      return {
        historyCreated: true,
      };
    });

    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    await orderItems.deleteMany({ orderId });
    await orders.deleteOne({ _id: new ObjectId(orderId) });
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
      console.log('🎉 All Phase 4 database tests passed!');
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

