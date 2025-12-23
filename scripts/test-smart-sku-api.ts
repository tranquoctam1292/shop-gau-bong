/**
 * Test Script: Smart SKU API Routes
 * 
 * Tests all SKU API endpoints:
 * - POST /api/admin/sku/generate
 * - POST /api/admin/sku/generate-bulk
 * - GET /api/admin/sku/settings
 * - POST /api/admin/sku/settings
 * - DELETE /api/admin/sku/settings
 * - GET /api/admin/sku/abbreviations
 * - POST /api/admin/sku/abbreviations
 * - PUT /api/admin/sku/abbreviations/[id]
 * - DELETE /api/admin/sku/abbreviations/[id]
 * 
 * Usage: npm run test:smart-sku-api
 * or: tsx scripts/test-smart-sku-api.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') });

const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const TEST_ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || 'admin@example.com';
const TEST_ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || 'admin123';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  details?: any;
  response?: any;
}

// Cookie store for session
let sessionCookies: string = '';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
};

const results: TestResult[] = [];

/**
 * Login và lấy session cookies
 */
async function login(): Promise<boolean> {
  console.log('🔐 Logging in as admin...');
  console.log(`   Email: ${TEST_ADMIN_EMAIL}`);

  try {
    // Use a cookie jar approach - make request with credentials
    const response = await fetch(`${API_BASE_URL}/api/auth/callback/credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        email: TEST_ADMIN_EMAIL,
        password: TEST_ADMIN_PASSWORD,
        redirect: 'false',
        json: 'true',
      }),
      credentials: 'include',
    });

    // Get all Set-Cookie headers
    const setCookieHeaders: string[] = [];
    
    // Try different ways to get cookies
    if (response.headers.getSetCookie) {
      setCookieHeaders.push(...response.headers.getSetCookie());
    }
    
    // Also check headers using forEach (Node.js fetch API)
    try {
      response.headers.forEach((value, key) => {
        if (key.toLowerCase() === 'set-cookie') {
          setCookieHeaders.push(value);
        }
      });
    } catch (e) {
      // Ignore if forEach not available
    }

    if (setCookieHeaders.length > 0) {
      // Extract all cookies (including session token)
      const cookies = setCookieHeaders
        .map((cookie) => cookie.split(';')[0])
        .filter((cookie) => cookie.trim().length > 0);
      
      sessionCookies = cookies.join('; ');
      console.log('   ✅ Login successful');
      console.log(`   Found ${cookies.length} cookies`);
      // Log cookie names only (not values for security)
      const cookieNames = cookies.map((c) => c.split('=')[0]).join(', ');
      console.log(`   Cookies: ${cookieNames}`);
      return true;
    }

    console.log('   ❌ Login failed - No session cookies received');
    console.log(`   Response status: ${response.status}`);
    return false;
  } catch (error: any) {
    console.log(`   ❌ Login failed: ${error.message}`);
    return false;
  }
}

/**
 * Make authenticated request
 */
async function makeAuthenticatedRequest(
  url: string,
  method: string = 'GET',
  body?: any
): Promise<{ ok: boolean; status: number; data: any; headers: Headers }> {
  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Cookie: sessionCookies,
      },
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'include', // Important for cookies
    });

    const data = await response.json().catch(() => ({}));

    return {
      ok: response.ok,
      status: response.status,
      data,
      headers: response.headers,
    };
  } catch (error: any) {
    return {
      ok: false,
      status: 0,
      data: { error: error.message },
      headers: new Headers(),
    };
  }
}

/**
 * Test helper
 */
async function test(name: string, fn: () => Promise<any>): Promise<void> {
  try {
    const result = await fn();
    results.push({
      name,
      passed: true,
      details: result,
    });
    console.log(`${colors.green}   ✅ ${name}${colors.reset}`);
  } catch (error: any) {
    results.push({
      name,
      passed: false,
      error: error.message,
    });
    console.log(`${colors.red}   ❌ ${name}: ${error.message}${colors.reset}`);
  }
}

async function testSmartSkuAPI() {
  console.log(`${colors.cyan}🧪 Testing Smart SKU API Routes...${colors.reset}\n`);
  console.log(`🌐 API Base URL: ${API_BASE_URL}\n`);

  // Step 1: Login
  console.log('📡 Step 1: Authentication');
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log('\n❌ Cannot proceed without authentication');
    console.log('   Please ensure:');
    console.log('   1. Admin user exists (run: npm run create:admin-user)');
    console.log(`   2. Credentials are correct (email: ${TEST_ADMIN_EMAIL})`);
    console.log('   3. Server is running (npm run dev)');
    process.exit(1);
  }
  results.push({ name: 'Authentication', passed: true });

  // Step 2: Test SKU Settings
  console.log(`\n${colors.blue}📋 Step 2: SKU Settings API${colors.reset}`);

  let globalSettingId: string | null = null;
  let categorySettingId: string | null = null;
  let testCategoryId: string | null = null;

  // 2.1: GET all settings (should return empty or existing)
  await test('GET /api/admin/sku/settings', async () => {
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/api/admin/sku/settings`);
    if (!response.ok) throw new Error(`Status: ${response.status}`);
    if (!response.data.success) throw new Error(response.data.message);
    return response.data;
  });

  // 2.2: POST global setting
  await test('POST /api/admin/sku/settings (global)', async () => {
    const response = await makeAuthenticatedRequest(
      `${API_BASE_URL}/api/admin/sku/settings`,
      'POST',
      {
        categoryId: null,
        pattern: '{CATEGORY_CODE}-{PRODUCT_NAME}-{INCREMENT}',
        separator: '-',
        caseType: 'UPPER',
      }
    );
    if (!response.ok) throw new Error(`Status: ${response.status}`);
    if (!response.data.success) throw new Error(response.data.message);
    if (response.data.data?._id) {
      globalSettingId = response.data.data._id.toString();
    }
    return response.data;
  });

  // 2.3: GET setting for specific category (should fallback to global)
  await test('GET /api/admin/sku/settings?categoryId=xxx (fallback to global)', async () => {
    // First, get a category ID
    const categoriesResponse = await makeAuthenticatedRequest(
      `${API_BASE_URL}/api/admin/categories?per_page=1`
    );
    if (categoriesResponse.ok && categoriesResponse.data.categories?.[0]?.id) {
      testCategoryId = categoriesResponse.data.categories[0].id;
      const response = await makeAuthenticatedRequest(
        `${API_BASE_URL}/api/admin/sku/settings?categoryId=${testCategoryId}`
      );
      if (!response.ok) throw new Error(`Status: ${response.status}`);
      return response.data;
    }
    return { skipped: true, message: 'No categories found' };
  });

  // 2.4: POST category-specific setting
  if (testCategoryId) {
    await test('POST /api/admin/sku/settings (category-specific)', async () => {
      const response = await makeAuthenticatedRequest(
        `${API_BASE_URL}/api/admin/sku/settings`,
        'POST',
        {
          categoryId: testCategoryId,
          pattern: '{CATEGORY_CODE}-{PRODUCT_NAME}-{ATTRIBUTE_VALUE}-{INCREMENT}',
          separator: '-',
          caseType: 'UPPER',
        }
      );
      if (!response.ok) throw new Error(`Status: ${response.status}`);
      if (!response.data.success) throw new Error(response.data.message);
      if (response.data.data?._id) {
        categorySettingId = response.data.data._id.toString();
      }
      return response.data;
    });
  }

  // Step 3: Test SKU Generation
  console.log(`\n${colors.blue}🔧 Step 3: SKU Generation API${colors.reset}`);

  // 3.1: Generate SKU (preview mode)
  await test('POST /api/admin/sku/generate (preview mode)', async () => {
    const response = await makeAuthenticatedRequest(
      `${API_BASE_URL}/api/admin/sku/generate`,
      'POST',
      {
        productName: 'Gấu Bông Test',
        categoryId: testCategoryId || undefined,
        previewMode: true,
      }
    );
    if (!response.ok) throw new Error(`Status: ${response.status}`);
    if (!response.data.success) throw new Error(response.data.message);
    if (!response.data.data?.sku) throw new Error('Missing SKU in response');
    if (!response.data.data.sku.includes('###')) {
      throw new Error('Preview mode should show ### placeholder');
    }
    return response.data;
  });

  // 3.2: Generate SKU (actual mode)
  await test('POST /api/admin/sku/generate (actual mode)', async () => {
    const response = await makeAuthenticatedRequest(
      `${API_BASE_URL}/api/admin/sku/generate`,
      'POST',
      {
        productName: 'Gấu Bông Test',
        categoryId: testCategoryId || undefined,
        previewMode: false,
      }
    );
    if (!response.ok) throw new Error(`Status: ${response.status}`);
    if (!response.data.success) throw new Error(response.data.message);
    if (!response.data.data?.sku) throw new Error('Missing SKU in response');
    if (!response.data.data.sku_normalized) {
      throw new Error('Missing sku_normalized in response');
    }
    return response.data;
  });

  // 3.3: Generate SKU with attributes
  await test('POST /api/admin/sku/generate (with attributes)', async () => {
    const response = await makeAuthenticatedRequest(
      `${API_BASE_URL}/api/admin/sku/generate`,
      'POST',
      {
        productName: 'Gấu Bông Test',
        categoryId: testCategoryId || undefined,
        attributes: [
          { key: 'size', value: 'L' },
          { key: 'color', value: 'Đỏ' },
        ],
        isVariant: true,
        previewMode: false,
      }
    );
    if (!response.ok) throw new Error(`Status: ${response.status}`);
    if (!response.data.success) throw new Error(response.data.message);
    return response.data;
  });

  // 3.4: Bulk generate SKU
  await test('POST /api/admin/sku/generate-bulk', async () => {
    const response = await makeAuthenticatedRequest(
      `${API_BASE_URL}/api/admin/sku/generate-bulk`,
      'POST',
      {
        products: [
          {
            productName: 'Product 1',
            categoryId: testCategoryId || undefined,
          },
          {
            productName: 'Product 2',
            categoryId: testCategoryId || undefined,
            variants: [
              {
                attributes: [
                  { key: 'size', value: 'M' },
                  { key: 'color', value: 'Xanh' },
                ],
              },
            ],
          },
        ],
      }
    );
    if (!response.ok) throw new Error(`Status: ${response.status}`);
    if (!response.data.success) throw new Error(response.data.message);
    if (!response.data.data?.results || response.data.data.results.length !== 2) {
      throw new Error('Invalid results count');
    }
    return response.data;
  });

  // Step 4: Test Abbreviations
  console.log(`\n${colors.blue}📚 Step 4: SKU Abbreviations API${colors.reset}`);

  let abbreviationId: string | null = null;

  // 4.1: GET abbreviations
  await test('GET /api/admin/sku/abbreviations', async () => {
    const response = await makeAuthenticatedRequest(
      `${API_BASE_URL}/api/admin/sku/abbreviations?type=ATTRIBUTE`
    );
    if (!response.ok) throw new Error(`Status: ${response.status}`);
    if (!response.data.success) throw new Error(response.data.message);
    return response.data;
  });

  // 4.2: POST abbreviation
  await test('POST /api/admin/sku/abbreviations', async () => {
    const response = await makeAuthenticatedRequest(
      `${API_BASE_URL}/api/admin/sku/abbreviations`,
      'POST',
      {
        type: 'ATTRIBUTE',
        originalValue: 'Màu Đỏ Test',
        shortCode: 'DO',
      }
    );
    if (!response.ok) throw new Error(`Status: ${response.status}`);
    if (!response.data.success) throw new Error(response.data.message);
    if (response.data.data?._id) {
      abbreviationId = response.data.data._id.toString();
    }
    return response.data;
  });

  // 4.3: PUT abbreviation
  if (abbreviationId) {
    await test('PUT /api/admin/sku/abbreviations/[id]', async () => {
      const response = await makeAuthenticatedRequest(
        `${API_BASE_URL}/api/admin/sku/abbreviations/${abbreviationId}`,
        'PUT',
        {
          shortCode: 'RED',
        }
      );
      if (!response.ok) throw new Error(`Status: ${response.status}`);
      if (!response.data.success) throw new Error(response.data.message);
      return response.data;
    });
  }

  // 4.4: GET with search
  await test('GET /api/admin/sku/abbreviations?search=Đỏ', async () => {
    const response = await makeAuthenticatedRequest(
      `${API_BASE_URL}/api/admin/sku/abbreviations?search=Đỏ`
    );
    if (!response.ok) throw new Error(`Status: ${response.status}`);
    if (!response.data.success) throw new Error(response.data.message);
    return response.data;
  });

  // Step 5: Cleanup
  console.log(`\n${colors.blue}🧹 Step 5: Cleanup${colors.reset}`);

  // 5.1: DELETE category-specific setting
  if (testCategoryId && categorySettingId) {
    await test('DELETE /api/admin/sku/settings?categoryId=xxx', async () => {
      const response = await makeAuthenticatedRequest(
        `${API_BASE_URL}/api/admin/sku/settings?categoryId=${testCategoryId}`,
        'DELETE'
      );
      if (!response.ok) throw new Error(`Status: ${response.status}`);
      return response.data;
    });
  }

  // 5.2: DELETE abbreviation
  if (abbreviationId) {
    await test('DELETE /api/admin/sku/abbreviations/[id]', async () => {
      const response = await makeAuthenticatedRequest(
        `${API_BASE_URL}/api/admin/sku/abbreviations/${abbreviationId}`,
        'DELETE'
      );
      if (!response.ok) throw new Error(`Status: ${response.status}`);
      return response.data;
    });
  }

  // Summary
  console.log(`\n${colors.cyan}📊 Test Summary${colors.reset}`);
  console.log('='.repeat(60));
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  const total = results.length;

  console.log(`\n${colors.green}✅ Passed: ${passed}${colors.reset}`);
  if (failed > 0) {
    console.log(`${colors.red}❌ Failed: ${failed}${colors.reset}`);
  }
  console.log(`${colors.cyan}📦 Total: ${total}${colors.reset}\n`);

  if (failed > 0) {
    console.log(`${colors.yellow}Failed Tests:${colors.reset}`);
    results
      .filter((r) => !r.passed)
      .forEach((r) => {
        console.log(`   ❌ ${r.name}: ${r.error}`);
      });
    console.log('');
  }

  if (failed === 0) {
    console.log(`${colors.green}🎉 All tests passed!${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`${colors.yellow}⚠️  Some tests failed. Please review errors above.${colors.reset}\n`);
    process.exit(1);
  }
}

// Run tests
testSmartSkuAPI().catch((error) => {
  console.error(`${colors.red}❌ Test suite failed: ${error.message}${colors.reset}`);
  if (error.stack) {
    console.error(error.stack);
  }
  process.exit(1);
});

