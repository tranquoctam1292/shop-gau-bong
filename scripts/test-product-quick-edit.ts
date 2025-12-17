/**
 * Test script for Product Quick Edit Feature
 * Tests API endpoints and functionality
 * 
 * Usage: npm run test:product-quick-edit
 * 
 * Prerequisites:
 * - MongoDB connection configured in .env.local
 * - Next.js dev server running on http://localhost:3000
 * - Admin user logged in (session cookie required)
 */

import dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
const API_BASE = `${BASE_URL}/api/admin`;

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
};

interface TestResult {
  name: string;
  method: string;
  url: string;
  status: number;
  success: boolean;
  error?: string;
  duration: number;
  data?: any;
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
      credentials: 'include', // Include cookies for authentication
      ...options,
    });

    const duration = Date.now() - startTime;
    const success = response.status >= 200 && response.status < 300;

    let error: string | undefined;
    let data: any;
    
    try {
      data = await response.json();
      if (!success) {
        error = data.error || `HTTP ${response.status}`;
      }
    } catch {
      if (!success) {
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
      data,
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
  const statusIcon = result.success ? '✅' : '❌';
  
  console.log(`${statusIcon} ${result.name}`);
  console.log(`   ${result.method} ${result.url}`);
  console.log(`   Status: ${statusColor}${result.status}${colors.reset}`);
  console.log(`   Duration: ${result.duration}ms`);
  
  if (result.error) {
    console.log(`   ${colors.red}Error: ${result.error}${colors.reset}`);
  }
  
  if (result.data && result.success) {
    console.log(`   ${colors.green}Success${colors.reset}`);
  }
  
  console.log('');
}

async function getTestProductId(): Promise<string | null> {
  console.log(`${colors.blue}Fetching test product...${colors.reset}\n`);
  
  const response = await testEndpoint(
    'Get products list',
    'GET',
    `${API_BASE}/products?per_page=1`
  );
  
  // Debug: Print response structure
  if (response.data) {
    console.log(`${colors.yellow}Response structure:${colors.reset}`);
    console.log(JSON.stringify(response.data, null, 2).substring(0, 500));
    console.log('');
  }
  
  if (!response.success) {
    if (response.status === 401) {
      console.log(`${colors.red}❌ Authentication required!${colors.reset}`);
      console.log(`${colors.yellow}Please log in to admin panel first: http://localhost:3000/admin/login${colors.reset}\n`);
    } else {
      console.log(`${colors.red}❌ Failed to fetch products: ${response.error}${colors.reset}\n`);
    }
    return null;
  }
  
  // Try different response structures
  const products = response.data?.products || response.data?.data || [];
  
  if (products.length > 0) {
    const product = products[0];
    const productId = product.id || product._id || product.databaseId;
    
    if (productId) {
      console.log(`${colors.green}✅ Found test product: ${productId}${colors.reset}`);
      console.log(`${colors.green}   Product name: ${product.name || 'N/A'}${colors.reset}\n`);
      return productId;
    }
  }
  
  console.log(`${colors.yellow}⚠️  No products found. Please create a product first.${colors.reset}`);
  console.log(`${colors.yellow}   You can create a product at: http://localhost:3000/admin/products/new${colors.reset}\n`);
  return null;
}

async function getProductVersion(productId: string): Promise<number | null> {
  const response = await testEndpoint(
    'Get product version',
    'GET',
    `${API_BASE}/products/${productId}`
  );
  
  if (response.success && response.data?.product?.version) {
    return response.data.product.version;
  }
  
  return null;
}

async function runTests() {
  console.log(`${colors.cyan}=== Testing Product Quick Edit Feature ===${colors.reset}\n`);
  console.log(`Base URL: ${BASE_URL}\n`);
  console.log(`${colors.yellow}Note: This test requires admin authentication.${colors.reset}`);
  console.log(`${colors.yellow}Make sure you are logged in to the admin panel.${colors.reset}\n`);

  // Get test product ID
  const productId = await getTestProductId();
  if (!productId) {
    console.log(`${colors.red}❌ Cannot proceed without a test product${colors.reset}\n`);
    console.log(`${colors.cyan}=== Test Summary ===${colors.reset}`);
    console.log(`Total tests: 0`);
    console.log(`${colors.yellow}Skipped: All tests (no product available)${colors.reset}\n`);
    console.log(`${colors.blue}Next steps:${colors.reset}`);
    console.log(`1. Create a product at http://localhost:3000/admin/products/new`);
    console.log(`2. Make sure you are logged in to admin panel`);
    console.log(`3. Run this test again: npm run test:product-quick-edit\n`);
    return;
  }

  // Get product version for optimistic locking
  const productVersion = await getProductVersion(productId);
  console.log(`${colors.blue}Product version: ${productVersion || 'N/A'}${colors.reset}\n`);

  // Test 1: Update name only
  console.log(`${colors.blue}Test 1: Update product name${colors.reset}\n`);
  results.push(await testEndpoint(
    'Update product name',
    'PATCH',
    `${API_BASE}/products/${productId}/quick-update`,
    {
      body: JSON.stringify({
        name: `Test Product ${Date.now()}`,
        version: productVersion,
      }),
    }
  ));

  // Test 2: Update price fields
  console.log(`${colors.blue}Test 2: Update price fields${colors.reset}\n`);
  results.push(await testEndpoint(
    'Update price fields',
    'PATCH',
    `${API_BASE}/products/${productId}/quick-update`,
    {
      body: JSON.stringify({
        regularPrice: 500000,
        salePrice: 400000,
        version: productVersion,
      }),
    }
  ));

  // Test 3: Update stock fields
  console.log(`${colors.blue}Test 3: Update stock fields${colors.reset}\n`);
  results.push(await testEndpoint(
    'Update stock fields',
    'PATCH',
    `${API_BASE}/products/${productId}/quick-update`,
    {
      body: JSON.stringify({
        manageStock: true,
        stockQuantity: 100,
        stockStatus: 'instock',
        version: productVersion,
      }),
    }
  ));

  // Test 4: Update status
  console.log(`${colors.blue}Test 4: Update product status${colors.reset}\n`);
  results.push(await testEndpoint(
    'Update product status',
    'PATCH',
    `${API_BASE}/products/${productId}/quick-update`,
    {
      body: JSON.stringify({
        status: 'publish',
        version: productVersion,
      }),
    }
  ));

  // Test 5: Update SKU
  console.log(`${colors.blue}Test 5: Update product SKU${colors.reset}\n`);
  results.push(await testEndpoint(
    'Update product SKU',
    'PATCH',
    `${API_BASE}/products/${productId}/quick-update`,
    {
      body: JSON.stringify({
        sku: `TEST-SKU-${Date.now()}`,
        version: productVersion,
      }),
    }
  ));

  // Test 6: Version mismatch (should fail)
  console.log(`${colors.blue}Test 6: Test version mismatch (should fail)${colors.reset}\n`);
  results.push(await testEndpoint(
    'Version mismatch test',
    'PATCH',
    `${API_BASE}/products/${productId}/quick-update`,
    {
      body: JSON.stringify({
        name: 'Test with wrong version',
        version: 99999, // Wrong version
      }),
    }
  ));

  // Test 7: Invalid sale price (should fail)
  console.log(`${colors.blue}Test 7: Test invalid sale price (should fail)${colors.reset}\n`);
  results.push(await testEndpoint(
    'Invalid sale price test',
    'PATCH',
    `${API_BASE}/products/${productId}/quick-update`,
    {
      body: JSON.stringify({
        regularPrice: 100000,
        salePrice: 200000, // Sale price > regular price (invalid)
        version: productVersion,
      }),
    }
  ));

  // Test 8: Empty update (should fail)
  console.log(`${colors.blue}Test 8: Test empty update (should fail)${colors.reset}\n`);
  results.push(await testEndpoint(
    'Empty update test',
    'PATCH',
    `${API_BASE}/products/${productId}/quick-update`,
    {
      body: JSON.stringify({
        version: productVersion,
      }),
    }
  ));

  // Test 9: Update with manageStock = false (should clear stockQuantity)
  console.log(`${colors.blue}Test 9: Disable manage stock${colors.reset}\n`);
  results.push(await testEndpoint(
    'Disable manage stock',
    'PATCH',
    `${API_BASE}/products/${productId}/quick-update`,
    {
      body: JSON.stringify({
        manageStock: false,
        version: productVersion,
      }),
    }
  ));

  // Test 10: Auto-sync stock status (stockQuantity > 0 should set stockStatus to 'instock')
  console.log(`${colors.blue}Test 10: Auto-sync stock status${colors.reset}\n`);
  results.push(await testEndpoint(
    'Auto-sync stock status',
    'PATCH',
    `${API_BASE}/products/${productId}/quick-update`,
    {
      body: JSON.stringify({
        manageStock: true,
        stockQuantity: 50,
        // Don't set stockStatus - should auto-sync to 'instock'
        version: productVersion,
      }),
    }
  ));

  // Print all results
  console.log(`\n${colors.cyan}=== Test Results ===${colors.reset}\n`);
  results.forEach(printResult);

  // Summary
  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

  console.log(`\n${colors.cyan}=== Summary ===${colors.reset}`);
  console.log(`Total tests: ${results.length}`);
  console.log(`${colors.green}Passed: ${successCount}${colors.reset}`);
  console.log(`${colors.red}Failed: ${failCount}${colors.reset}`);
  console.log(`Total duration: ${totalDuration}ms`);
  console.log(`Average duration: ${Math.round(totalDuration / results.length)}ms\n`);

  // Expected results
  console.log(`${colors.blue}Expected Results:${colors.reset}`);
  console.log(`- Tests 1-5, 9-10: Should pass (valid updates)`);
  console.log(`- Test 6: Should fail with VERSION_MISMATCH (409)`);
  console.log(`- Test 7: Should fail with validation error (400)`);
  console.log(`- Test 8: Should fail with validation error (400)\n`);
}

// Run tests
runTests().catch((error) => {
  console.error(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
  process.exit(1);
});

