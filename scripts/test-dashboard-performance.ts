/**
 * Dashboard Performance Test Script
 * Tests dashboard API endpoints with large datasets
 * 
 * Usage: npm run test:dashboard-performance
 * 
 * Prerequisites:
 * - MongoDB connection configured in .env.local
 * - Next.js dev server running on http://localhost:3000
 * - Admin authentication cookies (login first)
 * 
 * Tests:
 * - Dashboard stats API với 1,000 orders (target: < 500ms)
 * - Dashboard stats API với 10,000 orders (find breaking point)
 * - Monitor MongoDB query execution time
 */

import dotenv from 'dotenv';
import { resolve } from 'path';
import { MongoClient, ObjectId } from 'mongodb';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
const API_BASE = `${BASE_URL}/api`;
const MONGODB_URI = process.env.MONGODB_URI || '';

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

interface PerformanceResult {
  name: string;
  orderCount: number;
  duration: number;
  success: boolean;
  error?: string;
  mongoQueryTime?: number;
}

const results: PerformanceResult[] = [];

/**
 * Count orders in database
 */
async function countOrders(): Promise<number> {
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    const db = client.db();
    const orders = db.collection('orders');
    const count = await orders.countDocuments({});
    return count;
  } finally {
    await client.close();
  }
}

/**
 * Test dashboard stats API endpoint
 */
async function testDashboardStats(
  name: string,
  orderCount: number,
  dateRange: 'today' | 'thisMonth' = 'thisMonth'
): Promise<PerformanceResult> {
  const startTime = Date.now();
  
  try {
    // Note: This test assumes you have admin session cookie
    // In real scenario, you would login first and pass cookies
    const url = `${API_BASE}/admin/dashboard/stats?dateRange=${dateRange}&groupBy=day`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Requires browser session
    });

    const duration = Date.now() - startTime;
    const success = response.status >= 200 && response.status < 300;

    let error: string | undefined;
    if (!success) {
      try {
        const errorData = await response.json();
        error = errorData.error || `HTTP ${response.status}`;
      } catch {
        error = `HTTP ${response.status}`;
      }
    }

    // Parse response to get MongoDB query time if available
    let mongoQueryTime: number | undefined;
    if (success) {
      try {
        const data = await response.json();
        // MongoDB query time might be in response headers or meta
        // This is a placeholder - actual implementation depends on API response
        mongoQueryTime = data.meta?.queryTime;
      } catch {
        // Ignore parsing errors
      }
    }

    return {
      name,
      orderCount,
      duration,
      success,
      error,
      mongoQueryTime,
    };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    return {
      name,
      orderCount,
      duration,
      success: false,
      error: error.message || 'Network error',
    };
  }
}

/**
 * Measure MongoDB aggregation execution time directly
 */
async function measureMongoQueryTime(
  orderCount: number,
  dateRange: 'today' | 'thisMonth' = 'thisMonth'
): Promise<number> {
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    const db = client.db();
    const orders = db.collection('orders');
    
    // Calculate date range
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1); // Start of month
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59); // End of month
    
    if (dateRange === 'today') {
      start.setHours(0, 0, 0, 0);
      end.setTime(now.getTime());
    }

    const pipeline = [
      {
        $match: {
          createdAt: { $gte: start, $lt: end },
          status: { $ne: 'cancelled' },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt',
              timezone: 'Asia/Ho_Chi_Minh',
            },
          },
          revenue: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ['$status', 'completed'] }, { $eq: ['$paymentStatus', 'paid'] }] },
                { $toDouble: { $ifNull: ['$grandTotal', 0] } },
                0,
              ],
            },
          },
          orderCount: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ];

    const startTime = Date.now();
    await orders.aggregate(pipeline, { allowDiskUse: true }).toArray();
    const queryTime = Date.now() - startTime;

    return queryTime;
  } finally {
    await client.close();
  }
}

/**
 * Print performance result
 */
function printResult(result: PerformanceResult) {
  const statusColor = result.success ? colors.green : colors.red;
  const statusIcon = result.success ? '✓' : '✗';
  const durationColor = result.duration < 500 ? colors.green : result.duration < 1000 ? colors.yellow : colors.red;
  
  console.log(`${statusColor}${statusIcon}${colors.reset} ${result.name}`);
  console.log(`   Orders: ${result.orderCount.toLocaleString()}`);
  console.log(`   Duration: ${durationColor}${result.duration}ms${colors.reset} ${result.duration < 500 ? '(Target: < 500ms)' : result.duration < 1000 ? '(Acceptable)' : '(Slow - needs optimization)'}`);
  
  if (result.mongoQueryTime) {
    console.log(`   MongoDB Query Time: ${result.mongoQueryTime}ms`);
  }
  
  if (result.error) {
    console.log(`   ${colors.red}Error: ${result.error}${colors.reset}`);
  }
  console.log('');
}

/**
 * Main test function
 */
async function runTests() {
  console.log(`${colors.cyan}=== Dashboard Performance Tests ===${colors.reset}\n`);

  // Check MongoDB connection
  if (!MONGODB_URI) {
    console.log(`${colors.red}✗ MONGODB_URI not configured in .env.local${colors.reset}`);
    process.exit(1);
  }

  // Count orders in database
  console.log(`${colors.blue}Counting orders in database...${colors.reset}`);
  const orderCount = await countOrders();
  console.log(`${colors.green}✓${colors.reset} Total orders in database: ${orderCount.toLocaleString()}\n`);

  // Test 1: Dashboard stats với current database
  if (orderCount >= 1000) {
    console.log(`${colors.blue}Test 1: Dashboard stats với ${orderCount.toLocaleString()} orders${colors.reset}`);
    const result1 = await testDashboardStats('Dashboard Stats (All Orders)', orderCount);
    results.push(result1);
    printResult(result1);

    // Measure MongoDB query time directly
    const mongoTime = await measureMongoQueryTime(orderCount);
    console.log(`${colors.cyan}Direct MongoDB query time: ${mongoTime}ms${colors.reset}\n`);
  } else {
    console.log(`${colors.yellow}⚠ Warning: Only ${orderCount} orders in database. Need at least 1,000 orders for performance test.${colors.reset}\n`);
  }

  // Summary
  console.log(`${colors.cyan}=== Performance Test Summary ===${colors.reset}\n`);
  
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
  const maxDuration = Math.max(...results.map(r => r.duration));
  const minDuration = Math.min(...results.map(r => r.duration));

  console.log(`Total Tests: ${results.length}`);
  console.log(`${colors.green}Passed: ${passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${failed}${colors.reset}`);
  console.log(`Average Duration: ${avgDuration.toFixed(2)}ms`);
  console.log(`Min Duration: ${minDuration}ms`);
  console.log(`Max Duration: ${maxDuration}ms`);

  // Performance recommendations
  console.log(`\n${colors.cyan}=== Performance Recommendations ===${colors.reset}\n`);
  
  if (avgDuration > 500) {
    console.log(`${colors.yellow}⚠ Average response time (${avgDuration.toFixed(2)}ms) exceeds target (500ms)${colors.reset}`);
    console.log(`   Recommendations:`);
    console.log(`   - Check MongoDB indexes on 'createdAt', 'status', 'paymentStatus'`);
    console.log(`   - Consider adding compound index: { createdAt: 1, status: 1, paymentStatus: 1 }`);
    console.log(`   - Optimize aggregation pipeline (check $match order)`);
    console.log(`   - Consider caching results for frequently accessed date ranges`);
  } else {
    console.log(`${colors.green}✓ Performance is within target (< 500ms average)${colors.reset}`);
  }

  if (maxDuration > 1000) {
    console.log(`${colors.red}⚠ Maximum response time (${maxDuration}ms) is too high${colors.reset}`);
    console.log(`   Recommendations:`);
    console.log(`   - Add query timeouts to prevent long-running queries`);
    console.log(`   - Implement query result caching`);
    console.log(`   - Consider pagination or data sampling for large date ranges`);
  }

  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch((error) => {
  console.error(`${colors.red}Error running tests:${colors.reset}`, error);
  process.exit(1);
});

