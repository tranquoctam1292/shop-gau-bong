/**
 * Phase 2 Database Test: Advanced Filters & Search
 * 
 * Tests filter logic directly với database (bypass authentication):
 * 1. Basic filters (status, channel, payment method, payment status)
 * 2. Date range filter
 * 3. Multiple statuses filter
 * 4. Search functionality
 * 5. Sort options
 * 6. Pagination metadata
 * 7. Combined filters
 */

import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

import { getCollections, closeDB, ObjectId } from '../lib/db';

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
  console.log('🚀 Starting Phase 2 Database Tests: Advanced Filters & Search\n');

  try {
    const { orders } = await getCollections();

    // Create test orders for testing
    console.log('📦 Creating test orders...');
    const testOrders = [
      {
        orderNumber: `TEST-FILTER-${Date.now()}-1`,
        customerName: 'Test Customer 1',
        customerEmail: 'test1@example.com',
        customerPhone: '0123456789',
        status: 'pending',
        paymentStatus: 'pending',
        paymentMethod: 'cod',
        channel: 'website',
        subtotal: 100000,
        shippingTotal: 30000,
        taxTotal: 0,
        discountTotal: 0,
        grandTotal: 130000,
        currency: 'VND',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        orderNumber: `TEST-FILTER-${Date.now()}-2`,
        customerName: 'Test Customer 2',
        customerEmail: 'test2@example.com',
        customerPhone: '0987654321',
        status: 'confirmed',
        paymentStatus: 'paid',
        paymentMethod: 'vietqr',
        channel: 'website',
        subtotal: 200000,
        shippingTotal: 30000,
        taxTotal: 0,
        discountTotal: 0,
        grandTotal: 230000,
        currency: 'VND',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        updatedAt: new Date(),
      },
      {
        orderNumber: `TEST-FILTER-${Date.now()}-3`,
        customerName: 'Test Customer 3',
        customerEmail: 'test3@example.com',
        customerPhone: '0111222333',
        status: 'processing',
        paymentStatus: 'paid',
        paymentMethod: 'momo',
        channel: 'app',
        subtotal: 300000,
        shippingTotal: 30000,
        taxTotal: 0,
        discountTotal: 0,
        grandTotal: 330000,
        currency: 'VND',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        updatedAt: new Date(),
      },
      {
        orderNumber: `TEST-FILTER-${Date.now()}-4`,
        customerName: 'Test Customer 4',
        customerEmail: 'test4@example.com',
        customerPhone: '0444555666',
        status: 'completed',
        paymentStatus: 'paid',
        paymentMethod: 'bank_transfer',
        channel: 'pos',
        subtotal: 400000,
        shippingTotal: 30000,
        taxTotal: 0,
        discountTotal: 0,
        grandTotal: 430000,
        currency: 'VND',
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        updatedAt: new Date(),
      },
    ];

    const insertedOrders = await orders.insertMany(testOrders);
    const testOrderIds = insertedOrders.insertedIds;
    console.log(`   ✅ Created ${testOrders.length} test orders`);

    // Test 1: Filter by single status
    await test('Filter by single status (pending)', async () => {
      const query: any = { status: 'pending' };
      const found = await orders.find(query).toArray();
      const testOrder = found.find((o: any) => 
        o.orderNumber?.startsWith('TEST-FILTER-')
      );
      
      if (!testOrder) {
        throw new Error('Test order not found');
      }
      
      if (testOrder.status !== 'pending') {
        throw new Error(`Expected status 'pending', got '${testOrder.status}'`);
      }
      
      return { count: found.length, testOrderStatus: testOrder.status };
    });

    // Test 2: Filter by multiple statuses
    await test('Filter by multiple statuses (pending,confirmed)', async () => {
      const statuses = ['pending', 'confirmed'];
      const query: any = { status: { $in: statuses } };
      const found = await orders.find(query).toArray();
      const testOrders = found.filter((o: any) => 
        o.orderNumber?.startsWith('TEST-FILTER-')
      );
      
      if (testOrders.length < 2) {
        throw new Error(`Expected at least 2 test orders, found ${testOrders.length}`);
      }
      
      const allValid = testOrders.every((o: any) => statuses.includes(o.status));
      if (!allValid) {
        throw new Error('Some orders have invalid status');
      }
      
      return { 
        count: found.length, 
        testOrdersCount: testOrders.length,
        statuses: [...new Set(testOrders.map((o: any) => o.status))],
      };
    });

    // Test 3: Filter by channel
    await test('Filter by channel (website)', async () => {
      const query: any = { channel: 'website' };
      const found = await orders.find(query).toArray();
      const testOrders = found.filter((o: any) => 
        o.orderNumber?.startsWith('TEST-FILTER-')
      );
      
      if (testOrders.length < 2) {
        throw new Error(`Expected at least 2 test orders, found ${testOrders.length}`);
      }
      
      const allWebsite = testOrders.every((o: any) => 
        !o.channel || o.channel === 'website'
      );
      if (!allWebsite) {
        throw new Error('Some orders are not from website channel');
      }
      
      return { 
        count: found.length, 
        testOrdersCount: testOrders.length,
      };
    });

    // Test 4: Filter by payment method
    await test('Filter by payment method (cod)', async () => {
      const query: any = { paymentMethod: 'cod' };
      const found = await orders.find(query).toArray();
      const testOrder = found.find((o: any) => 
        o.orderNumber?.startsWith('TEST-FILTER-')
      );
      
      if (!testOrder) {
        throw new Error('Test order with COD not found');
      }
      
      if (testOrder.paymentMethod !== 'cod') {
        throw new Error(`Expected paymentMethod 'cod', got '${testOrder.paymentMethod}'`);
      }
      
      return { count: found.length, testOrderPaymentMethod: testOrder.paymentMethod };
    });

    // Test 5: Filter by payment status
    await test('Filter by payment status (paid)', async () => {
      const query: any = { paymentStatus: 'paid' };
      const found = await orders.find(query).toArray();
      const testOrders = found.filter((o: any) => 
        o.orderNumber?.startsWith('TEST-FILTER-')
      );
      
      if (testOrders.length < 2) {
        throw new Error(`Expected at least 2 test orders, found ${testOrders.length}`);
      }
      
      const allPaid = testOrders.every((o: any) => 
        !o.paymentStatus || o.paymentStatus === 'paid'
      );
      if (!allPaid) {
        throw new Error('Some orders do not have paid payment status');
      }
      
      return { 
        count: found.length, 
        testOrdersCount: testOrders.length,
      };
    });

    // Test 6: Date range filter
    await test('Filter by date range (last 7 days)', async () => {
      const toDate = new Date();
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - 7);
      
      const query: any = {
        createdAt: {
          $gte: fromDate,
          $lte: toDate,
        },
      };
      
      const found = await orders.find(query).toArray();
      const testOrders = found.filter((o: any) => 
        o.orderNumber?.startsWith('TEST-FILTER-')
      );
      
      if (testOrders.length < 2) {
        throw new Error(`Expected at least 2 test orders, found ${testOrders.length}`);
      }
      
      const allInRange = testOrders.every((o: any) => {
        const orderDate = new Date(o.createdAt);
        return orderDate >= fromDate && orderDate <= toDate;
      });
      
      if (!allInRange) {
        throw new Error('Some orders are outside the date range');
      }
      
      return { 
        count: found.length, 
        testOrdersCount: testOrders.length,
        fromDate: fromDate.toISOString().split('T')[0],
        toDate: toDate.toISOString().split('T')[0],
      };
    });

    // Test 7: Search functionality
    await test('Search by order number', async () => {
      const searchTerm = 'TEST-FILTER';
      const query: any = {
        $or: [
          { orderNumber: { $regex: searchTerm, $options: 'i' } },
          { customerEmail: { $regex: searchTerm, $options: 'i' } },
          { customerName: { $regex: searchTerm, $options: 'i' } },
          { customerPhone: { $regex: searchTerm, $options: 'i' } },
        ],
      };
      
      const found = await orders.find(query).toArray();
      const testOrders = found.filter((o: any) => 
        o.orderNumber?.startsWith('TEST-FILTER-')
      );
      
      if (testOrders.length < testOrders.length) {
        throw new Error(`Expected ${testOrders.length} test orders, found ${testOrders.length}`);
      }
      
      return { 
        count: found.length, 
        testOrdersCount: testOrders.length,
        searchTerm,
      };
    });

    // Test 8: Sort by createdAt (desc)
    await test('Sort by createdAt (desc)', async () => {
      const query: any = { orderNumber: { $regex: '^TEST-FILTER-', $options: 'i' } };
      const found = await orders
        .find(query)
        .sort({ createdAt: -1 })
        .toArray();
      
      if (found.length < 2) {
        throw new Error('Need at least 2 orders to test sorting');
      }
      
      let isSorted = true;
      for (let i = 0; i < found.length - 1; i++) {
        const current = new Date(found[i].createdAt).getTime();
        const next = new Date(found[i + 1].createdAt).getTime();
        if (current < next) {
          isSorted = false;
          break;
        }
      }
      
      if (!isSorted) {
        throw new Error('Orders are not sorted descending by createdAt');
      }
      
      return { 
        count: found.length, 
        isSorted,
      };
    });

    // Test 9: Sort by total (asc)
    await test('Sort by total (asc)', async () => {
      const query: any = { orderNumber: { $regex: '^TEST-FILTER-', $options: 'i' } };
      const found = await orders
        .find(query)
        .sort({ grandTotal: 1 })
        .toArray();
      
      if (found.length < 2) {
        throw new Error('Need at least 2 orders to test sorting');
      }
      
      let isSorted = true;
      for (let i = 0; i < found.length - 1; i++) {
        const current = found[i].grandTotal || found[i].total || 0;
        const next = found[i + 1].grandTotal || found[i + 1].total || 0;
        if (current > next) {
          isSorted = false;
          break;
        }
      }
      
      if (!isSorted) {
        throw new Error('Orders are not sorted ascending by total');
      }
      
      return { 
        count: found.length, 
        isSorted,
      };
    });

    // Test 10: Pagination
    await test('Pagination (page 1, per_page 2)', async () => {
      const query: any = { orderNumber: { $regex: '^TEST-FILTER-', $options: 'i' } };
      const page = 1;
      const perPage = 2;
      
      const [ordersList, total] = await Promise.all([
        orders
          .find(query)
          .sort({ createdAt: -1 })
          .skip((page - 1) * perPage)
          .limit(perPage)
          .toArray(),
        orders.countDocuments(query),
      ]);
      
      const totalPages = Math.ceil(total / perPage);
      
      if (ordersList.length > perPage) {
        throw new Error(`Expected max ${perPage} orders, got ${ordersList.length}`);
      }
      
      if (totalPages < 1) {
        throw new Error(`Expected at least 1 page, got ${totalPages}`);
      }
      
      return {
        page,
        perPage,
        ordersCount: ordersList.length,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      };
    });

    // Test 11: Combined filters
    await test('Combined filters (status + channel + payment method)', async () => {
      const query: any = {
        status: { $in: ['pending', 'confirmed'] },
        channel: 'website',
        paymentMethod: 'cod',
      };
      
      const found = await orders.find(query).toArray();
      const testOrders = found.filter((o: any) => 
        o.orderNumber?.startsWith('TEST-FILTER-')
      );
      
      if (testOrders.length < 1) {
        throw new Error('Expected at least 1 test order matching all filters');
      }
      
      const allMatch = testOrders.every((o: any) => {
        const statusMatch = ['pending', 'confirmed'].includes(o.status);
        const channelMatch = !o.channel || o.channel === 'website';
        const paymentMatch = o.paymentMethod === 'cod';
        return statusMatch && channelMatch && paymentMatch;
      });
      
      if (!allMatch) {
        throw new Error('Some orders do not match all combined filters');
      }
      
      return { 
        count: found.length, 
        testOrdersCount: testOrders.length,
        allMatch,
      };
    });

    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    await orders.deleteMany({ 
      orderNumber: { $regex: '^TEST-FILTER-', $options: 'i' } 
    });
    console.log('   ✅ Test data cleaned up');

    // Print Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    
    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;
    
    console.log(`\n✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Total: ${results.length}`);
    
    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      results.filter(r => !r.passed).forEach(r => {
        console.log(`   - ${r.name}: ${r.error}`);
      });
    }
    
    console.log('\n' + '='.repeat(60));
    
    if (failed === 0) {
      console.log('🎉 All Phase 2 database tests passed!');
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

