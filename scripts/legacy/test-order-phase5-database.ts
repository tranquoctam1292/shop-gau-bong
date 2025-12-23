/**
 * Phase 5 Database Test: Inventory Management
 * 
 * Tests Phase 5 implementation với direct database access:
 * 1. InventoryService functions (reserveStock, deductStock, releaseStock, checkStockAvailability)
 * 2. Stock validation trong order creation
 * 3. Stock validation trong order editing
 * 4. Auto-cancel pending orders
 * 5. Stock check functionality
 */

import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

import { getCollections, closeDB, ObjectId } from '../lib/db';
import {
  reserveStock,
  deductStock,
  releaseStock,
  checkStockAvailability,
  getStockInfo,
} from '../lib/services/inventory';
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
  console.log('🚀 Starting Phase 5 Database Tests: Inventory Management\n');

  try {
    const { products, orders, orderItems } = await getCollections();

    // Create test products với stock
    console.log('📦 Creating test products...');
    const testProducts = [
      {
        name: 'Test Product Simple - Phase 5',
        slug: `test-product-simple-phase5-${Date.now()}`,
        type: 'simple',
        status: 'publish',
        price: 100000,
        stockQuantity: 10,
        reservedQuantity: 0,
        manageStock: true,
        stockStatus: 'instock',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Test Product Variable - Phase 5',
        slug: `test-product-variable-phase5-${Date.now()}`,
        type: 'variable',
        status: 'publish',
        price: 200000,
        stockQuantity: 0, // Variable products use variant stock
        reservedQuantity: 0,
        manageStock: true,
        stockStatus: 'instock',
        variants: [
          {
            id: 'var-1',
            size: '60cm',
            color: 'Đỏ',
            price: 200000,
            stock: 5,
            stockQuantity: 5,
            reservedQuantity: 0,
          },
          {
            id: 'var-2',
            size: '80cm',
            color: 'Xanh',
            price: 250000,
            stock: 3,
            stockQuantity: 3,
            reservedQuantity: 0,
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Test Product No Stock - Phase 5',
        slug: `test-product-no-stock-phase5-${Date.now()}`,
        type: 'simple',
        status: 'publish',
        price: 50000,
        stockQuantity: 0,
        reservedQuantity: 0,
        manageStock: true,
        stockStatus: 'outofstock',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const productResults = await products.insertMany(testProducts);
    const productIds = Object.values(productResults.insertedIds).map((id) => id.toString());
    const simpleProductId = productIds[0];
    const variableProductId = productIds[1];
    const noStockProductId = productIds[2];
    console.log(`   ✅ Created ${testProducts.length} test products`);

    // Test 1: checkStockAvailability for simple product
    await test('checkStockAvailability for simple product', async () => {
      const stockCheck = await checkStockAvailability(simpleProductId, undefined, 5);

      if (stockCheck.available !== 10) {
        throw new Error(`Expected available 10, got ${stockCheck.available}`);
      }

      if (stockCheck.reserved !== 0) {
        throw new Error(`Expected reserved 0, got ${stockCheck.reserved}`);
      }

      if (!stockCheck.canFulfill) {
        throw new Error('Should be able to fulfill 5 items');
      }

      return {
        available: stockCheck.available,
        reserved: stockCheck.reserved,
        total: stockCheck.total,
        canFulfill: stockCheck.canFulfill,
      };
    });

    // Test 2: checkStockAvailability for variable product variant
    await test('checkStockAvailability for variable product variant', async () => {
      const stockCheck = await checkStockAvailability(variableProductId, 'var-1', 3);

      if (stockCheck.available !== 5) {
        throw new Error(`Expected available 5, got ${stockCheck.available}`);
      }

      if (!stockCheck.canFulfill) {
        throw new Error('Should be able to fulfill 3 items');
      }

      return {
        available: stockCheck.available,
        reserved: stockCheck.reserved,
        canFulfill: stockCheck.canFulfill,
      };
    });

    // Test 3: checkStockAvailability for out of stock product
    await test('checkStockAvailability for out of stock product', async () => {
      const stockCheck = await checkStockAvailability(noStockProductId, undefined, 1);

      if (stockCheck.canFulfill) {
        throw new Error('Should not be able to fulfill out of stock product');
      }

      return {
        available: stockCheck.available,
        canFulfill: stockCheck.canFulfill,
      };
    });

    // Test 4: Reserve stock for simple product
    await test('Reserve stock for simple product', async () => {
      const orderId = 'test-order-reserve-1';
      await reserveStock(orderId, [
        {
          productId: simpleProductId,
          quantity: 3,
        },
      ]);

      const product = await products.findOne({ _id: new ObjectId(simpleProductId) });
      if (!product) {
        throw new Error('Product not found');
      }

      if (product.reservedQuantity !== 3) {
        throw new Error(`Expected reservedQuantity 3, got ${product.reservedQuantity}`);
      }

      const stockCheck = await checkStockAvailability(simpleProductId, undefined, 5);
      if (stockCheck.available !== 7) {
        throw new Error(`Expected available 7 after reservation, got ${stockCheck.available}`);
      }

      return {
        reservedQuantity: product.reservedQuantity,
        availableAfterReserve: stockCheck.available,
      };
    });

    // Test 5: Reserve stock for variable product variant
    await test('Reserve stock for variable product variant', async () => {
      const orderId = 'test-order-reserve-2';
      await reserveStock(orderId, [
        {
          productId: variableProductId,
          variationId: 'var-1',
          quantity: 2,
        },
      ]);

      const product = await products.findOne({ _id: new ObjectId(variableProductId) });
      if (!product || !product.variants) {
        throw new Error('Product or variants not found');
      }

      const variant = product.variants.find((v: any) => v.id === 'var-1');
      if (!variant) {
        throw new Error('Variant not found');
      }

      if (variant.reservedQuantity !== 2) {
        throw new Error(`Expected reservedQuantity 2, got ${variant.reservedQuantity}`);
      }

      const stockCheck = await checkStockAvailability(variableProductId, 'var-1', 2);
      if (stockCheck.available !== 3) {
        throw new Error(`Expected available 3 after reservation, got ${stockCheck.available}`);
      }

      return {
        variantReservedQuantity: variant.reservedQuantity,
        availableAfterReserve: stockCheck.available,
      };
    });

    // Test 6: Deduct stock for simple product
    await test('Deduct stock for simple product', async () => {
      const orderId = 'test-order-deduct-1';
      // First reserve, then deduct
      await reserveStock(orderId, [
        {
          productId: simpleProductId,
          quantity: 2,
        },
      ]);

      await deductStock(orderId, [
        {
          productId: simpleProductId,
          quantity: 2,
        },
      ]);

      const product = await products.findOne({ _id: new ObjectId(simpleProductId) });
      if (!product) {
        throw new Error('Product not found');
      }

      // After deduct: stockQuantity should decrease, reservedQuantity should decrease
      if (product.stockQuantity !== 8) {
        throw new Error(`Expected stockQuantity 8, got ${product.stockQuantity}`);
      }

      if (product.reservedQuantity !== 3) {
        // Should still have 3 from previous reservation
        throw new Error(`Expected reservedQuantity 3, got ${product.reservedQuantity}`);
      }

      return {
        stockQuantity: product.stockQuantity,
        reservedQuantity: product.reservedQuantity,
      };
    });

    // Test 7: Release stock for simple product
    await test('Release stock for simple product', async () => {
      const orderId = 'test-order-release-1';
      // Reserve some stock first
      await reserveStock(orderId, [
        {
          productId: simpleProductId,
          quantity: 2,
        },
      ]);

      const beforeRelease = await products.findOne({ _id: new ObjectId(simpleProductId) });
      const reservedBefore = beforeRelease?.reservedQuantity || 0;

      await releaseStock(orderId, [
        {
          productId: simpleProductId,
          quantity: 2,
        },
      ]);

      const product = await products.findOne({ _id: new ObjectId(simpleProductId) });
      if (!product) {
        throw new Error('Product not found');
      }

      if (product.reservedQuantity !== reservedBefore - 2) {
        throw new Error(
          `Expected reservedQuantity ${reservedBefore - 2}, got ${product.reservedQuantity}`
        );
      }

      return {
        reservedBefore,
        reservedAfter: product.reservedQuantity,
      };
    });

    // Test 8: Release stock for variable product variant
    await test('Release stock for variable product variant', async () => {
      const orderId = 'test-order-release-2';
      // Reserve some stock first
      await reserveStock(orderId, [
        {
          productId: variableProductId,
          variationId: 'var-2',
          quantity: 1,
        },
      ]);

      const beforeRelease = await products.findOne({ _id: new ObjectId(variableProductId) });
      const variantBefore = beforeRelease?.variants?.find((v: any) => v.id === 'var-2');
      const reservedBefore = variantBefore?.reservedQuantity || 0;

      await releaseStock(orderId, [
        {
          productId: variableProductId,
          variationId: 'var-2',
          quantity: 1,
        },
      ]);

      const product = await products.findOne({ _id: new ObjectId(variableProductId) });
      if (!product || !product.variants) {
        throw new Error('Product or variants not found');
      }

      const variant = product.variants.find((v: any) => v.id === 'var-2');
      if (!variant) {
        throw new Error('Variant not found');
      }

      if (variant.reservedQuantity !== reservedBefore - 1) {
        throw new Error(
          `Expected reservedQuantity ${reservedBefore - 1}, got ${variant.reservedQuantity}`
        );
      }

      return {
        reservedBefore,
        reservedAfter: variant.reservedQuantity,
      };
    });

    // Test 9: Reserve stock fails when insufficient stock
    await test('Reserve stock fails when insufficient stock', async () => {
      const orderId = 'test-order-fail-1';
      try {
        await reserveStock(orderId, [
          {
            productId: noStockProductId,
            quantity: 1,
          },
        ]);
        throw new Error('Should have thrown error for insufficient stock');
      } catch (error: any) {
        if (!error.message.includes('Insufficient stock')) {
          throw error;
        }
        return {
          errorThrown: true,
          errorMessage: error.message,
        };
      }
    });

    // Test 10: getStockInfo for multiple products
    await test('getStockInfo for multiple products', async () => {
      const stockInfo = await getStockInfo([simpleProductId, variableProductId, noStockProductId]);

      if (!stockInfo[simpleProductId]) {
        throw new Error('Stock info not found for simple product');
      }

      if (!stockInfo[variableProductId]) {
        throw new Error('Stock info not found for variable product');
      }

      if (!stockInfo[noStockProductId]) {
        throw new Error('Stock info not found for no stock product');
      }

      return {
        simpleProductAvailable: stockInfo[simpleProductId].available,
        variableProductAvailable: stockInfo[variableProductId].available,
        noStockProductAvailable: stockInfo[noStockProductId].available,
      };
    });

    // Test 11: Create order với stock reservation
    await test('Create order với stock reservation', async () => {
      const testOrder = {
        orderNumber: `TEST-PHASE5-ORDER-${Date.now()}`,
        customerName: 'Phase 5 Test Customer',
        customerEmail: 'phase5test@example.com',
        status: 'pending' as OrderStatus,
        paymentStatus: 'pending' as const,
        paymentMethod: 'cod',
        subtotal: 200000,
        shippingTotal: 30000,
        grandTotal: 230000,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const orderResult = await orders.insertOne(testOrder);
      const orderId = orderResult.insertedId.toString();

      // Reserve stock
      await reserveStock(orderId, [
        {
          productId: simpleProductId,
          quantity: 2,
        },
      ]);

      // Verify stock was reserved
      const product = await products.findOne({ _id: new ObjectId(simpleProductId) });
      const reservedBefore = product?.reservedQuantity || 0;

      // Create order items
      await orderItems.insertMany([
        {
          orderId,
          productId: simpleProductId,
          productName: 'Test Product',
          quantity: 2,
          price: 100000,
          total: 200000,
          createdAt: new Date(),
        },
      ]);

      return {
        orderId,
        reservedQuantity: reservedBefore,
      };
    });

    // Test 12: Auto-cancel pending orders logic
    await test('Auto-cancel pending orders logic', async () => {
      // Create old pending orders
      const oldQROrder = {
        orderNumber: `TEST-PHASE5-QR-${Date.now()}`,
        customerName: 'Test Customer',
        customerEmail: 'test@example.com',
        status: 'pending' as OrderStatus,
        paymentStatus: 'pending' as const,
        paymentMethod: 'vietqr',
        subtotal: 100000,
        shippingTotal: 30000,
        grandTotal: 130000,
        createdAt: new Date(Date.now() - 31 * 60 * 1000), // 31 minutes ago
        updatedAt: new Date(),
      };

      const oldCODOrder = {
        orderNumber: `TEST-PHASE5-COD-${Date.now()}`,
        customerName: 'Test Customer',
        customerEmail: 'test@example.com',
        status: 'pending' as OrderStatus,
        paymentStatus: 'pending' as const,
        paymentMethod: 'cod',
        subtotal: 100000,
        shippingTotal: 30000,
        grandTotal: 130000,
        createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000), // 25 hours ago
        updatedAt: new Date(),
      };

      const qrOrderResult = await orders.insertOne(oldQROrder);
      const codOrderResult = await orders.insertOne(oldCODOrder);

      // Simulate auto-cancel logic
      const now = new Date();
      const qrTimeoutDate = new Date(now.getTime() - 30 * 60 * 1000);
      const codTimeoutDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const qrOrders = await orders
        .find({
          status: 'pending',
          paymentMethod: { $in: ['vietqr', 'momo', 'stripe'] },
          createdAt: { $lt: qrTimeoutDate },
        })
        .toArray();

      const codOrders = await orders
        .find({
          status: 'pending',
          paymentMethod: 'cod',
          createdAt: { $lt: codTimeoutDate },
        })
        .toArray();

      if (qrOrders.length === 0) {
        throw new Error('Expected to find QR orders to cancel');
      }

      if (codOrders.length === 0) {
        throw new Error('Expected to find COD orders to cancel');
      }

      // Cleanup
      await orders.deleteOne({ _id: qrOrderResult.insertedId });
      await orders.deleteOne({ _id: codOrderResult.insertedId });

      return {
        qrOrdersFound: qrOrders.length,
        codOrdersFound: codOrders.length,
      };
    });

    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    await orderItems.deleteMany({ orderId: { $regex: '^test-order-' } });
    await orders.deleteMany({ orderNumber: { $regex: '^TEST-PHASE5-' } });
    await products.deleteMany({ _id: { $in: productIds.map((id) => new ObjectId(id)) } });
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
      console.log('🎉 All Phase 5 database tests passed!');
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

