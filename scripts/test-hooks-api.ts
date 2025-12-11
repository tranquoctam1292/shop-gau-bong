/**
 * Test script for updated hooks API endpoints
 * 
 * Tests all API endpoints that hooks use after Phase 4 update
 * 
 * Usage: npm run test:hooks-api
 * 
 * Prerequisites:
 * - Next.js dev server running on http://localhost:3000
 */

import dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
const API_BASE = `${BASE_URL}/api/cms`;

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
  hook: string;
  endpoint: string;
  method: string;
  status: number;
  success: boolean;
  error?: string;
  duration: number;
  data?: any;
}

const results: TestResult[] = [];

async function testEndpoint(
  hook: string,
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
    let data: any = undefined;

    if (!success) {
      try {
        const errorData = await response.json();
        error = errorData.error || `HTTP ${response.status}`;
      } catch {
        error = `HTTP ${response.status}`;
      }
    } else {
      try {
        data = await response.json();
      } catch {
        // No JSON response
      }
    }

    return {
      hook,
      endpoint: url.replace(BASE_URL, ''),
      method,
      status: response.status,
      success,
      error,
      duration,
      data,
    };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    return {
      hook,
      endpoint: url.replace(BASE_URL, ''),
      method,
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
    `${statusColor}${statusIcon}${colors.reset} [${result.hook}] ${result.method} ${result.endpoint}`
  );
  console.log(`   Status: ${statusColor}${result.status}${colors.reset}`);
  console.log(`   Duration: ${result.duration}ms`);
  
  if (result.data) {
    if (result.data.products) {
      console.log(`   Products: ${result.data.products.length}`);
      if (result.data.pagination) {
        console.log(`   Total: ${result.data.pagination.total}`);
      }
    } else if (result.data.product) {
      console.log(`   Product: ${result.data.product.name || 'N/A'}`);
    } else if (result.data.variations) {
      console.log(`   Variations: ${result.data.variations.length}`);
    } else if (result.data.categories) {
      console.log(`   Categories: ${result.data.categories.length}`);
    }
  }
  
  if (result.error) {
    console.log(`   ${colors.red}Error: ${result.error}${colors.reset}`);
  }
  console.log('');
}

async function runTests() {
  console.log(`${colors.cyan}=== Testing Hooks API Endpoints ===${colors.reset}\n`);
  console.log(`Base URL: ${BASE_URL}\n`);

  // Test 1: useProductsREST - Get products with pagination
  console.log(`${colors.blue}Testing useProductsREST hook endpoints...${colors.reset}\n`);
  
  results.push(await testEndpoint(
    'useProductsREST',
    'GET',
    `${API_BASE}/products?page=1&per_page=12`
  ));

  // Test 2: useProductsREST - With filters
  results.push(await testEndpoint(
    'useProductsREST',
    'GET',
    `${API_BASE}/products?page=1&per_page=12&search=test&min_price=100000`
  ));

  // Test 3: useProductsREST - With category filter
  results.push(await testEndpoint(
    'useProductsREST',
    'GET',
    `${API_BASE}/products?page=1&per_page=12&category=test`
  ));

  // Test 4: useProductsForHome - Featured products
  console.log(`${colors.blue}Testing useProductsForHome hook endpoints...${colors.reset}\n`);
  
  results.push(await testEndpoint(
    'useProductsForHome',
    'GET',
    `${API_BASE}/products?per_page=8&featured=true`
  ));

  // Test 5: useProductsForHome - With length filter
  results.push(await testEndpoint(
    'useProductsForHome',
    'GET',
    `${API_BASE}/products?per_page=8&min_length=50&max_length=100`
  ));

  // Test 6: useProductREST - Get product by ID
  console.log(`${colors.blue}Testing useProductREST hook endpoints...${colors.reset}\n`);
  
  // Try to get a product ID from the products list first
  const productsResponse = await testEndpoint(
    'useProductREST',
    'GET',
    `${API_BASE}/products?per_page=1`
  );
  
  if (productsResponse.success && productsResponse.data?.products?.length > 0) {
    const productId = productsResponse.data.products[0].id;
    // Extract ID from GraphQL format or use databaseId
    const actualId = productId?.split('/').pop() || productsResponse.data.products[0].databaseId;
    
    results.push(await testEndpoint(
      'useProductREST',
      'GET',
      `${API_BASE}/products/${actualId}`
    ));
  } else {
    // Test with invalid ID (should return 404)
    results.push(await testEndpoint(
      'useProductREST',
      'GET',
      `${API_BASE}/products/507f1f77bcf86cd799439011`
    ));
  }

  // Test 7: useProductREST - Get product by slug
  if (productsResponse.success && productsResponse.data?.products?.length > 0) {
    const productSlug = productsResponse.data.products[0].slug;
    results.push(await testEndpoint(
      'useProductREST',
      'GET',
      `${API_BASE}/products/${productSlug}`
    ));
  } else {
    // Test with invalid slug (should return 404)
    results.push(await testEndpoint(
      'useProductREST',
      'GET',
      `${API_BASE}/products/non-existent-product-slug`
    ));
  }

  // Test 8: useProductVariations - Get variations
  console.log(`${colors.blue}Testing useProductVariations hook endpoints...${colors.reset}\n`);
  
  if (productsResponse.success && productsResponse.data?.products?.length > 0) {
    const productId = productsResponse.data.products[0].id;
    const actualId = productId?.split('/').pop() || productsResponse.data.products[0].databaseId;
    
    results.push(await testEndpoint(
      'useProductVariations',
      'GET',
      `${API_BASE}/products/${actualId}/variations`
    ));
  } else {
    // Test with invalid product ID (should return 404)
    results.push(await testEndpoint(
      'useProductVariations',
      'GET',
      `${API_BASE}/products/507f1f77bcf86cd799439011/variations`
    ));
  }

  // Test 9: useProductAttributes - Get products for attributes
  console.log(`${colors.blue}Testing useProductAttributes hook endpoints...${colors.reset}\n`);
  
  results.push(await testEndpoint(
    'useProductAttributes',
    'GET',
    `${API_BASE}/products?per_page=100&page=1`
  ));

  // Test 10: useCategoriesREST - Get all categories
  console.log(`${colors.blue}Testing useCategoriesREST hook endpoints...${colors.reset}\n`);
  
  results.push(await testEndpoint(
    'useCategoriesREST',
    'GET',
    `${API_BASE}/categories`
  ));

  // Test 11: useCategoriesREST - Get top-level categories
  results.push(await testEndpoint(
    'useCategoriesREST',
    'GET',
    `${API_BASE}/categories?parent=0`
  ));

  // Test 12: useCategoriesREST - Get child categories (if any)
  const categoriesResponse = await testEndpoint(
    'useCategoriesREST',
    'GET',
    `${API_BASE}/categories`
  );
  
  if (categoriesResponse.success && categoriesResponse.data?.categories?.length > 0) {
    const categoryWithParent = categoriesResponse.data.categories.find(
      (cat: any) => cat.parentId !== null && cat.parentId !== 0
    );
    
    if (categoryWithParent) {
      results.push(await testEndpoint(
        'useCategoriesREST',
        'GET',
        `${API_BASE}/categories?parent=${categoryWithParent.parentId}`
      ));
    }
  }

  // Print Summary
  console.log(`\n${colors.cyan}=== Test Summary ===${colors.reset}\n`);

  const passed = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;
  const total = results.length;

  console.log(`Total Tests: ${total}`);
  console.log(`${colors.green}Passed: ${passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${failed}${colors.reset}`);
  console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%\n`);

  // Group by hook
  const byHook = results.reduce((acc, result) => {
    if (!acc[result.hook]) {
      acc[result.hook] = [];
    }
    acc[result.hook].push(result);
    return acc;
  }, {} as Record<string, TestResult[]>);

  console.log(`${colors.cyan}=== Results by Hook ===${colors.reset}\n`);
  
  Object.entries(byHook).forEach(([hook, hookResults]) => {
    const hookPassed = hookResults.filter(r => r.success).length;
    const hookTotal = hookResults.length;
    const hookColor = hookPassed === hookTotal ? colors.green : colors.yellow;
    
    console.log(`${hookColor}${hook}${colors.reset}: ${hookPassed}/${hookTotal} passed`);
    hookResults.forEach(printResult);
  });

  // Exit with error code if any tests failed
  if (failed > 0) {
    console.log(`${colors.yellow}Note: Some tests may fail if the database is empty or server is not running.${colors.reset}`);
    console.log(`${colors.yellow}404 errors for invalid IDs are expected behavior.${colors.reset}\n`);
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

