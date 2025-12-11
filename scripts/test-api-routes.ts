/**
 * Test script for CMS API Routes
 * Tests all public and admin API endpoints
 * 
 * Usage: npm run test:api-routes
 * 
 * Prerequisites:
 * - MongoDB connection configured in .env.local
 * - Next.js dev server running on http://localhost:3000
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

interface TestResult {
  name: string;
  method: string;
  url: string;
  status: number;
  success: boolean;
  error?: string;
  duration: number;
}

const results: TestResult[] = [];

async function testEndpoint(
  name: string,
  method: string,
  url: string,
  options?: RequestInit
): Promise<TestResult> {
  const startTime = Date.now();
  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
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

    return {
      name,
      method,
      url,
      status: response.status,
      success,
      error,
      duration,
    };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    return {
      name,
      method,
      url,
      status: 0,
      success: false,
      error: error.message || 'Network error',
      duration,
    };
  }
}

function printResult(result: TestResult) {
  const statusColor = result.success ? colors.green : colors.red;
  const statusIcon = result.success ? '✓' : '✗';
  const statusText = result.success ? 'PASS' : 'FAIL';

  console.log(
    `${statusColor}${statusIcon}${colors.reset} [${result.method}] ${result.name}`
  );
  console.log(`   URL: ${result.url}`);
  console.log(`   Status: ${statusColor}${result.status}${colors.reset}`);
  console.log(`   Duration: ${result.duration}ms`);
  if (result.error) {
    console.log(`   ${colors.red}Error: ${result.error}${colors.reset}`);
  }
  console.log('');
}

async function runTests() {
  console.log(`${colors.cyan}=== Testing CMS API Routes ===${colors.reset}\n`);
  console.log(`Base URL: ${BASE_URL}\n`);

  // Test 1: Public Products API - GET all products
  console.log(`${colors.blue}Testing Public CMS Routes...${colors.reset}\n`);
  
  results.push(await testEndpoint(
    'Get all products',
    'GET',
    `${API_BASE}/cms/products`
  ));

  // Test 2: Public Products API - With pagination
  results.push(await testEndpoint(
    'Get products with pagination',
    'GET',
    `${API_BASE}/cms/products?page=1&per_page=5`
  ));

  // Test 3: Public Products API - With search
  results.push(await testEndpoint(
    'Get products with search',
    'GET',
    `${API_BASE}/cms/products?search=gau`
  ));

  // Test 4: Public Products API - With filters
  results.push(await testEndpoint(
    'Get products with filters',
    'GET',
    `${API_BASE}/cms/products?featured=true&min_price=100000`
  ));

  // Test 5: Public Categories API
  results.push(await testEndpoint(
    'Get all categories',
    'GET',
    `${API_BASE}/cms/categories`
  ));

  // Test 6: Public Categories API - With parent filter
  results.push(await testEndpoint(
    'Get top-level categories',
    'GET',
    `${API_BASE}/cms/categories?parent=0`
  ));

  // Test 7: Public Banners API
  results.push(await testEndpoint(
    'Get banners',
    'GET',
    `${API_BASE}/cms/banners`
  ));

  // Test 8: Public Single Product API - By ID (will fail if no products, but should return 404, not 500)
  results.push(await testEndpoint(
    'Get product by ID (invalid)',
    'GET',
    `${API_BASE}/cms/products/507f1f77bcf86cd799439011`
  ));

  // Test 9: Public Single Product API - By slug (will fail if no products, but should return 404, not 500)
  results.push(await testEndpoint(
    'Get product by slug (invalid)',
    'GET',
    `${API_BASE}/cms/products/non-existent-product`
  ));

  // Test 10: Public Product Variations API
  results.push(await testEndpoint(
    'Get product variations (invalid product)',
    'GET',
    `${API_BASE}/cms/products/507f1f77bcf86cd799439011/variations`
  ));

  // Test 11: Public Orders API - POST (create order)
  results.push(await testEndpoint(
    'Create order (empty body)',
    'POST',
    `${API_BASE}/cms/orders`,
    {
      body: JSON.stringify({}),
    }
  ));

  // Test Admin Routes
  console.log(`\n${colors.blue}Testing Admin Routes...${colors.reset}\n`);

  // Test 12: Admin Products API - GET
  results.push(await testEndpoint(
    'Admin: Get all products',
    'GET',
    `${API_BASE}/admin/products`
  ));

  // Test 13: Admin Products API - GET with filters
  results.push(await testEndpoint(
    'Admin: Get products with filters',
    'GET',
    `${API_BASE}/admin/products?page=1&per_page=5&search=test`
  ));

  // Test 14: Admin Products API - POST (create product)
  const testProduct = {
    name: 'Test Product API',
    slug: `test-product-api-${Date.now()}`,
    description: 'Test product created by API test script',
    minPrice: 100000,
    images: [],
    variants: [],
    isActive: true,
    status: 'draft',
  };

  results.push(await testEndpoint(
    'Admin: Create product',
    'POST',
    `${API_BASE}/admin/products`,
    {
      body: JSON.stringify(testProduct),
    }
  ));

  // Test 15: Admin Categories API - GET
  results.push(await testEndpoint(
    'Admin: Get all categories',
    'GET',
    `${API_BASE}/admin/categories`
  ));

  // Test 16: Admin Categories API - POST (create category)
  const testCategory = {
    name: 'Test Category API',
    slug: `test-category-api-${Date.now()}`,
    description: 'Test category created by API test script',
  };

  results.push(await testEndpoint(
    'Admin: Create category',
    'POST',
    `${API_BASE}/admin/categories`,
    {
      body: JSON.stringify(testCategory),
    }
  ));

  // Test 17: Admin Orders API - GET
  results.push(await testEndpoint(
    'Admin: Get all orders',
    'GET',
    `${API_BASE}/admin/orders`
  ));

  // Test 18: Admin Orders API - GET with pagination
  results.push(await testEndpoint(
    'Admin: Get orders with pagination',
    'GET',
    `${API_BASE}/admin/orders?page=1&per_page=10`
  ));

  // Test 19: Admin Single Order API - GET (invalid)
  results.push(await testEndpoint(
    'Admin: Get order by ID (invalid)',
    'GET',
    `${API_BASE}/admin/orders/507f1f77bcf86cd799439011`
  ));

  // Test 20: Admin Single Product API - GET (invalid)
  results.push(await testEndpoint(
    'Admin: Get product by ID (invalid)',
    'GET',
    `${API_BASE}/admin/products/507f1f77bcf86cd799439011`
  ));

  // Print Summary
  console.log(`\n${colors.cyan}=== Test Summary ===${colors.reset}\n`);

  const passed = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;
  const total = results.length;

  console.log(`Total Tests: ${total}`);
  console.log(`${colors.green}Passed: ${passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${failed}${colors.reset}`);
  console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%\n`);

  // Print all results
  console.log(`${colors.cyan}=== Detailed Results ===${colors.reset}\n`);
  results.forEach(printResult);

  // Exit with error code if any tests failed
  if (failed > 0) {
    console.log(`${colors.yellow}Note: Some tests may fail if the database is empty or server is not running.${colors.reset}`);
    console.log(`${colors.yellow}This is expected for endpoints that require existing data.${colors.reset}\n`);
  }

  process.exit(failed > 0 ? 1 : 0);
}

// Check if server is accessible before running tests
async function checkServer() {
  try {
    const response = await fetch(BASE_URL, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}

// Main execution
(async () => {
  console.log(`${colors.yellow}Checking if Next.js server is running...${colors.reset}\n`);
  
  const serverRunning = await checkServer();
  if (!serverRunning) {
    console.log(`${colors.red}✗ Server is not accessible at ${BASE_URL}${colors.reset}`);
    console.log(`${colors.yellow}Please start the Next.js dev server first:${colors.reset}`);
    console.log(`${colors.cyan}  npm run dev${colors.reset}\n`);
    process.exit(1);
  }

  console.log(`${colors.green}✓ Server is running${colors.reset}\n`);
  
  await runTests();
})();

