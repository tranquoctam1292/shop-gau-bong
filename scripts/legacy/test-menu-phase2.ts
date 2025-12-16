/**
 * Test Menu Management Phase 2 API Routes
 * 
 * Tests bulk structure update and public menu API
 * 
 * Usage: npx tsx scripts/test-menu-phase2.ts
 */

// Load environment variables from .env.local
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') });

const API_BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

// Test credentials
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
let sessionCookies: string = process.env.TEST_SESSION_COOKIE || '';

/**
 * Make authenticated request
 */
async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers({
    'Content-Type': 'application/json',
    ...(options.headers as HeadersInit),
  });

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
  console.log('🧪 Testing Menu Management Phase 2 API Routes\n');
  console.log(`   Base URL: ${API_BASE_URL}\n`);

  if (!sessionCookies) {
    console.log('⚠️  No session cookie found. Set TEST_SESSION_COOKIE in .env.local\n');
  }

  let createdMenuId: string = '';
  let createdItemIds: string[] = [];

  // Setup: Create menu and items for testing
  await test('Setup: Create test menu', async () => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/admin/menus`, {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test Menu Phase 2',
        location: 'test-header',
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

  // Create menu items for structure testing
  await test('Setup: Create menu items', async () => {
    if (!createdMenuId) throw new Error('No menu ID available');

    const items = [
      { title: 'Home', type: 'custom', url: '/', order: 0 },
      { title: 'Products', type: 'custom', url: '/products', order: 1 },
      { title: 'About', type: 'custom', url: '/about', order: 2 },
    ];

    const createdItems = [];
    for (const item of items) {
      const response = await fetchWithAuth(`${API_BASE_URL}/api/admin/menu-items`, {
        method: 'POST',
        body: JSON.stringify({
          menuId: createdMenuId,
          ...item,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Failed to create item: ${JSON.stringify(error)}`);
      }

      const data = await response.json();
      createdItems.push(data.item.id);
    }

    createdItemIds = createdItems;
    return { createdItems };
  });

  // Test 1: Bulk Structure Update
  await test('POST /api/admin/menus/{id}/structure - Bulk update structure', async () => {
    if (!createdMenuId || createdItemIds.length < 3) {
      throw new Error('Setup incomplete');
    }

    const structure = [
      {
        id: createdItemIds[0],
        children: [
          {
            id: createdItemIds[1],
            children: [],
          },
        ],
      },
      {
        id: createdItemIds[2],
        children: [],
      },
    ];

    const response = await fetchWithAuth(
      `${API_BASE_URL}/api/admin/menus/${createdMenuId}/structure`,
      {
        method: 'POST',
        body: JSON.stringify(structure),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed: ${JSON.stringify(error)}`);
    }

    return await response.json();
  });

  // Test 2: Validate Max Depth (should fail)
  // First, create one more item for depth testing
  let depthTestItemId: string = '';
  await test('Setup: Create item for depth test', async () => {
    if (!createdMenuId) throw new Error('No menu ID available');

    const response = await fetchWithAuth(`${API_BASE_URL}/api/admin/menu-items`, {
      method: 'POST',
      body: JSON.stringify({
        menuId: createdMenuId,
        title: 'Depth Test',
        type: 'custom',
        url: '/test',
        order: 3,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    depthTestItemId = data.item.id;
    return data;
  });

  await test('POST /api/admin/menus/{id}/structure - Max depth validation (should fail)', async () => {
    if (!createdMenuId || createdItemIds.length < 3 || !depthTestItemId) {
      throw new Error('Setup incomplete');
    }

    // Try to create structure with depth = 3 (should fail, max is 2)
    // Level 0: item[0]
    // Level 1: item[1] (child of 0)
    // Level 2: item[2] (child of 1)
    // Level 3: depthTestItemId (child of 2) - THIS SHOULD FAIL
    const deepStructure = [
      {
        id: createdItemIds[0],
        children: [
          {
            id: createdItemIds[1],
            children: [
              {
                id: createdItemIds[2],
                children: [
                  {
                    id: depthTestItemId,
                    children: [], // Level 3 - should fail
                  },
                ],
              },
            ],
          },
        ],
      },
    ];

    const response = await fetchWithAuth(
      `${API_BASE_URL}/api/admin/menus/${createdMenuId}/structure`,
      {
        method: 'POST',
        body: JSON.stringify(deepStructure),
      }
    );

    if (response.ok) {
      throw new Error('Should have failed with max depth error');
    }

    const error = await response.json();
    if (!error.error || !error.error.includes('Maximum depth')) {
      throw new Error(`Unexpected error: ${JSON.stringify(error)}`);
    }

    return { expectedError: error };
  });

  // Test 3: Public API - Get Menu by Location
  await test('GET /api/cms/menus/location/{location} - Public API', async () => {
    const response = await fetch(`${API_BASE_URL}/api/cms/menus/location/test-header`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    
    // Verify structure
    if (!data.menu || !data.menu.items) {
      throw new Error('Invalid menu structure');
    }

    // Verify tree structure (Products should be child of Home)
    const homeItem = data.menu.items.find((item: any) => item.title === 'Home');
    if (!homeItem || !homeItem.children || homeItem.children.length === 0) {
      throw new Error('Tree structure not preserved');
    }

    return data;
  });

  // Test 4: Public API - Cache Headers
  await test('GET /api/cms/menus/location/{location} - Cache headers', async () => {
    const response = await fetch(`${API_BASE_URL}/api/cms/menus/location/test-header`);

    const cacheControl = response.headers.get('Cache-Control');
    if (!cacheControl || !cacheControl.includes('s-maxage=300')) {
      throw new Error(`Invalid cache headers: ${cacheControl}`);
    }

    return { cacheControl };
  });

  // Cleanup: Delete test menu
  await test('Cleanup: Delete test menu', async () => {
    if (!createdMenuId) return;

    const response = await fetchWithAuth(
      `${API_BASE_URL}/api/admin/menus/${createdMenuId}`,
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

