/**
 * Dashboard Error Handling Test Script
 * Tests dashboard API error handling scenarios
 * 
 * Usage: npm run test:dashboard-errors
 * 
 * Prerequisites:
 * - MongoDB connection configured in .env.local
 * - Next.js dev server running on http://localhost:3000
 * - Note: Most tests require authentication. Only unauthorized test (Test 6) works without auth.
 * 
 * Test Scenarios:
 * - Invalid date ranges (requires authentication to test validation)
 * - Empty database (requires authentication)
 * - Missing authentication (passes - returns 401)
 * - Invalid parameters (requires authentication to test validation)
 * 
 * Note: To test validation errors (400), you need to:
 * 1. Login to admin panel first (sets authentication cookies)
 * 2. Or provide valid session cookie via AUTH_COOKIE environment variable
 */

import dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
const API_BASE = `${BASE_URL}/api`;

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

interface ErrorTestResult {
  name: string;
  scenario: string;
  expectedStatus: number;
  actualStatus: number;
  success: boolean;
  error?: string;
  responseBody?: any;
}

const results: ErrorTestResult[] = [];

/**
 * Test endpoint với specific scenario
 */
async function testErrorScenario(
  name: string,
  scenario: string,
  url: string,
  expectedStatus: number,
  options?: RequestInit
): Promise<ErrorTestResult> {
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    const actualStatus = response.status;
    const success = actualStatus === expectedStatus;

    let responseBody: any;
    try {
      responseBody = await response.json();
    } catch {
      responseBody = await response.text();
    }

    let error: string | undefined;
    if (!success) {
      if (typeof responseBody === 'object' && responseBody.error) {
        error = responseBody.error;
      } else {
        error = `Expected ${expectedStatus}, got ${actualStatus}`;
      }
    }

    return {
      name,
      scenario,
      expectedStatus,
      actualStatus,
      success,
      error,
      responseBody,
    };
  } catch (error: any) {
    return {
      name,
      scenario,
      expectedStatus,
      actualStatus: 0,
      success: false,
      error: error.message || 'Network error',
    };
  }
}

/**
 * Print test result
 */
function printResult(result: ErrorTestResult) {
  const statusColor = result.success ? colors.green : colors.red;
  const statusIcon = result.success ? '✓' : '✗';
  
  console.log(`${statusColor}${statusIcon}${colors.reset} ${result.name}`);
  console.log(`   Scenario: ${result.scenario}`);
  console.log(`   Expected: ${result.expectedStatus}, Actual: ${result.actualStatus}`);
  
  if (result.error) {
    console.log(`   ${colors.red}Error: ${result.error}${colors.reset}`);
  }
  
  if (result.responseBody && typeof result.responseBody === 'object') {
    if (result.responseBody.error) {
      console.log(`   Error Message: ${result.responseBody.error}`);
    }
    if (result.responseBody.code) {
      console.log(`   Error Code: ${result.responseBody.code}`);
    }
  }
  
  console.log('');
}

/**
 * Main test function
 */
async function runTests() {
  console.log(`${colors.cyan}=== Dashboard Error Handling Tests ===${colors.reset}\n`);

  // Check if authentication cookie is provided
  const authCookie = process.env.AUTH_COOKIE;
  const hasAuth = !!authCookie;

  // Test 1: Invalid date range (startDate > endDate)
  console.log(`${colors.blue}Test 1: Invalid date range (startDate > endDate)${colors.reset}`);
  if (!hasAuth) {
    console.log(`${colors.yellow}⚠ Skipped: Requires authentication. Set AUTH_COOKIE env var to test.${colors.reset}\n`);
  } else {
    const test1 = await testErrorScenario(
      'Invalid Date Range',
      'startDate > endDate',
      `${API_BASE}/admin/dashboard/stats?dateRange=custom&startDate=2025-01-31&endDate=2025-01-01`,
      400, // Expected: Bad Request
      {
        headers: {
          Cookie: authCookie,
        },
        credentials: 'include',
      }
    );
    results.push(test1);
    printResult(test1);
  }

  // Test 2: Missing required parameters for custom range
  console.log(`${colors.blue}Test 2: Missing required parameters for custom range${colors.reset}`);
  if (!hasAuth) {
    console.log(`${colors.yellow}⚠ Skipped: Requires authentication. Set AUTH_COOKIE env var to test.${colors.reset}\n`);
  } else {
    const test2 = await testErrorScenario(
      'Missing Date Parameters',
      'custom dateRange without startDate/endDate',
      `${API_BASE}/admin/dashboard/stats?dateRange=custom`,
      400, // Expected: Bad Request (if validated)
      {
        headers: {
          Cookie: authCookie!,
        },
        credentials: 'include',
      }
    );
    results.push(test2);
    printResult(test2);
  }

  // Test 3: Invalid date format
  console.log(`${colors.blue}Test 3: Invalid date format${colors.reset}`);
  if (!hasAuth) {
    console.log(`${colors.yellow}⚠ Skipped: Requires authentication. Set AUTH_COOKIE env var to test.${colors.reset}\n`);
  } else {
    const test3 = await testErrorScenario(
      'Invalid Date Format',
      'invalid date string',
      `${API_BASE}/admin/dashboard/stats?dateRange=custom&startDate=invalid-date&endDate=2025-01-31`,
      400, // Expected: Bad Request
      {
        headers: {
          Cookie: authCookie!,
        },
        credentials: 'include',
      }
    );
    results.push(test3);
    printResult(test3);
  }

  // Test 4: Date range too large (> 1 year)
  console.log(`${colors.blue}Test 4: Date range too large (> 1 year)${colors.reset}`);
  if (!hasAuth) {
    console.log(`${colors.yellow}⚠ Skipped: Requires authentication. Set AUTH_COOKIE env var to test.${colors.reset}\n`);
  } else {
    const test4 = await testErrorScenario(
      'Date Range Too Large',
      'startDate and endDate more than 1 year apart',
      `${API_BASE}/admin/dashboard/stats?dateRange=custom&startDate=2023-01-01&endDate=2025-01-31`,
      400, // Expected: Bad Request (if validated)
      {
        headers: {
          Cookie: authCookie!,
        },
        credentials: 'include',
      }
    );
    results.push(test4);
    printResult(test4);
  }

  // Test 5: Future date
  console.log(`${colors.blue}Test 5: Future end date${colors.reset}`);
  if (!hasAuth) {
    console.log(`${colors.yellow}⚠ Skipped: Requires authentication. Set AUTH_COOKIE env var to test.${colors.reset}\n`);
  } else {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    const test5 = await testErrorScenario(
      'Future Date',
      'endDate in the future',
      `${API_BASE}/admin/dashboard/stats?dateRange=custom&startDate=2025-01-01&endDate=${futureDate.toISOString().split('T')[0]}`,
      400, // Expected: Bad Request (if validated)
      {
        headers: {
          Cookie: authCookie!,
        },
        credentials: 'include',
      }
    );
    results.push(test5);
    printResult(test5);
  }

  // Test 6: Unauthorized (no authentication)
  console.log(`${colors.blue}Test 6: Unauthorized access (no authentication)${colors.reset}`);
  const test6 = await testErrorScenario(
    'Unauthorized Access',
    'no authentication cookies',
    `${API_BASE}/admin/dashboard/stats?dateRange=today`,
    401 // Expected: Unauthorized
  );
  results.push(test6);
  printResult(test6);

  // Test 7: Invalid groupBy parameter
  console.log(`${colors.blue}Test 7: Invalid groupBy parameter${colors.reset}`);
  if (!hasAuth) {
    console.log(`${colors.yellow}⚠ Skipped: Requires authentication. Set AUTH_COOKIE env var to test.${colors.reset}\n`);
  } else {
    const test7 = await testErrorScenario(
      'Invalid GroupBy',
      'invalid groupBy value',
      `${API_BASE}/admin/dashboard/stats?dateRange=today&groupBy=invalid`,
      400, // Expected: Bad Request (if validated)
      {
        headers: {
          Cookie: authCookie!,
        },
        credentials: 'include',
      }
    );
    results.push(test7);
    printResult(test7);
  }

  // Test 8: Empty database (should return empty results, not error)
  console.log(`${colors.blue}Test 8: Empty database response${colors.reset}`);
  if (!hasAuth) {
    console.log(`${colors.yellow}⚠ Skipped: Requires authentication. Set AUTH_COOKIE env var to test.${colors.reset}\n`);
  } else {
    const test8 = await testErrorScenario(
      'Empty Database',
      'should return empty results gracefully',
      `${API_BASE}/admin/dashboard/stats?dateRange=today`,
      200, // Expected: OK with empty data
      {
        headers: {
          Cookie: authCookie!,
        },
        credentials: 'include',
      }
    );
    results.push(test8);
    printResult(test8);
  }

  // Summary
  console.log(`${colors.cyan}=== Error Handling Test Summary ===${colors.reset}\n`);
  
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const skipped = 8 - results.length;

  console.log(`Total Tests: ${results.length}${skipped > 0 ? ` (${skipped} skipped - require authentication)` : ''}`);
  console.log(`${colors.green}Passed: ${passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${failed}${colors.reset}`);
  
  if (!hasAuth && skipped > 0) {
    console.log(`\n${colors.yellow}Note: ${skipped} tests were skipped because authentication is required.${colors.reset}`);
    console.log(`To run all tests:`);
    console.log(`1. Login to admin panel in browser (http://localhost:3000/admin/login)`);
    console.log(`2. Copy the authentication cookie from browser DevTools`);
    console.log(`3. Run: AUTH_COOKIE="your-cookie-value" npm run test:dashboard-errors`);
  }

  // Recommendations
  if (failed > 0) {
    console.log(`\n${colors.yellow}⚠ Some error scenarios are not handled correctly${colors.reset}`);
    console.log(`   Recommendations:`);
    console.log(`   - Add validation for date ranges in API route`);
    console.log(`   - Add validation for date format`);
    console.log(`   - Add validation for date range size (max 1 year)`);
    console.log(`   - Ensure all errors return proper JSON format`);
    console.log(`   - Ensure empty database returns 200 with empty data, not error`);
  } else {
    console.log(`\n${colors.green}✓ All error scenarios handled correctly${colors.reset}`);
  }

  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch((error) => {
  console.error(`${colors.red}Error running tests:${colors.reset}`, error);
  process.exit(1);
});

