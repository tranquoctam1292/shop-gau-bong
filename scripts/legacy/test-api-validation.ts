/**
 * API Validation Integration Test
 * 
 * Test API routes với invalid và valid data
 * 
 * Note: This requires a running dev server (npm run dev)
 * Run: tsx scripts/test-api-validation.ts
 */

const API_BASE = process.env.API_BASE || 'http://localhost:3000';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  response?: any;
}

const results: TestResult[] = [];

async function testAPI(name: string, url: string, options: RequestInit, shouldFail: boolean = false) {
  try {
    const response = await fetch(`${API_BASE}${url}`, options);
    const data = await response.json();

    if (shouldFail) {
      // Should return 400 with validation error
      if (response.status === 400 && data.error) {
        results.push({ name, passed: true, response: data });
        console.log(`✅ ${name}: Correctly rejected invalid data`);
      } else {
        results.push({ name, passed: false, error: `Expected 400, got ${response.status}` });
        console.error(`❌ ${name}: Expected rejection, got status ${response.status}`);
      }
    } else {
      // Should return success
      if (response.ok) {
        results.push({ name, passed: true, response: data });
        console.log(`✅ ${name}: Valid data accepted`);
      } else {
        results.push({ name, passed: false, error: `Expected success, got ${response.status}` });
        console.error(`❌ ${name}: Expected success, got status ${response.status}`);
      }
    }
  } catch (error: any) {
    results.push({ name, passed: false, error: error.message });
    console.error(`❌ ${name}: ${error.message}`);
  }
}

async function runTests() {
  console.log('🧪 Testing API Routes Validation...\n');
  console.log(`📍 API Base: ${API_BASE}\n`);

  // ==================== MoMo Payment Tests ====================
  console.log('📋 Testing /api/payment/momo\n');

  // Invalid: Missing orderId
  await testAPI(
    'MoMo: Missing orderId',
    '/api/payment/momo',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: 100000,
        returnUrl: 'https://example.com/return',
        notifyUrl: 'https://example.com/notify',
      }),
    },
    true
  );

  // Invalid: Negative amount
  await testAPI(
    'MoMo: Negative amount',
    '/api/payment/momo',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: '123',
        amount: -1000,
        returnUrl: 'https://example.com/return',
        notifyUrl: 'https://example.com/notify',
      }),
    },
    true
  );

  // Invalid: Invalid URL
  await testAPI(
    'MoMo: Invalid returnUrl',
    '/api/payment/momo',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: '123',
        amount: 100000,
        returnUrl: 'not-a-url',
        notifyUrl: 'https://example.com/notify',
      }),
    },
    true
  );

  // ==================== VietQR Payment Tests ====================
  console.log('\n📋 Testing /api/payment/vietqr\n');

  // Invalid: Missing accountNo
  await testAPI(
    'VietQR: Missing accountNo',
    '/api/payment/vietqr',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: '123',
        amount: 100000,
        accountName: 'Nguyen Van A',
        acqId: '970422',
      }),
    },
    true
  );

  // Invalid: Empty accountName
  await testAPI(
    'VietQR: Empty accountName',
    '/api/payment/vietqr',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: '123',
        amount: 100000,
        accountNo: '1234567890',
        accountName: '',
        acqId: '970422',
      }),
    },
    true
  );

  // ==================== Summary ====================
  console.log('\n' + '='.repeat(50));
  console.log('📊 Test Summary');
  console.log('='.repeat(50));

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Total: ${results.length}`);
  console.log(`🎯 Success Rate: ${((passed / results.length) * 100).toFixed(1)}%`);

  if (failed > 0) {
    console.log('\n❌ Failed Tests:');
    results
      .filter((r) => !r.passed)
      .forEach((r) => {
        console.log(`  - ${r.name}: ${r.error}`);
      });
  }

  if (failed === 0) {
    console.log('\n🎉 All API validation tests passed!');
    process.exit(0);
  } else {
    console.log('\n⚠️ Some tests failed. Please review the errors above.');
    process.exit(1);
  }
}

// Check if server is running
fetch(`${API_BASE}/api/test-env`)
  .then(() => {
    console.log('✅ Server is running\n');
    runTests();
  })
  .catch(() => {
    console.error('❌ Server is not running. Please start dev server first:');
    console.error('   npm run dev\n');
    console.log('💡 Running schema validation tests instead...\n');
    // Fallback to schema tests
    import('./test-validation');
  });
