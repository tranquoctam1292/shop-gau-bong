/**
 * Test PIM API Routes
 * 
 * Tests all PIM API endpoints for soft delete, restore, force delete, quick update, and bulk actions
 * 
 * Usage: npx tsx scripts/test-pim-api.ts
 */

// Load environment variables from .env.local
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') });

const API_BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

// Test credentials (should match your admin user)
const TEST_ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || 'admin@example.com';
const TEST_ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || 'admin123';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  data?: any;
}

const results: TestResult[] = [];

// Cookie store for session
let sessionCookies: string = '';

/**
 * Login và lấy session cookies
 */
async function login(): Promise<boolean> {
  console.log('🔐 Logging in as admin...');
  console.log(`   Email: ${TEST_ADMIN_EMAIL}`);

  try {
    // Try NextAuth callback endpoint
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
    });

    // Get cookies from response headers
    const cookies: string[] = [];
    response.headers.forEach((value, key) => {
      if (key.toLowerCase() === 'set-cookie') {
        cookies.push(value);
      }
    });

    if (cookies.length > 0) {
      sessionCookies = cookies
        .map((cookie) => cookie.split(';')[0])
        .join('; ');
      console.log('   ✅ Login successful');
      return true;
    }

    console.log('   ⚠️  No cookies received, trying alternative method...');
    console.log('   💡 Note: You may need to login manually in browser and copy session cookie');
    return false;
  } catch (error: any) {
    console.log(`   ❌ Login failed: ${error.message}`);
    return false;
  }
}

/**
 * Make authenticated request
 */
async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers({
    'Content-Type': 'application/json',
    ...(options.headers as HeadersInit),
  });

  // Add cookies if available
  if (sessionCookies) {
    headers.set('Cookie', sessionCookies);
  }

  return fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Important for cookies
  });
}

async function test(name: string, fn: () => Promise<any>): Promise<void> {
  try {
    console.log(`\n🧪 Testing: ${name}...`);
    const data = await fn();
    results.push({ name, passed: true, data });
    console.log(`   ✅ PASSED`);
  } catch (error: any) {
    results.push({ name, passed: false, error: error.message });
    console.log(`   ❌ FAILED: ${error.message}`);
  }
}

async function runTests() {
  console.log('🚀 Starting PIM API Tests\n');
  console.log(`API Base URL: ${API_BASE_URL}\n`);

  // Step 1: Login
  console.log('📡 Step 1: Authentication');
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log('\n⚠️  Authentication failed or skipped');
    console.log('   Tests will run without authentication (may fail with 401)');
    console.log('   To test with auth:');
    console.log('   1. Login in browser: http://localhost:3000/admin/login');
    console.log('   2. Copy session cookie from browser DevTools');
    console.log('   3. Set sessionCookies variable in script\n');
  } else {
    results.push({ name: 'Authentication', passed: true });
  }

  // Test 1: GET products with trashed filter
  await test('GET /api/admin/products?trashed=false', async () => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/admin/products?trashed=false&per_page=5`);
    if (!response.ok) throw new Error(`Status: ${response.status}`);
    const data = await response.json();
    if (!data.products || !Array.isArray(data.products)) {
      throw new Error('Invalid response format');
    }
    if (!data.filters || typeof data.filters.trashCount !== 'number') {
      throw new Error('Missing trashCount in filters');
    }
    return data;
  });

  // Test 2: GET products with trashed=true
  await test('GET /api/admin/products?trashed=true', async () => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/admin/products?trashed=true&per_page=5`);
    if (!response.ok) throw new Error(`Status: ${response.status}`);
    const data = await response.json();
    if (!data.products || !Array.isArray(data.products)) {
      throw new Error('Invalid response format');
    }
    return data;
  });

  // Test 3: GET products with status=trash
  await test('GET /api/admin/products?status=trash', async () => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/admin/products?status=trash&per_page=5`);
    if (!response.ok) throw new Error(`Status: ${response.status}`);
    const data = await response.json();
    if (!data.products || !Array.isArray(data.products)) {
      throw new Error('Invalid response format');
    }
    return data;
  });

  // Test 4: GET products with filters (category, price_min, price_max)
  await test('GET /api/admin/products with filters', async () => {
    const response = await fetchWithAuth(
      `${API_BASE_URL}/api/admin/products?price_min=10000&price_max=1000000&per_page=5`
    );
    if (!response.ok) throw new Error(`Status: ${response.status}`);
    const data = await response.json();
    if (!data.products || !Array.isArray(data.products)) {
      throw new Error('Invalid response format');
    }
    return data;
  });

  // Note: The following tests require actual product IDs from your database
  // You may need to adjust these tests based on your test data

  // Test 5: Soft delete (requires valid product ID)
  // await test('DELETE /api/admin/products/[id] (soft delete)', async () => {
  //   const productId = 'YOUR_TEST_PRODUCT_ID';
  //   const response = await fetchWithAuth(`${API_BASE_URL}/api/admin/products/${productId}`, {
  //     method: 'DELETE',
  //   });
  //   if (!response.ok) throw new Error(`Status: ${response.status}`);
  //   const data = await response.json();
  //   if (!data.success || data.message !== 'Đã chuyển vào thùng rác') {
  //     throw new Error('Invalid response');
  //   }
  //   return data;
  // });

  // Test 6: Restore (requires product in trash)
  // await test('PATCH /api/admin/products/[id]/restore', async () => {
  //   const productId = 'YOUR_TEST_PRODUCT_ID_IN_TRASH';
  //   const response = await fetchWithAuth(`${API_BASE_URL}/api/admin/products/${productId}/restore`, {
  //     method: 'PATCH',
  //   });
  //   if (!response.ok) throw new Error(`Status: ${response.status}`);
  //   const data = await response.json();
  //   if (!data.success || data.message !== 'Đã khôi phục') {
  //     throw new Error('Invalid response');
  //   }
  //   return data;
  // });

  // Test 7: Quick update price
  // await test('PATCH /api/admin/products/[id]/quick-update (price)', async () => {
  //   const productId = 'YOUR_TEST_PRODUCT_ID';
  //   const response = await fetchWithAuth(`${API_BASE_URL}/api/admin/products/${productId}/quick-update`, {
  //     method: 'PATCH',
  //     body: JSON.stringify({ price: 150000 }),
  //   });
  //   if (!response.ok) throw new Error(`Status: ${response.status}`);
  //   const data = await response.json();
  //   if (!data.success) {
  //     throw new Error('Invalid response');
  //   }
  //   return data;
  // });

  // Test 8: Quick update stock
  // await test('PATCH /api/admin/products/[id]/quick-update (stock)', async () => {
  //   const productId = 'YOUR_TEST_PRODUCT_ID';
  //   const response = await fetchWithAuth(`${API_BASE_URL}/api/admin/products/${productId}/quick-update`, {
  //     method: 'PATCH',
  //     body: JSON.stringify({ stockQuantity: 50 }),
  //   });
  //   if (!response.ok) throw new Error(`Status: ${response.status}`);
  //   const data = await response.json();
  //   if (!data.success) {
  //     throw new Error('Invalid response');
  //   }
  //   return data;
  // });

  // Test 9: Bulk action - soft delete
  // await test('POST /api/admin/products/bulk-action (soft_delete)', async () => {
  //   const response = await fetchWithAuth(`${API_BASE_URL}/api/admin/products/bulk-action`, {
  //     method: 'POST',
  //     body: JSON.stringify({
  //       ids: ['YOUR_TEST_PRODUCT_ID_1', 'YOUR_TEST_PRODUCT_ID_2'],
  //       action: 'soft_delete',
  //     }),
  //   });
  //   if (!response.ok) throw new Error(`Status: ${response.status}`);
  //   const data = await response.json();
  //   if (!data.success) {
  //     throw new Error('Invalid response');
  //   }
  //   return data;
  // });

  // Test 10: Bulk action - update status
  // await test('POST /api/admin/products/bulk-action (update_status)', async () => {
  //   const response = await fetchWithAuth(`${API_BASE_URL}/api/admin/products/bulk-action`, {
  //     method: 'POST',
  //     body: JSON.stringify({
  //       ids: ['YOUR_TEST_PRODUCT_ID_1'],
  //       action: 'update_status',
  //       value: 'publish',
  //     }),
  //   });
  //   if (!response.ok) throw new Error(`Status: ${response.status}`);
  //   const data = await response.json();
  //   if (!data.success) {
  //     throw new Error('Invalid response');
  //   }
  //   return data;
  // });

  // Print summary
  console.log('\n\n📊 Test Summary:');
  console.log('═══════════════════════════════════════');
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Total: ${results.length}`);
  
  if (failed > 0) {
    console.log('\n❌ Failed Tests:');
    results
      .filter((r) => !r.passed)
      .forEach((r) => {
        console.log(`   - ${r.name}: ${r.error}`);
      });
  }
  
  console.log('\n');
  
  // Exit with appropriate code
  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch((error) => {
  console.error('\n❌ Test runner error:', error);
  process.exit(1);
});

