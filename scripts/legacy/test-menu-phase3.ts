// scripts/test-menu-phase3.ts
import { config } from 'dotenv';
import { resolve } from 'path';
import { ObjectId } from 'mongodb';

config({ path: resolve(process.cwd(), '.env.local') });

const API_BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const TEST_ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || 'admin@example.com';
const TEST_ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || 'admin123';
let sessionCookies: string = process.env.TEST_SESSION_COOKIE || '';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  data?: any;
}

const results: TestResult[] = [];

async function login(): Promise<boolean> {
  if (sessionCookies) {
    console.log('   ✅ Using TEST_SESSION_COOKIE from .env.local');
    return true;
  }

  console.log('🔐 Logging in as admin...');
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/callback/credentials`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ email: TEST_ADMIN_EMAIL, password: TEST_ADMIN_PASSWORD, redirect: 'false', json: 'true' }),
    });

    const setCookieHeaders = response.headers.getSetCookie?.() || [];
    const sessionTokenCookie = setCookieHeaders.find(cookie => cookie.startsWith('next-auth.session-token='));

    if (sessionTokenCookie) {
      sessionCookies = sessionTokenCookie.split(';')[0];
      console.log('   ✅ Login successful (session cookie received)');
      console.log(`   📝 Session cookie: ${sessionCookies.substring(0, 60)}...`);
      return true;
    }

    console.log('   ⚠️  No session cookie received from login endpoint');
    return false;
  } catch (error: any) {
    console.log(`   ❌ Login failed: ${error.message}`);
    return false;
  }
}

async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers({
    'Content-Type': 'application/json',
    ...(options.headers as HeadersInit),
  });
  if (sessionCookies) {
    headers.set('Cookie', sessionCookies);
  }
  return fetch(url, { ...options, headers, credentials: 'include' });
}

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

async function runTests() {
  console.log('🚀 Starting Menu Management Phase 3 CRUD Tests\n');
  console.log(`API Base URL: ${API_BASE_URL}\n`);

  const loggedIn = await login();
  if (!loggedIn) {
    console.log('\n⚠️  Warning: Could not login automatically or TEST_SESSION_COOKIE not set.');
    console.log('   Tests will run but may fail with 401 Unauthorized.');
    console.log('   To fix:');
    console.log('   1. Start server: npm run dev');
    console.log('   2. Login in browser: http://localhost:3000/admin/login');
    console.log('   3. Copy session cookie from DevTools → Application → Cookies');
    console.log('   4. Add to .env.local: TEST_SESSION_COOKIE="next-auth.session-token=..."\n');
  }

  let createdMenuId: string | null = null;
  let createdMenuItemId: string | null = null;

  // ============================================
  // TEST 1: CREATE MENU (POST /api/admin/menus)
  // ============================================
  console.log('\n📝 Testing Menu CRUD Operations\n');

  await test('POST /api/admin/menus - Create new menu', async () => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/admin/menus`, {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test Menu Phase 3',
        location: 'header-test-phase3',
        status: 'active',
      }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to create menu');
    // API returns menu._id or menu.id
    createdMenuId = data.menu?._id || data.menu?.id;
    if (!createdMenuId) throw new Error('Menu ID not returned');
    return data;
  });

  // ============================================
  // TEST 2: READ MENU (GET /api/admin/menus)
  // ============================================
  await test('GET /api/admin/menus - List all menus', async () => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/admin/menus`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to list menus');
    if (!Array.isArray(data.menus)) throw new Error('Menus should be an array');
    if (data.menus.length === 0) throw new Error('No menus found');
    // API returns id, not _id
    const testMenu = data.menus.find((m: any) => (m._id || m.id) === createdMenuId);
    if (!testMenu) throw new Error('Created menu not found in list');
    return data;
  });

  await test('GET /api/admin/menus - List with filters (location)', async () => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/admin/menus?location=header-test-phase3`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to filter menus');
    if (!Array.isArray(data.menus)) throw new Error('Menus should be an array');
    const testMenu = data.menus.find((m: any) => (m._id || m.id) === createdMenuId);
    if (!testMenu) throw new Error('Created menu not found in filtered list');
    return data;
  });

  await test('GET /api/admin/menus - List with filters (status)', async () => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/admin/menus?status=active`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to filter menus by status');
    if (!Array.isArray(data.menus)) throw new Error('Menus should be an array');
    const testMenu = data.menus.find((m: any) => (m._id || m.id) === createdMenuId);
    if (!testMenu) throw new Error('Created menu not found in active menus');
    return data;
  });

  await test('GET /api/admin/menus - List with search', async () => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/admin/menus?search=Phase 3`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to search menus');
    if (!Array.isArray(data.menus)) throw new Error('Menus should be an array');
    const testMenu = data.menus.find((m: any) => (m._id || m.id) === createdMenuId);
    if (!testMenu) throw new Error('Created menu not found in search results');
    return data;
  });

  await test('GET /api/admin/menus - Pagination', async () => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/admin/menus?page=1&per_page=5`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to paginate menus');
    if (!data.pagination) throw new Error('Pagination data missing');
    if (typeof data.pagination.totalPages !== 'number') throw new Error('totalPages should be a number');
    if (typeof data.pagination.total !== 'number') throw new Error('total should be a number');
    return data;
  });

  // ============================================
  // TEST 3: GET SINGLE MENU (GET /api/admin/menus/[id])
  // ============================================
  await test('GET /api/admin/menus/[id] - Get single menu (flat format)', async () => {
    if (!createdMenuId) throw new Error('No menu ID available');
    const response = await fetchWithAuth(`${API_BASE_URL}/api/admin/menus/${createdMenuId}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to get menu');
    if (!data.menu) throw new Error('Menu data missing');
    const menuId = data.menu._id || data.menu.id;
    if (menuId !== createdMenuId) throw new Error('Menu ID mismatch');
    if (data.menu.name !== 'Test Menu Phase 3') throw new Error('Menu name mismatch');
    return data;
  });

  await test('GET /api/admin/menus/[id] - Get single menu (tree format)', async () => {
    if (!createdMenuId) throw new Error('No menu ID available');
    const response = await fetchWithAuth(`${API_BASE_URL}/api/admin/menus/${createdMenuId}?format=tree`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to get menu tree');
    if (!data.menu) throw new Error('Menu data missing');
    if (!Array.isArray(data.menu.items)) throw new Error('Menu items should be an array');
    return data;
  });

  // ============================================
  // TEST 4: UPDATE MENU (PUT /api/admin/menus/[id])
  // ============================================
  await test('PUT /api/admin/menus/[id] - Update menu name', async () => {
    if (!createdMenuId) throw new Error('No menu ID available');
    const response = await fetchWithAuth(`${API_BASE_URL}/api/admin/menus/${createdMenuId}`, {
      method: 'PUT',
      body: JSON.stringify({
        name: 'Updated Test Menu Phase 3',
      }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to update menu');
    if (data.menu.name !== 'Updated Test Menu Phase 3') throw new Error('Menu name not updated');
    return data;
  });

  await test('PUT /api/admin/menus/[id] - Update menu location', async () => {
    if (!createdMenuId) throw new Error('No menu ID available');
    const response = await fetchWithAuth(`${API_BASE_URL}/api/admin/menus/${createdMenuId}`, {
      method: 'PUT',
      body: JSON.stringify({
        location: 'footer-test-phase3',
      }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to update menu location');
    if (data.menu.location !== 'footer-test-phase3') throw new Error('Menu location not updated');
    return data;
  });

  await test('PUT /api/admin/menus/[id] - Update menu status', async () => {
    if (!createdMenuId) throw new Error('No menu ID available');
    const response = await fetchWithAuth(`${API_BASE_URL}/api/admin/menus/${createdMenuId}`, {
      method: 'PUT',
      body: JSON.stringify({
        status: 'inactive',
      }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to update menu status');
    if (data.menu.status !== 'inactive') throw new Error('Menu status not updated');
    return data;
  });

  // ============================================
  // TEST 5: CREATE MENU ITEM (POST /api/admin/menu-items)
  // ============================================
  console.log('\n📝 Testing Menu Item CRUD Operations\n');

  await test('POST /api/admin/menu-items - Create custom link item', async () => {
    if (!createdMenuId) throw new Error('No menu ID available');
    const response = await fetchWithAuth(`${API_BASE_URL}/api/admin/menu-items`, {
      method: 'POST',
      body: JSON.stringify({
        menuId: createdMenuId,
        title: 'Home',
        type: 'custom',
        url: '/',
        target: '_self',
      }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to create menu item');
    // API returns item.id, not menuItem._id
    createdMenuItemId = data.item?.id || data.menuItem?._id || data.menuItem?.id;
    if (!createdMenuItemId) throw new Error('Menu item ID not returned');
    return data;
  });

  await test('POST /api/admin/menu-items - Create nested menu item (child)', async () => {
    if (!createdMenuId || !createdMenuItemId) throw new Error('No menu or parent item ID available');
    const response = await fetchWithAuth(`${API_BASE_URL}/api/admin/menu-items`, {
      method: 'POST',
      body: JSON.stringify({
        menuId: createdMenuId,
        parentId: createdMenuItemId,
        title: 'About',
        type: 'custom',
        url: '/about',
        target: '_self',
      }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to create nested menu item');
    // API returns item, not menuItem
    const menuItem = data.item || data.menuItem;
    const parentId = menuItem?.parentId || menuItem?.parentId?.toString();
    if (parentId !== createdMenuItemId) throw new Error('Parent ID not set correctly');
    return data;
  });

  // ============================================
  // TEST 6: GET MENU ITEMS (via GET /api/admin/menus/[id])
  // ============================================
  await test('GET /api/admin/menus/[id] - Verify menu items in tree', async () => {
    if (!createdMenuId) throw new Error('No menu ID available');
    const response = await fetchWithAuth(`${API_BASE_URL}/api/admin/menus/${createdMenuId}?format=tree`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to get menu tree');
    if (!Array.isArray(data.menu.items)) throw new Error('Menu items should be an array');
    if (data.menu.items.length === 0) throw new Error('No menu items found');
    const homeItem = data.menu.items.find((item: any) => item.title === 'Home');
    if (!homeItem) throw new Error('Home menu item not found');
    if (!homeItem.children || homeItem.children.length === 0) throw new Error('Nested menu item not found');
    return data;
  });

  // ============================================
  // TEST 7: GET SINGLE MENU ITEM (GET /api/admin/menu-items/[id])
  // ============================================
  await test('GET /api/admin/menu-items/[id] - Get single menu item', async () => {
    if (!createdMenuItemId) throw new Error('No menu item ID available');
    const response = await fetchWithAuth(`${API_BASE_URL}/api/admin/menu-items/${createdMenuItemId}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to get menu item');
    // API returns item, not menuItem
    const menuItem = data.item || data.menuItem;
    if (!menuItem) throw new Error('Menu item data missing');
    const itemId = menuItem._id || menuItem.id;
    if (itemId !== createdMenuItemId) throw new Error('Menu item ID mismatch');
    if (menuItem.title !== 'Home') throw new Error('Menu item title mismatch');
    return data;
  });

  // ============================================
  // TEST 8: UPDATE MENU ITEM (PUT /api/admin/menu-items/[id])
  // ============================================
  await test('PUT /api/admin/menu-items/[id] - Update menu item title', async () => {
    if (!createdMenuItemId) throw new Error('No menu item ID available');
    const response = await fetchWithAuth(`${API_BASE_URL}/api/admin/menu-items/${createdMenuItemId}`, {
      method: 'PUT',
      body: JSON.stringify({
        title: 'Home Updated',
      }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to update menu item');
    // API returns item, not menuItem
    const menuItem = data.item || data.menuItem;
    if (menuItem.title !== 'Home Updated') throw new Error('Menu item title not updated');
    return data;
  });

  await test('PUT /api/admin/menu-items/[id] - Update menu item URL', async () => {
    if (!createdMenuItemId) throw new Error('No menu item ID available');
    const response = await fetchWithAuth(`${API_BASE_URL}/api/admin/menu-items/${createdMenuItemId}`, {
      method: 'PUT',
      body: JSON.stringify({
        url: '/home',
      }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to update menu item URL');
    const menuItem = data.item || data.menuItem;
    if (menuItem.url !== '/home') throw new Error('Menu item URL not updated');
    return data;
  });

  await test('PUT /api/admin/menu-items/[id] - Update menu item target', async () => {
    if (!createdMenuItemId) throw new Error('No menu item ID available');
    const response = await fetchWithAuth(`${API_BASE_URL}/api/admin/menu-items/${createdMenuItemId}`, {
      method: 'PUT',
      body: JSON.stringify({
        target: '_blank',
      }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to update menu item target');
    const menuItem = data.item || data.menuItem;
    if (menuItem.target !== '_blank') throw new Error('Menu item target not updated');
    return data;
  });

  // ============================================
  // TEST 9: DELETE MENU ITEM (DELETE /api/admin/menu-items/[id])
  // ============================================
  await test('DELETE /api/admin/menu-items/[id] - Delete menu item (should fail if has children)', async () => {
    if (!createdMenuItemId) throw new Error('No menu item ID available');
    const response = await fetchWithAuth(`${API_BASE_URL}/api/admin/menu-items/${createdMenuItemId}`, {
      method: 'DELETE',
    });
    const data = await response.json();
    // Should fail because menu item has children
    if (response.ok) throw new Error('Should not be able to delete menu item with children');
    if (!data.error) throw new Error('Error message missing');
    return data;
  });

  // Delete child first, then parent
  await test('DELETE /api/admin/menu-items/[id] - Delete child menu item first', async () => {
    if (!createdMenuId) throw new Error('No menu ID available');
    // Get menu items to find child
    const getResponse = await fetchWithAuth(`${API_BASE_URL}/api/admin/menus/${createdMenuId}?format=tree`);
    const getData = await getResponse.json();
    const homeItem = getData.menu.items.find((item: any) => item.title === 'Home Updated' || item.title === 'Home');
    if (!homeItem || !homeItem.children || homeItem.children.length === 0) {
      throw new Error('Child menu item not found');
    }
    const childId = homeItem.children[0].id;
    
    const response = await fetchWithAuth(`${API_BASE_URL}/api/admin/menu-items/${childId}`, {
      method: 'DELETE',
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to delete child menu item');
    return data;
  });

  await test('DELETE /api/admin/menu-items/[id] - Delete parent menu item', async () => {
    if (!createdMenuItemId) throw new Error('No menu item ID available');
    const response = await fetchWithAuth(`${API_BASE_URL}/api/admin/menu-items/${createdMenuItemId}`, {
      method: 'DELETE',
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to delete menu item');
    return data;
  });

  // ============================================
  // TEST 10: DELETE MENU (DELETE /api/admin/menus/[id])
  // ============================================
  console.log('\n📝 Testing Menu Deletion\n');

  await test('DELETE /api/admin/menus/[id] - Delete menu', async () => {
    if (!createdMenuId) throw new Error('No menu ID available');
    const response = await fetchWithAuth(`${API_BASE_URL}/api/admin/menus/${createdMenuId}`, {
      method: 'DELETE',
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to delete menu');
    return data;
  });

  await test('GET /api/admin/menus/[id] - Verify menu deleted', async () => {
    if (!createdMenuId) throw new Error('No menu ID available');
    const response = await fetchWithAuth(`${API_BASE_URL}/api/admin/menus/${createdMenuId}`);
    const data = await response.json();
    if (response.ok) throw new Error('Menu should not exist after deletion');
    if (response.status !== 404) throw new Error('Should return 404 for deleted menu');
    return data;
  });

  // ============================================
  // TEST SUMMARY
  // ============================================
  console.log('\n📊 Test Summary:');
  console.log('─────────────────────────────────────────');
  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;
  console.log(`   Total: ${results.length}`);
  console.log(`   ✅ Passed: ${passedCount}`);
  console.log(`   ❌ Failed: ${failedCount}`);

  if (failedCount > 0) {
    console.log('\n❌ Failed Tests:');
    results
      .filter((r) => !r.passed)
      .forEach((r) => {
        console.log(`   - ${r.name}: ${r.error}`);
      });
    process.exit(1);
  } else {
    console.log('\n🎉 All tests passed successfully!');
    process.exit(0);
  }
}

runTests();

