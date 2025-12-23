/**
 * Test Inventory Transactions
 * 
 * Comprehensive test script to verify MongoDB transactions work correctly
 * for inventory operations including race condition handling.
 * 
 * Usage: npm run test:inventory-transactions
 */

import { getCollections, ObjectId } from '@/lib/db';
import { reserveStock, deductStock, checkStockAvailability } from '@/lib/services/inventory';
import { withTransaction, getCollectionsWithSession, checkTransactionSupport } from '@/lib/utils/transactionHelper';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  details?: string;
}

const results: TestResult[] = [];

function logTest(name: string, passed: boolean, error?: string, details?: string) {
  results.push({ name, passed, error, details });
  const icon = passed ? '✅' : '❌';
  console.log(`${icon} ${name}`);
  if (details) {
    console.log(`   ${details}`);
  }
  if (error) {
    console.log(`   Error: ${error}`);
  }
}

/**
 * Test 1: Verify transaction support
 */
async function testTransactionSupport(): Promise<boolean> {
  try {
    const supported = await checkTransactionSupport();
    logTest(
      'Transaction Support Check',
      supported,
      undefined,
      supported
        ? 'MongoDB cluster supports transactions (replica set detected)'
        : 'MongoDB cluster does NOT support transactions (standalone mode)'
    );
    return supported;
  } catch (error) {
    logTest('Transaction Support Check', false, error instanceof Error ? error.message : String(error));
    return false;
  }
}

/**
 * Test 2: Test reserveStock with transaction
 */
async function testReserveStock(): Promise<boolean> {
  try {
    const { products } = await getCollections();

    // Find a product with stock (check productDataMetaBox.stockQuantity)
    const product = await products.findOne({
      status: 'publish',
      'productDataMetaBox.stockQuantity': { $exists: true, $gte: 5 },
    });

    if (!product) {
      logTest('Reserve Stock Test', false, undefined, 'No product with sufficient stock found (need >= 5)');
      return false;
    }

    const productId = product._id.toString();
    // Stock is stored in productDataMetaBox.stockQuantity
    const initialStock = ((product as any).productDataMetaBox?.stockQuantity as number) || 0;
    const initialReserved = (product.reservedQuantity as number) || 0;

    if (initialStock < 5) {
      logTest('Reserve Stock Test', false, undefined, 'Product does not have enough stock for test');
      return false;
    }

    // Reserve stock
    await reserveStock('test-order-1', [
      {
        productId,
        quantity: 2,
      },
    ]);

    // Verify stock was reserved
    const updatedProduct = await products.findOne({ _id: product._id });
    const newReserved = (updatedProduct?.reservedQuantity as number) || 0;

    const passed = newReserved === initialReserved + 2;
    logTest(
      'Reserve Stock Test',
      passed,
      undefined,
      passed
        ? `Stock reserved: ${initialReserved} → ${newReserved} (+2)`
        : `Stock reservation failed: Expected ${initialReserved + 2}, got ${newReserved}`
    );

    // Cleanup: Release reserved stock
    if (passed) {
      await products.updateOne(
        { _id: product._id },
        { $inc: { reservedQuantity: -2 } }
      );
    }

    return passed;
  } catch (error) {
    logTest('Reserve Stock Test', false, error instanceof Error ? error.message : String(error));
    return false;
  }
}

/**
 * Test 3: Test reserveStock rollback on error
 */
async function testReserveStockRollback(): Promise<boolean> {
  try {
    const { products } = await getCollections();

    // Find a product with stock
    const product = await products.findOne({
      status: 'publish',
      'productDataMetaBox.stockQuantity': { $exists: true, $gte: 1 },
    });

    if (!product) {
      logTest('Reserve Stock Rollback Test', false, undefined, 'No product with stock found');
      return false;
    }

    const productId = product._id.toString();
    const initialReserved = (product.reservedQuantity as number) || 0;

    // Try to reserve more stock than available (should fail and rollback)
    try {
      await reserveStock('test-order-2', [
        {
          productId,
          quantity: 999999, // More than available
        },
      ]);

      // Should not reach here
      logTest('Reserve Stock Rollback Test', false, undefined, 'Expected error but reservation succeeded');
      return false;
    } catch (error) {
      // Expected error
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Verify stock was NOT reserved (rollback worked)
      const updatedProduct = await products.findOne({ _id: product._id });
      const newReserved = (updatedProduct?.reservedQuantity as number) || 0;

      const passed = newReserved === initialReserved;
      logTest(
        'Reserve Stock Rollback Test',
        passed,
        undefined,
        passed
          ? `Rollback successful: Reserved quantity unchanged (${initialReserved})`
          : `Rollback failed: Reserved quantity changed from ${initialReserved} to ${newReserved}`
      );

      return passed;
    }
  } catch (error) {
    logTest('Reserve Stock Rollback Test', false, error instanceof Error ? error.message : String(error));
    return false;
  }
}

/**
 * Test 4: Test concurrent orders (race condition)
 */
async function testConcurrentOrders(): Promise<boolean> {
  try {
    const { products } = await getCollections();

    // Find a product with limited stock
    const product = await products.findOne({
      status: 'publish',
      'productDataMetaBox.stockQuantity': { $exists: true, $gte: 5 },
    });

    if (!product) {
      logTest('Concurrent Orders Test', false, undefined, 'No suitable product found for concurrent test');
      return false;
    }

    const productId = product._id.toString();
    // Stock is stored in productDataMetaBox.stockQuantity
    const initialStock = ((product as any).productDataMetaBox?.stockQuantity as number) || 0;
    const initialReserved = (product.reservedQuantity as number) || 0;
    const available = initialStock - initialReserved;

    if (available < 5) {
      logTest('Concurrent Orders Test', false, undefined, 'Not enough available stock for concurrent test');
      return false;
    }

    // Try to reserve stock for 3 concurrent orders (each wants 2 items)
    // Total: 6 items, but only 5 available - one should fail
    const promises = [
      reserveStock('concurrent-order-1', [{ productId, quantity: 2 }]),
      reserveStock('concurrent-order-2', [{ productId, quantity: 2 }]),
      reserveStock('concurrent-order-3', [{ productId, quantity: 2 }]),
    ];

    const results = await Promise.allSettled(promises);
    const succeeded = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    // Verify final stock state
    const finalProduct = await products.findOne({ _id: product._id });
    const finalReserved = (finalProduct?.reservedQuantity as number) || 0;
    const expectedReserved = initialReserved + (succeeded * 2);

    const passed = finalReserved === expectedReserved && failed > 0;
    logTest(
      'Concurrent Orders Test',
      passed,
      undefined,
      `Concurrent orders: ${succeeded} succeeded, ${failed} failed. ` +
        `Reserved: ${initialReserved} → ${finalReserved} (expected: ${expectedReserved})`
    );

    // Cleanup: Release all reserved stock
    if (passed) {
      await products.updateOne(
        { _id: product._id },
        { $inc: { reservedQuantity: -finalReserved + initialReserved } }
      );
    }

    return passed;
  } catch (error) {
    logTest('Concurrent Orders Test', false, error instanceof Error ? error.message : String(error));
    return false;
  }
}

/**
 * Test 5: Test order creation with transaction
 */
async function testOrderCreationTransaction(): Promise<boolean> {
  try {
    const { products, orders, orderItems } = await getCollections();

    // Find a product with stock
    const product = await products.findOne({
      status: 'publish',
      'productDataMetaBox.stockQuantity': { $exists: true, $gte: 3 },
    });

    if (!product) {
      logTest('Order Creation Transaction Test', false, undefined, 'No suitable product found');
      return false;
    }

    const productId = product._id.toString();
    const initialReserved = (product.reservedQuantity as number) || 0;

    // Simulate order creation with transaction
    let orderId: string | null = null;

    try {
      await withTransaction(async (session) => {
        const collections = await getCollectionsWithSession(session);
        const { orders: ordersCollection, orderItems: orderItemsCollection, products: productsCollection } = collections;

        // Create order
        const orderResult = await ordersCollection.insertOne(
          {
            orderNumber: `TEST-${Date.now()}`,
            customerName: 'Test Customer',
            customerEmail: 'test@example.com',
            status: 'pending',
            subtotal: 100000,
            shippingTotal: 30000,
            grandTotal: 130000,
            currency: 'VND',
            version: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          { session }
        );

        orderId = orderResult.insertedId.toString();

        // Create order item
        await orderItemsCollection.insertOne(
          {
            orderId,
            productId,
            productName: 'Test Product',
            quantity: 2,
            price: 50000,
            total: 100000,
            createdAt: new Date(),
          },
          { session }
        );

        // Reserve stock
        const { reserveStockInternal } = await import('@/lib/services/inventory-internal');
        await reserveStockInternal(
          productsCollection,
          [{ productId, quantity: 2 }],
          session
        );
      });

      // Verify order was created
      const order = await orders.findOne({ _id: new ObjectId(orderId!) });
      const items = await orderItems.find({ orderId }).toArray();
      const updatedProduct = await products.findOne({ _id: product._id });
      const newReserved = (updatedProduct?.reservedQuantity as number) || 0;

      const passed =
        order !== null && items.length === 1 && newReserved === initialReserved + 2;

      logTest(
        'Order Creation Transaction Test',
        passed,
        undefined,
        passed
          ? `Order created with item and stock reserved: Reserved ${initialReserved} → ${newReserved}`
          : `Failed: Order=${!!order}, Items=${items.length}, Reserved=${newReserved}`
      );

      // Cleanup
      if (orderId) {
        await orderItems.deleteMany({ orderId });
        await orders.deleteOne({ _id: new ObjectId(orderId) });
        await products.updateOne({ _id: product._id }, { $inc: { reservedQuantity: -2 } });
      }

      return passed;
    } catch (error) {
      // Verify rollback worked (no order, no stock reserved)
      const order = orderId ? await orders.findOne({ _id: new ObjectId(orderId) }) : null;
      const items = orderId ? await orderItems.find({ orderId }).toArray() : [];
      const updatedProduct = await products.findOne({ _id: product._id });
      const newReserved = (updatedProduct?.reservedQuantity as number) || 0;

      const rollbackWorked = order === null && items.length === 0 && newReserved === initialReserved;

      logTest(
        'Order Creation Transaction Test (Rollback)',
        rollbackWorked,
        error instanceof Error ? error.message : String(error),
        rollbackWorked
          ? 'Transaction rolled back correctly: No order, no items, stock unchanged'
          : `Rollback may have failed: Order=${!!order}, Items=${items.length}, Reserved=${newReserved}`
      );

      return rollbackWorked;
    }
  } catch (error) {
    logTest('Order Creation Transaction Test', false, error instanceof Error ? error.message : String(error));
    return false;
  }
}

/**
 * Test 6: Test batch operations performance
 */
async function testBatchOperations(): Promise<boolean> {
  try {
    const { products } = await getCollections();

    // Find multiple products with stock
    const productList = await products
      .find({
        status: 'publish',
        'productDataMetaBox.stockQuantity': { $exists: true, $gte: 5 },
      })
      .limit(5)
      .toArray();

    if (productList.length < 3) {
      logTest('Batch Operations Test', false, undefined, 'Not enough products found for batch test');
      return false;
    }

    // Reserve 1 item per product to avoid stock issues
    const items = productList.slice(0, 3).map((p) => ({
      productId: p._id.toString(),
      quantity: 1,
    }));

    const startTime = Date.now();
    await reserveStock('test-batch-order', items);
    const endTime = Date.now();
    const duration = endTime - startTime;

    // Verify all products were updated
    // Get initial reserved quantities before reservation
    const initialReserved = new Map<string, number>();
    for (const p of productList.slice(0, 3)) {
      initialReserved.set(p._id.toString(), (p.reservedQuantity as number) || 0);
    }

    const updatedProducts = await products
      .find({ _id: { $in: productList.slice(0, 3).map((p) => p._id) } })
      .toArray();

    const allUpdated = updatedProducts.every((p) => {
      const productId = p._id.toString();
      const initial = initialReserved.get(productId) || 0;
      const reserved = (p.reservedQuantity as number) || 0;
      // Check if reserved quantity increased by at least 1 (the quantity we reserved)
      return reserved >= initial + 1;
    });

    const passed = allUpdated && duration < 1000; // Should be fast with batch operations
    logTest(
      'Batch Operations Test',
      passed,
      undefined,
      `Batch reserved stock for ${items.length} products in ${duration}ms. All updated: ${allUpdated}`
    );

    // Cleanup
    for (const item of items) {
      await products.updateOne({ _id: new ObjectId(item.productId) }, { $inc: { reservedQuantity: -item.quantity } });
    }

    return passed;
  } catch (error) {
    logTest('Batch Operations Test', false, error instanceof Error ? error.message : String(error));
    return false;
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('🧪 Starting Inventory Transactions Tests...\n');

  // Test 1: Transaction support
  const supportsTransactions = await testTransactionSupport();
  console.log('');

  if (!supportsTransactions) {
    console.log('⚠️  WARNING: MongoDB does not support transactions.');
    console.log('   Some tests may fail or behave differently.\n');
  }

  // Test 2: Basic reserve stock
  await testReserveStock();
  console.log('');

  // Test 3: Rollback on error
  await testReserveStockRollback();
  console.log('');

  // Test 4: Concurrent orders
  await testConcurrentOrders();
  console.log('');

  // Test 5: Order creation with transaction
  await testOrderCreationTransaction();
  console.log('');

  // Test 6: Batch operations
  await testBatchOperations();
  console.log('');

  // Summary
  const passed = results.filter((r) => r.passed).length;
  const total = results.length;
  const percentage = Math.round((passed / total) * 100);

  console.log('📊 Test Summary:');
  console.log(`   Passed: ${passed}/${total} (${percentage}%)`);
  console.log('');

  if (passed === total) {
    console.log('✅ All tests passed!');
    process.exit(0);
  } else {
    console.log('❌ Some tests failed. See details above.');
    process.exit(1);
  }
}

// Run tests
if (require.main === module) {
  runTests().catch((error) => {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
  });
}

export { runTests };

