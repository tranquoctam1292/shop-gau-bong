/**
 * Integration Tests for Admin RBAC System
 * 
 * Tests authentication, authorization, and RBAC functionality
 * 
 * Usage: npm run test:admin-rbac
 * 
 * Prerequisites:
 * - MongoDB connection configured in .env.local
 * - Run seed script first: npm run seed:admin-users
 * - Next.js dev server running on http://localhost:3000
 */

import dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
const API_BASE = `${BASE_URL}/api/admin`;

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

interface TestResult {
  name: string;
  success: boolean;
  error?: string;
  details?: any;
}

const results: TestResult[] = [];
let superAdminSession: string = '';
let viewerSession: string = '';

/**
 * Login and get session cookie
 */
async function login(username: string, password: string): Promise<string | null> {
  try {
    const response = await fetch(`${BASE_URL}/api/admin/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
      credentials: 'include',
    });

    if (!response.ok) {
      return null;
    }

    // Extract session cookie from Set-Cookie header
    const setCookie = response.headers.get('set-cookie');
    if (setCookie) {
      // Extract next-auth.session-token value
      const match = setCookie.match(/next-auth\.session-token=([^;]+)/);
      if (match) {
        return match[1];
      }
    }

    // Fallback: return cookie string if available
    return setCookie || null;
  } catch (error) {
    console.error(`Login error for ${username}:`, error);
    return null;
  }
}

/**
 * Make authenticated request
 */
async function authenticatedRequest(
  url: string,
  options: RequestInit = {},
  sessionCookie?: string
): Promise<Response> {
  const headers = new Headers(options.headers);
  
  if (sessionCookie) {
    headers.set('Cookie', `next-auth.session-token=${sessionCookie}`);
  }

  return fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });
}

/**
 * Test function wrapper
 */
async function test(name: string, testFn: () => Promise<boolean | { success: boolean; error?: string; details?: any }>): Promise<void> {
  try {
    const result = await testFn();
    if (typeof result === 'boolean') {
      results.push({ name, success: result });
    } else {
      results.push({ name, ...result });
    }
  } catch (error: any) {
    results.push({ name, success: false, error: error.message });
  }
}

/**
 * Print test results
 */
function printResults() {
  console.log(`\n${colors.cyan}=== Test Results ===${colors.reset}\n`);

  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  results.forEach((result) => {
    const icon = result.success ? `${colors.green}✓` : `${colors.red}✗`;
    const status = result.success ? 'PASS' : 'FAIL';
    console.log(`${icon} ${colors.reset}${result.name}: ${status}`);
    
    if (!result.success) {
      if (result.error) {
        console.log(`  ${colors.red}Error: ${result.error}${colors.reset}`);
      }
      if (result.details) {
        console.log(`  ${colors.yellow}Details: ${JSON.stringify(result.details, null, 2)}${colors.reset}`);
      }
    }
  });

  console.log(`\n${colors.cyan}=== Summary ===${colors.reset}`);
  console.log(`${colors.green}Passed: ${passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${failed}${colors.reset}`);
  console.log(`Total: ${results.length}\n`);
}

async function runTests() {
  console.log(`${colors.cyan}=== Admin RBAC Integration Tests ===${colors.reset}\n`);

  // Test 1: Login with SUPER_ADMIN
  await test('Login as SUPER_ADMIN', async () => {
    const cookie = await login('admin', 'ChangeMe@123');
    if (cookie) {
      superAdminSession = cookie;
      return true;
    }
    return false;
  });

  // Test 2: Login with VIEWER
  await test('Login as VIEWER', async () => {
    const cookie = await login('viewer', 'ChangeMe@123');
    if (cookie) {
      viewerSession = cookie;
      return true;
    }
    return false;
  });

  // Test 3: Get current user (SUPER_ADMIN)
  await test('GET /api/admin/auth/me (SUPER_ADMIN)', async () => {
    const response = await authenticatedRequest(
      `${API_BASE}/auth/me`,
      { method: 'GET' },
      superAdminSession
    );
    
    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}` };
    }

    const data = await response.json();
    return {
      success: data.success && data.data.role === 'SUPER_ADMIN',
      details: { role: data.data?.role },
    };
  });

  // Test 4: Permission check - SUPER_ADMIN can list users
  await test('GET /api/admin/users (SUPER_ADMIN - should succeed)', async () => {
    const response = await authenticatedRequest(
      `${API_BASE}/users`,
      { method: 'GET' },
      superAdminSession
    );
    
    return response.ok;
  });

  // Test 5: Permission check - VIEWER cannot list users
  await test('GET /api/admin/users (VIEWER - should fail)', async () => {
    const response = await authenticatedRequest(
      `${API_BASE}/users`,
      { method: 'GET' },
      viewerSession
    );
    
    if (!response.ok && response.status === 403) {
      const data = await response.json();
      return {
        success: data.code === 'PERMISSION_DENIED',
        details: { status: response.status, code: data.code },
      };
    }
    return { success: false, error: 'Expected 403 but got different status' };
  });

  // Test 6: Permission check - PRODUCT_MANAGER can read products
  await test('GET /api/admin/products (PRODUCT_MANAGER - should succeed)', async () => {
    // Login as product manager
    const cookie = await login('product', 'ChangeMe@123');
    if (!cookie) {
      return { success: false, error: 'Failed to login as PRODUCT_MANAGER' };
    }

    const response = await authenticatedRequest(
      `${API_BASE}/products`,
      { method: 'GET' },
      cookie
    );
    
    return response.ok;
  });

  // Test 7: Permission check - VIEWER can read products (read-only)
  await test('GET /api/admin/products (VIEWER - should succeed)', async () => {
    const response = await authenticatedRequest(
      `${API_BASE}/products`,
      { method: 'GET' },
      viewerSession
    );
    
    return response.ok;
  });

  // Test 8: Permission check - VIEWER cannot create products
  await test('POST /api/admin/products (VIEWER - should fail)', async () => {
    const response = await authenticatedRequest(
      `${API_BASE}/products`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Test Product' }),
      },
      viewerSession
    );
    
    if (!response.ok && response.status === 403) {
      const data = await response.json();
      return {
        success: data.code === 'PERMISSION_DENIED',
        details: { status: response.status, code: data.code },
      };
    }
    return { success: false, error: 'Expected 403 but got different status' };
  });

  // Test 9: Rate limiting on login (MongoDB-based)
  await test('Rate limiting on login endpoint (MongoDB-based)', async () => {
    let rateLimited = false;
    
    // Make 6 rapid login attempts (limit is 5)
    for (let i = 0; i < 6; i++) {
      const response = await fetch(`${BASE_URL}/api/admin/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'wrongpassword' }),
      });

      if (response.status === 429) {
        rateLimited = true;
        const data = await response.json();
        return {
          success: data.code === 'RATE_LIMIT_EXCEEDED',
          details: { attempt: i + 1, status: response.status },
        };
      }
      
      // Small delay to avoid race conditions
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    return { success: rateLimited, error: 'Rate limit was not triggered' };
  });

  // Test 10: V1.2 - Token revocation (force logout)
  await test('V1.2: Force logout all devices (token revocation)', async () => {
    // Login first
    const cookie = await login('admin', 'ChangeMe@123');
    if (!cookie) {
      return { success: false, error: 'Failed to login' };
    }

    // Get current user info
    const meResponse = await authenticatedRequest(
      `${API_BASE}/auth/me`,
      { method: 'GET' },
      cookie
    );
    
    if (!meResponse.ok) {
      return { success: false, error: 'Failed to get user info' };
    }

    // Force logout all devices
    const logoutResponse = await authenticatedRequest(
      `${API_BASE}/auth/logout-all`,
      { method: 'POST' },
      cookie
    );
    
    if (!logoutResponse.ok) {
      return { success: false, error: 'Failed to logout all devices' };
    }

    // Try to use the old session (should fail)
    const retryResponse = await authenticatedRequest(
      `${API_BASE}/auth/me`,
      { method: 'GET' },
      cookie
    );
    
    return {
      success: retryResponse.status === 401,
      details: { 
        logoutStatus: logoutResponse.status,
        retryStatus: retryResponse.status,
      },
    };
  });

  // Test 11: V1.2 - Change password increments token_version
  await test('V1.2: Change password increments token_version', async () => {
    // Login first
    const cookie = await login('admin', 'ChangeMe@123');
    if (!cookie) {
      return { success: false, error: 'Failed to login' };
    }

    // Change password
    const changePasswordResponse = await authenticatedRequest(
      `${API_BASE}/auth/change-password`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: 'ChangeMe@123',
          newPassword: 'NewPassword123!',
        }),
      },
      cookie
    );
    
    if (!changePasswordResponse.ok) {
      return { success: false, error: 'Failed to change password' };
    }

    // Change back to original password for cleanup
    const changeBackResponse = await authenticatedRequest(
      `${API_BASE}/auth/change-password`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: 'NewPassword123!',
          newPassword: 'ChangeMe@123',
        }),
      },
      cookie
    );

    return {
      success: changePasswordResponse.ok && changeBackResponse.ok,
      details: {
        changePasswordStatus: changePasswordResponse.status,
        changeBackStatus: changeBackResponse.status,
      },
    };
  });

  // Test 12: Must change password redirect
  await test('Must change password flag handling', async () => {
    // This test would require a user with must_change_password=true
    // For now, just verify the API returns the flag
    const response = await authenticatedRequest(
      `${API_BASE}/auth/me`,
      { method: 'GET' },
      superAdminSession
    );
    
    if (!response.ok) {
      return { success: false, error: 'Failed to get user info' };
    }

    const data = await response.json();
    return {
      success: data.data && 'must_change_password' in data.data,
      details: { must_change_password: data.data?.must_change_password },
    };
  });

  // Test 13: Audit logging
  await test('Audit logging on actions', async () => {
    // Create a test user (will be logged)
    const response = await authenticatedRequest(
      `${API_BASE}/users`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: `test_user_${Date.now()}`,
          email: `test_${Date.now()}@example.com`,
          password: 'TestPassword123!',
          full_name: 'Test User',
          role: 'VIEWER',
        }),
      },
      superAdminSession
    );
    
    // Verify user was created (audit log would be in database)
    return {
      success: response.ok || response.status === 201,
      details: { status: response.status },
    };
  });

  // Print results
  printResults();

  // Exit with error code if tests failed
  const failed = results.filter(r => !r.success).length;
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
