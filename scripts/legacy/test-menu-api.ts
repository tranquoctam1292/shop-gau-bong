/**
 * Test Menu Management API Routes
 * 
 * Tests all Menu Management API endpoints
 * 
 * Usage: npx tsx scripts/test-menu-api.ts
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
      // Try to get all cookies including session token
      const allCookies = cookies
        .map((cookie) => cookie.split(';')[0])
        .join('; ');
      
      // Check if we have session token
      const hasSessionToken = allCookies.includes('next-auth.session-token');
      
      if (hasSessionToken) {
        sessionCookies = allCookies;
        console.log('   ✅ Login successful (session token received)');
        return true;
      } else {
        // Only CSRF token, try to get session by calling session endpoint
        console.log('   ⚠️  Only CSRF token received, trying to get session...');
        sessionCookies = allCookies; // Keep CSRF token
        
        // Try to get session
        try {
          const sessionResponse = await fetch(`${API_BASE_URL}/api/auth/session`, {
            headers: {
              'Cookie': sessionCookies,
            },
            credentials: 'include',
          });
          
          if (sessionResponse.ok) {
            const sessionData = await sessionResponse.json();
            if (sessionData?.user) {
              console.log('   ✅ Session verified');
              return true;
            }
          }
        } catch (e) {
          // Ignore session check error
        }
      }
    }

    // Check if TEST_SESSION_COOKIE is set in env
    if (process.env.TEST_SESSION_COOKIE) {
      sessionCookies = process.env.TEST_SESSION_COOKIE;
      console.log('   ✅ Using TEST_SESSION_COOKIE from .env.local');
      return true;
    }

    console.log('   ⚠️  No cookies received from login endpoint');
    console.log('   💡 To test with authentication:');
    console.log('      1. Start server: npm run dev');
    console.log('      2. Login in browser: http://localhost:3000/admin/login');
    console.log('      3. Open DevTools → Application → Cookies');
    console.log('      4. Copy "next-auth.session-token" value');
    console.log('      5. Add to .env.local: TEST_SESSION_COOKIE="next-auth.session-token=YOUR_TOKEN"');
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
    credentials: 'include',
  });
}

/**
 * Test function
 */
async function test(name: string, fn: () => Promise<any>): Promise<void> {
  try {
    const data = await fn();
    results.push({ name, passed: true, data });
    console.log(`   ✅ ${name}`);
  } catch (error: any) {
    results.push({ name, passed: false, error: error.message });
    console.log(`   ❌ ${name}: ${error.message}`);
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('🧪 Testing Menu Management API Routes\n');
  console.log(`   Base URL: ${API_BASE_URL}\n`);

  // Login first
  const loggedIn = await login();
  if (!loggedIn) {
    console.log('\n⚠️  Warning: Could not login automatically.');
    console.log('   Tests will run but may fail with 401 Unauthorized.');
    console.log('   To fix:');
    console.log('   1. Start server: npm run dev');
    console.log('   2. Login in browser: http://localhost:3000/admin/login');
    console.log('   3. Copy session cookie from DevTools → Application → Cookies');
    console.log('   4. Add to .env.local: TEST_SESSION_COOKIE="next-auth.session-token=..."\n');
  }

  let createdMenuId: string = '';
  let createdMenuItemId: string = '';

  // Test 1: Create Menu
  await test('POST /api/admin/menus - Create menu', async () => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/admin/menus`, {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test Menu',
        location: 'header',
        status: 'active',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    createdMenuId = data.menu.id;
    return data;
  });

  // Test 2: List Menus
  await test('GET /api/admin/menus - List menus', async () => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/admin/menus`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed: ${JSON.stringify(error)}`);
    }

    return await response.json();
  });

  // Test 3: Get Menu Detail (Tree)
  await test('GET /api/admin/menus/{id}?format=tree - Get menu detail (tree)', async () => {
    if (!createdMenuId) throw new Error('No menu ID available');

    const response = await fetchWithAuth(
      `${API_BASE_URL}/api/admin/menus/${createdMenuId}?format=tree`
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed: ${JSON.stringify(error)}`);
    }

    return await response.json();
  });

  // Test 4: Get Menu Detail (Flat)
  await test('GET /api/admin/menus/{id}?format=flat - Get menu detail (flat)', async () => {
    if (!createdMenuId) throw new Error('No menu ID available');

    const response = await fetchWithAuth(
      `${API_BASE_URL}/api/admin/menus/${createdMenuId}?format=flat`
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed: ${JSON.stringify(error)}`);
    }

    return await response.json();
  });

  // Test 5: Create Menu Item (Custom Link)
  await test('POST /api/admin/menu-items - Create custom link item', async () => {
    if (!createdMenuId) throw new Error('No menu ID available');

    const response = await fetchWithAuth(`${API_BASE_URL}/api/admin/menu-items`, {
      method: 'POST',
      body: JSON.stringify({
        menuId: createdMenuId,
        title: 'Trang chủ',
        type: 'custom',
        url: '/',
        target: '_self',
        order: 0,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    createdMenuItemId = data.item.id;
    return data;
  });

  // Test 6: Get Menu Item Detail
  await test('GET /api/admin/menu-items/{id} - Get menu item detail', async () => {
    if (!createdMenuItemId) throw new Error('No menu item ID available');

    const response = await fetchWithAuth(
      `${API_BASE_URL}/api/admin/menu-items/${createdMenuItemId}`
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed: ${JSON.stringify(error)}`);
    }

    return await response.json();
  });

  // Test 7: Update Menu Item
  await test('PUT /api/admin/menu-items/{id} - Update menu item', async () => {
    if (!createdMenuItemId) throw new Error('No menu item ID available');

    const response = await fetchWithAuth(
      `${API_BASE_URL}/api/admin/menu-items/${createdMenuItemId}`,
      {
        method: 'PUT',
        body: JSON.stringify({
          title: 'Trang chủ (Updated)',
          cssClass: 'home-link',
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed: ${JSON.stringify(error)}`);
    }

    return await response.json();
  });

  // Test 8: Update Menu
  await test('PUT /api/admin/menus/{id} - Update menu', async () => {
    if (!createdMenuId) throw new Error('No menu ID available');

    const response = await fetchWithAuth(`${API_BASE_URL}/api/admin/menus/${createdMenuId}`, {
      method: 'PUT',
      body: JSON.stringify({
        name: 'Test Menu (Updated)',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed: ${JSON.stringify(error)}`);
    }

    return await response.json();
  });

  // Test 9: Delete Menu Item
  await test('DELETE /api/admin/menu-items/{id} - Delete menu item', async () => {
    if (!createdMenuItemId) throw new Error('No menu item ID available');

    const response = await fetchWithAuth(
      `${API_BASE_URL}/api/admin/menu-items/${createdMenuItemId}`,
      {
        method: 'DELETE',
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed: ${JSON.stringify(error)}`);
    }

    return await response.json();
  });

  // Test 10: Delete Menu
  await test('DELETE /api/admin/menus/{id} - Delete menu', async () => {
    if (!createdMenuId) throw new Error('No menu ID available');

    const response = await fetchWithAuth(`${API_BASE_URL}/api/admin/menus/${createdMenuId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed: ${JSON.stringify(error)}`);
    }

    return await response.json();
  });

  // Print summary
  console.log('\n📊 Test Summary:');
  console.log('─────────────────────────────────────────');
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  console.log(`   Total: ${results.length}`);
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);

  if (failed > 0) {
    console.log('\n❌ Failed Tests:');
    results
      .filter((r) => !r.passed)
      .forEach((r) => {
        console.log(`   - ${r.name}: ${r.error}`);
      });
  }

  console.log('\n');
}

// Run tests
runTests().catch((error) => {
  console.error('❌ Test runner error:', error);
  process.exit(1);
});

