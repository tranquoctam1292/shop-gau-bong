/**
 * Test Order API với Authentication
 * 
 * Tests Order Update API với authentication:
 * - Login với admin credentials
 * - Test valid status transitions
 * - Test invalid status transitions
 * - Test order history creation
 * 
 * Prerequisites:
 * - Dev server must be running: npm run dev
 * - Admin user must exist (create with: npm run create:admin-user)
 * 
 * Usage: npx tsx scripts/test-order-api-with-auth.ts
 */

// Load environment variables from .env.local
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') });

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Test credentials (should match your admin user)
const TEST_ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || 'admin@example.com';
const TEST_ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || 'admin123';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  response?: any;
}

// Cookie store for session
let sessionCookies: string = '';

/**
 * Login và lấy session cookies
 */
async function login(): Promise<boolean> {
  console.log('🔐 Logging in as admin...');
  console.log(`   Email: ${TEST_ADMIN_EMAIL}`);

  try {
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

    // Get cookies from response
    const setCookieHeaders = response.headers.getSetCookie?.() || [];
    if (setCookieHeaders.length > 0) {
      sessionCookies = setCookieHeaders
        .map((cookie) => cookie.split(';')[0])
        .join('; ');
      console.log('   ✅ Login successful');
      return true;
    }

    // Alternative: Try NextAuth signin endpoint
    const signinResponse = await fetch(`${API_BASE_URL}/api/auth/signin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: TEST_ADMIN_EMAIL,
        password: TEST_ADMIN_PASSWORD,
      }),
    });

    if (signinResponse.ok) {
      const setCookieHeaders2 = signinResponse.headers.getSetCookie?.() || [];
      if (setCookieHeaders2.length > 0) {
        sessionCookies = setCookieHeaders2
          .map((cookie) => cookie.split(';')[0])
          .join('; ');
        console.log('   ✅ Login successful (via signin endpoint)');
        return true;
      }
    }

    console.log('   ❌ Login failed - No session cookies received');
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

async function testOrderAPIWithAuth() {
  console.log('🧪 Testing Order API với Authentication...\n');
  console.log(`🌐 API Base URL: ${API_BASE_URL}\n`);

  const results: TestResult[] = [];

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

  // Step 2: Create test order
  console.log('\n📦 Step 2: Create Test Order');
  const testOrderData = {
    customerName: 'Auth Test Customer',
    customerEmail: 'authtest@example.com',
    customerPhone: '0123456789',
    orderType: 'personal',
    billing: {
      firstName: 'Auth',
      lastName: 'Test',
      address1: '123 Test Street',
      city: 'Ho Chi Minh',
      postcode: '70000',
      country: 'VN',
    },
    shipping: {
      firstName: 'Auth',
      lastName: 'Test',
      address1: '123 Test Street',
      city: 'Ho Chi Minh',
      postcode: '70000',
      country: 'VN',
      province: 'Ho Chi Minh',
      district: 'District 1',
      ward: 'Ward 1',
    },
    lineItems: [
      {
        productId: 'test-product-id',
        productName: 'Test Product',
        quantity: 1,
        price: 100000,
      },
    ],
    paymentMethod: 'cod',
    paymentMethodTitle: 'Thanh toán khi nhận hàng',
    subtotal: 100000,
    shippingTotal: 30000,
    total: 130000,
  };

  const createOrder = await makeAuthenticatedRequest(
    `${API_BASE_URL}/api/cms/orders`,
    'POST',
    testOrderData
  );

  let orderId: string | null = null;
  let orderNumber: string | null = null;

  if (createOrder.ok && createOrder.data.order) {
    orderId = createOrder.data.order._id;
    orderNumber = createOrder.data.order.orderNumber;
    console.log(`   ✅ Order created: ${orderNumber}`);
    console.log(`   📝 Order ID: ${orderId}`);
    results.push({ name: 'Create Order', passed: true, response: createOrder.data });
  } else {
    console.log(`   ❌ Failed to create order: ${createOrder.status}`);
    console.log(`   Error: ${JSON.stringify(createOrder.data, null, 2)}`);
    results.push({
      name: 'Create Order',
      passed: false,
      error: createOrder.data.error || 'Unknown error',
    });
    process.exit(1);
  }

  // Step 3: Test valid status transition (pending -> confirmed)
  console.log('\n✅ Step 3: Valid Status Transition (pending -> confirmed)');
  const validUpdate = await makeAuthenticatedRequest(
    `${API_BASE_URL}/api/admin/orders/${orderId}`,
    'PUT',
    { status: 'confirmed' }
  );

  if (validUpdate.ok && validUpdate.data.order) {
    console.log('   ✅ Status transition successful');
    console.log(`   📝 New status: ${validUpdate.data.order.status}`);
    results.push({ name: 'Valid Transition (pending->confirmed)', passed: true });
  } else {
    console.log(`   ❌ Status transition failed: ${validUpdate.status}`);
    console.log(`   Error: ${JSON.stringify(validUpdate.data, null, 2)}`);
    results.push({
      name: 'Valid Transition',
      passed: false,
      error: validUpdate.data.error || 'Unknown error',
    });
  }

  // Step 4: Test another valid transition (confirmed -> processing)
  console.log('\n✅ Step 4: Valid Status Transition (confirmed -> processing)');
  const processingUpdate = await makeAuthenticatedRequest(
    `${API_BASE_URL}/api/admin/orders/${orderId}`,
    'PUT',
    { status: 'processing' }
  );

  if (processingUpdate.ok && processingUpdate.data.order) {
    console.log('   ✅ Status transition successful');
    console.log(`   📝 New status: ${processingUpdate.data.order.status}`);
    results.push({ name: 'Valid Transition (confirmed->processing)', passed: true });
  } else {
    console.log(`   ❌ Status transition failed: ${processingUpdate.status}`);
    console.log(`   Error: ${JSON.stringify(processingUpdate.data, null, 2)}`);
    results.push({
      name: 'Valid Transition (confirmed->processing)',
      passed: false,
      error: processingUpdate.data.error || 'Unknown error',
    });
  }

  // Step 5: Test invalid status transition (processing -> completed)
  console.log('\n❌ Step 5: Invalid Status Transition (processing -> completed)');
  const invalidUpdate = await makeAuthenticatedRequest(
    `${API_BASE_URL}/api/admin/orders/${orderId}`,
    'PUT',
    { status: 'completed' }
  );

  if (!invalidUpdate.ok && invalidUpdate.status === 400) {
    console.log('   ✅ Invalid transition correctly rejected');
    console.log(`   📝 Error message: ${invalidUpdate.data.message || invalidUpdate.data.error}`);
    results.push({ name: 'Invalid Transition (processing->completed)', passed: true });
  } else {
    console.log(`   ❌ Should have rejected invalid transition`);
    console.log(`   Status: ${invalidUpdate.status}`);
    console.log(`   Response: ${JSON.stringify(invalidUpdate.data, null, 2)}`);
    results.push({
      name: 'Invalid Transition',
      passed: false,
      error: 'Transition was not rejected',
    });
  }

  // Step 6: Test correct transition path (processing -> shipping -> completed)
  console.log('\n✅ Step 6: Correct Transition Path (processing -> shipping -> completed)');
  
  // processing -> shipping
  const shippingUpdate = await makeAuthenticatedRequest(
    `${API_BASE_URL}/api/admin/orders/${orderId}`,
    'PUT',
    { status: 'shipping' }
  );

  if (shippingUpdate.ok) {
    console.log('   ✅ processing -> shipping: Success');
    
    // shipping -> completed
    const completedUpdate = await makeAuthenticatedRequest(
      `${API_BASE_URL}/api/admin/orders/${orderId}`,
      'PUT',
      { status: 'completed' }
    );

    if (completedUpdate.ok) {
      console.log('   ✅ shipping -> completed: Success');
      results.push({ name: 'Correct Transition Path', passed: true });
    } else {
      console.log(`   ❌ shipping -> completed failed: ${completedUpdate.status}`);
      results.push({
        name: 'Correct Transition Path',
        passed: false,
        error: 'shipping->completed failed',
      });
    }
  } else {
    console.log(`   ❌ processing -> shipping failed: ${shippingUpdate.status}`);
    results.push({
      name: 'Correct Transition Path',
      passed: false,
      error: 'processing->shipping failed',
    });
  }

  // Step 7: Check order history
  console.log('\n📋 Step 7: Check Order History');
  const historyResponse = await makeAuthenticatedRequest(
    `${API_BASE_URL}/api/admin/orders/${orderId}/history`,
    'GET'
  );

  if (historyResponse.ok && Array.isArray(historyResponse.data.histories)) {
    const histories = historyResponse.data.histories;
    console.log(`   ✅ Found ${histories.length} history entries:`);
    histories.forEach((h: any, i: number) => {
      const date = new Date(h.createdAt).toLocaleString('vi-VN');
      console.log(`      ${i + 1}. [${date}] ${h.action}: ${h.description}`);
      if (h.actorName) {
        console.log(`         Actor: ${h.actorName} (${h.actorType})`);
      }
    });
    results.push({ name: 'Order History', passed: true, response: histories });
  } else {
    console.log(`   ❌ Failed to fetch history: ${historyResponse.status}`);
    console.log(`   Error: ${JSON.stringify(historyResponse.data, null, 2)}`);
    results.push({
      name: 'Order History',
      passed: false,
      error: historyResponse.data.error || 'Unknown error',
    });
  }

  // Step 8: Test payment status update
  console.log('\n💰 Step 8: Test Payment Status Update');
  const paymentUpdate = await makeAuthenticatedRequest(
    `${API_BASE_URL}/api/admin/orders/${orderId}`,
    'PUT',
    { paymentStatus: 'paid' }
  );

  if (paymentUpdate.ok && paymentUpdate.data.order) {
    console.log('   ✅ Payment status update successful');
    console.log(`   📝 New payment status: ${paymentUpdate.data.order.paymentStatus}`);
    results.push({ name: 'Payment Status Update', passed: true });
  } else {
    console.log(`   ❌ Payment status update failed: ${paymentUpdate.status}`);
    results.push({
      name: 'Payment Status Update',
      passed: false,
      error: paymentUpdate.data.error || 'Unknown error',
    });
  }

  // Summary
  console.log('\n📊 Test Summary:');
  const passed = results.filter((r) => r.passed).length;
  const total = results.length;
  console.log(`   ✅ Passed: ${passed}/${total}`);
  console.log(`   ❌ Failed: ${total - passed}/${total}\n`);

  results.forEach((result) => {
    console.log(
      `   ${result.passed ? '✅' : '❌'} ${result.name}${result.error ? ` - ${result.error}` : ''}`
    );
  });

  console.log('\n');

  if (passed === total) {
    console.log('🎉 All tests passed!\n');
    process.exit(0);
  } else {
    console.log('⚠️  Some tests failed. Check the output above.\n');
    process.exit(1);
  }
}

// Run tests
testOrderAPIWithAuth().catch((error) => {
  console.error('\n❌ Test execution failed!\n');
  console.error('Error:', error);
  process.exit(1);
});

