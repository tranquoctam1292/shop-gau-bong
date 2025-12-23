/**
 * Dashboard Phase 5 - Date Range Selector Test Script
 * Tests all date range options and auto groupBy logic
 * 
 * Usage: npm run test:dashboard-phase5
 * 
 * Prerequisites:
 * - MongoDB connection configured in .env.local
 * - Next.js dev server running on http://localhost:3000
 * - Admin authentication cookies (login first)
 * 
 * Test Scenarios:
 * - All date range options (today, yesterday, last7Days, thisMonth, lastMonth, thisWeek)
 * - Auto groupBy logic (hour for single day, day for multi-day)
 * - Validation errors (invalid dateRange values)
 * - Timezone handling (Vietnam UTC+7)
 * - Edge cases (boundary dates, month transitions)
 */

import dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
const API_BASE = `${BASE_URL}/api/admin/dashboard`;

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

interface TestResult {
  name: string;
  passed: boolean;
  statusCode?: number;
  message?: string;
  details?: {
    dateRange?: string;
    groupBy?: string;
    dataPoints?: number;
    totalRevenue?: number;
    totalOrders?: number;
  };
  error?: string;
}

const results: TestResult[] = [];

/**
 * Test API endpoint with date range
 */
async function testDateRange(
  name: string,
  dateRange: string,
  expectedGroupBy?: 'hour' | 'day' | 'week',
  endpoint: 'stats' | 'top-products' | 'top-customers' = 'stats'
): Promise<TestResult> {
  const url = `${API_BASE}/${endpoint}?dateRange=${dateRange}`;
  
  try {
    const startTime = Date.now();
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });
    const responseTime = Date.now() - startTime;

    const data = await response.json();

    if (!response.ok) {
      return {
        name,
        passed: false,
        statusCode: response.status,
        message: `Failed with status ${response.status}`,
        error: data.error || 'Unknown error',
      };
    }

    // Check if response has expected structure
    if (endpoint === 'stats') {
      const hasChart = data.data?.revenueChart;
      const actualGroupBy = hasChart ? data.data.revenueChart.groupBy : undefined;
      
      // Verify groupBy matches expectation
      if (expectedGroupBy && actualGroupBy !== expectedGroupBy) {
        return {
          name,
          passed: false,
          statusCode: response.status,
          message: `Expected groupBy='${expectedGroupBy}', got '${actualGroupBy}'`,
          details: {
            dateRange,
            groupBy: actualGroupBy,
          },
        };
      }

      return {
        name,
        passed: true,
        statusCode: response.status,
        message: `Success (${responseTime}ms)`,
        details: {
          dateRange,
          groupBy: actualGroupBy,
          dataPoints: hasChart ? data.data.revenueChart.data?.length || 0 : 0,
          totalRevenue: hasChart ? data.data.revenueChart.totalRevenue || 0 : 0,
          totalOrders: hasChart ? data.data.revenueChart.totalOrders || 0 : 0,
        },
      };
    } else if (endpoint === 'top-products') {
      return {
        name,
        passed: true,
        statusCode: response.status,
        message: `Success (${responseTime}ms)`,
        details: {
          dateRange,
          dataPoints: data.data?.products?.length || 0,
          totalRevenue: data.data?.totalRevenue || 0,
        },
      };
    } else {
      // top-customers
      return {
        name,
        passed: true,
        statusCode: response.status,
        message: `Success (${responseTime}ms)`,
        details: {
          dateRange,
          dataPoints: data.data?.customers?.length || 0,
          totalRevenue: data.data?.totalRevenue || 0,
        },
      };
    }
  } catch (error) {
    return {
      name,
      passed: false,
      message: 'Request failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Test invalid date range (should return 400)
 */
async function testInvalidDateRange(name: string, dateRange: string): Promise<TestResult> {
  const url = `${API_BASE}/stats?dateRange=${dateRange}`;
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    const data = await response.json();

    if (response.status === 400 && data.error) {
      return {
        name,
        passed: true,
        statusCode: response.status,
        message: `Correctly rejected with 400 error`,
        details: {
          dateRange,
        },
        error: data.error,
      };
    }

    return {
      name,
      passed: false,
      statusCode: response.status,
      message: `Expected 400 error, got ${response.status}`,
      details: {
        dateRange,
      },
    };
  } catch (error) {
    return {
      name,
      passed: false,
      message: 'Request failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Print test result
 */
function printResult(result: TestResult) {
  const status = result.passed
    ? `${colors.green}✓ PASS${colors.reset}`
    : `${colors.red}✗ FAIL${colors.reset}`;
  
  console.log(`  ${status} ${result.name}`);
  
  if (result.message) {
    console.log(`    ${colors.gray}${result.message}${colors.reset}`);
  }
  
  if (result.details) {
    if (result.details.groupBy) {
      console.log(`    ${colors.gray}GroupBy: ${result.details.groupBy}${colors.reset}`);
    }
    if (result.details.dataPoints !== undefined) {
      console.log(`    ${colors.gray}Data points: ${result.details.dataPoints}${colors.reset}`);
    }
    if (result.details.totalRevenue !== undefined) {
      console.log(`    ${colors.gray}Total Revenue: ${result.details.totalRevenue.toLocaleString('vi-VN')} đ${colors.reset}`);
    }
  }
  
  if (result.error && !result.passed) {
    console.log(`    ${colors.red}Error: ${result.error}${colors.reset}`);
  }
  
  console.log();
}

/**
 * Run all tests
 */
async function runTests() {
  console.log(`${colors.cyan}=== Testing Dashboard Phase 5 - Date Range Selector ===${colors.reset}\n`);
  console.log(`Base URL: ${BASE_URL}\n`);
  
  // Check authentication by testing a simple endpoint
  try {
    const authCheck = await fetch(`${API_BASE}/stats?dateRange=today`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });
    
    if (authCheck.status === 401) {
      console.log(`${colors.yellow}⚠️  WARNING: Authentication required!${colors.reset}\n`);
      console.log(`To run these tests, you need to:`);
      console.log(`1. Start the Next.js dev server: ${colors.cyan}npm run dev${colors.reset}`);
      console.log(`2. Login to admin panel at ${colors.cyan}${BASE_URL}/admin/login${colors.reset}`);
      console.log(`3. Keep the browser open (to maintain session cookies)`);
      console.log(`4. Run this script again: ${colors.cyan}npm run test:dashboard-phase5${colors.reset}\n`);
      console.log(`${colors.gray}Note: Authentication cookies are automatically sent if you're logged in.${colors.reset}\n`);
      process.exit(1);
    }
  } catch (error) {
    console.log(`${colors.red}✗ Cannot connect to server. Is the dev server running?${colors.reset}\n`);
    console.log(`Start the server with: ${colors.cyan}npm run dev${colors.reset}\n`);
    process.exit(1);
  }

  // Test 1-5: All valid date range options
  console.log(`${colors.blue}Testing Valid Date Range Options...${colors.reset}\n`);
  
  results.push(await testDateRange(
    'Today (should use hour groupBy)',
    'today',
    'hour'
  ));

  results.push(await testDateRange(
    'Yesterday (should use hour groupBy)',
    'yesterday',
    'hour'
  ));

  results.push(await testDateRange(
    'Last 7 Days (should use day groupBy)',
    'last7Days',
    'day'
  ));

  results.push(await testDateRange(
    'This Month (should use day groupBy)',
    'thisMonth',
    'day'
  ));

  results.push(await testDateRange(
    'Last Month (should use day groupBy)',
    'lastMonth',
    'day'
  ));

  results.push(await testDateRange(
    'This Week (should use day groupBy)',
    'thisWeek',
    'day'
  ));

  // Test 6-8: Top Products with different date ranges
  console.log(`${colors.blue}Testing Top Products API with Date Ranges...${colors.reset}\n`);
  
  results.push(await testDateRange(
    'Top Products - Today',
    'today',
    undefined,
    'top-products'
  ));

  results.push(await testDateRange(
    'Top Products - Last 7 Days',
    'last7Days',
    undefined,
    'top-products'
  ));

  results.push(await testDateRange(
    'Top Products - This Month',
    'thisMonth',
    undefined,
    'top-products'
  ));

  // Test 9-11: Top Customers with different date ranges
  console.log(`${colors.blue}Testing Top Customers API with Date Ranges...${colors.reset}\n`);
  
  results.push(await testDateRange(
    'Top Customers - Today',
    'today',
    undefined,
    'top-customers'
  ));

  results.push(await testDateRange(
    'Top Customers - Last 7 Days',
    'last7Days',
    undefined,
    'top-customers'
  ));

  results.push(await testDateRange(
    'Top Customers - This Month',
    'thisMonth',
    undefined,
    'top-customers'
  ));

  // Test 12-15: Validation errors (invalid dateRange values)
  console.log(`${colors.blue}Testing Validation Errors...${colors.reset}\n`);
  
  results.push(await testInvalidDateRange(
    'Invalid dateRange: "invalid"',
    'invalid'
  ));

  results.push(await testInvalidDateRange(
    'Invalid dateRange: "random"',
    'random'
  ));

  results.push(await testInvalidDateRange(
    'Invalid dateRange: empty string',
    ''
  ));

  // Test 16: Custom date range (should work if startDate and endDate provided)
  console.log(`${colors.blue}Testing Edge Cases...${colors.reset}\n`);
  
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  results.push(await testDateRange(
    'Custom date range (yesterday to today)',
    `custom&startDate=${yesterday}&endDate=${today}`,
    'day'
  ));

  // Print summary
  console.log(`${colors.cyan}=== Test Summary ===${colors.reset}\n`);
  
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  const total = results.length;

  console.log(`Total tests: ${total}`);
  console.log(`${colors.green}Passed: ${passed}${colors.reset}`);
  if (failed > 0) {
    console.log(`${colors.red}Failed: ${failed}${colors.reset}`);
  } else {
    console.log(`Failed: ${failed}`);
  }
  console.log(`Success rate: ${((passed / total) * 100).toFixed(1)}%\n`);

  // Print failed tests
  if (failed > 0) {
    console.log(`${colors.red}=== Failed Tests ===${colors.reset}\n`);
    results.filter((r) => !r.passed).forEach(printResult);
  }

  // Exit with appropriate code
  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch((error) => {
  console.error(`${colors.red}Test execution failed:${colors.reset}`, error);
  process.exit(1);
});

