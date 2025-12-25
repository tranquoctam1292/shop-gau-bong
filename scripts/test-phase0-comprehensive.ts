/**
 * Phase 0 Comprehensive Test Suite
 * 
 * Tests tất cả items đã implement trong Phase 0 với:
 * - Integration testing với authentication
 * - Data integrity testing với large variants
 * - Performance testing
 * - Regression testing
 */

import { MongoClient, ObjectId } from 'mongodb';
import { config } from 'dotenv';

config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/shop-gau-bong';
const DB_NAME = process.env.MONGODB_DB_NAME || 'shop-gau-bong';
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const TEST_ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || 'admin@example.com';
const TEST_ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || 'admin123';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  details?: any;
  duration?: number;
}

const results: TestResult[] = [];
let sessionCookie: string | null = null;
let client: MongoClient;
let db: any;

const colors = {
  reset: '\x1b[0m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

async function login(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: TEST_ADMIN_EMAIL,
        password: TEST_ADMIN_PASSWORD,
      }),
      credentials: 'include',
    });

    if (!response.ok) {
      return false;
    }

    const setCookie = response.headers.get('set-cookie');
    if (setCookie) {
      const match = setCookie.match(/next-auth\.session-token=([^;]+)/);
      if (match) {
        sessionCookie = match[1];
        return true;
      }
    }
    return false;
  } catch (error) {
    return false;
  }
}

async function authenticatedRequest(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers);
  if (sessionCookie) {
    headers.set('Cookie', `next-auth.session-token=${sessionCookie}`);
  }
  return fetch(url, { ...options, headers, credentials: 'include' });
}

async function test(name: string, fn: () => Promise<any>): Promise<void> {
  const startTime = Date.now();
  try {
    const result = await fn();
    const duration = Date.now() - startTime;
    results.push({
      name,
      passed: true,
      details: result,
      duration,
    });
    console.log(`${colors.green}   ✅ ${name}${colors.reset} (${duration}ms)`);
  } catch (error: any) {
    const duration = Date.now() - startTime;
    results.push({
      name,
      passed: false,
      error: error.message,
      duration,
    });
    console.log(`${colors.red}   ❌ ${name}: ${error.message}${colors.reset} (${duration}ms)`);
  }
}

async function setupDb() {
  client = new MongoClient(MONGODB_URI);
  await client.connect();
  db = client.db(DB_NAME);
}

async function teardownDb() {
  await client.close();
}

async function createTestProduct(name: string, type: 'simple' | 'variable', regularPrice: number, stockQuantity: number, variants?: any[]): Promise<string> {
  const products = db.collection('products');
  const product = {
    name,
    slug: name.toLowerCase().replace(/\s/g, '-'),
    type,
    productDataMetaBox: {
      productType: type,
      regularPrice,
      stockQuantity,
      manageStock: true,
      stockStatus: stockQuantity > 0 ? 'instock' : 'outofstock',
    },
    variants: variants || [],
    version: 1,
    status: 'publish',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const result = await products.insertOne(product);
  return result.insertedId.toString();
}

async function getProduct(productId: string) {
  const products = db.collection('products');
  return await products.findOne({ _id: new ObjectId(productId) });
}

async function deleteTestProduct(productId: string) {
  const products = db.collection('products');
  await products.deleteOne({ _id: new ObjectId(productId) });
}

// ==================== TEST SUITES ====================

async function testXSSSanitization() {
  console.log(`\n${colors.cyan}🧪 Test Suite: XSS Sanitization (7.12.1)${colors.reset}`);
  
  const productId = await createTestProduct('Test Product XSS', 'simple', 100, 10);
  
  await test('XSS in name field - HTML tags stripped', async () => {
    const response = await authenticatedRequest(
      `${API_BASE_URL}/api/admin/products/${productId}/quick-update`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: '<script>alert("XSS")</script>Product Name',
          version: 1,
        }),
      }
    );
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const product = await getProduct(productId);
    if (product.name.includes('<script>') || product.name.includes('</script>')) {
      throw new Error('HTML tags not stripped from name');
    }
    
    return { sanitizedName: product.name };
  });
  
  await test('XSS in SKU field - Special characters stripped', async () => {
    const response = await authenticatedRequest(
      `${API_BASE_URL}/api/admin/products/${productId}/quick-update`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sku: '<img src=x onerror=alert(1)>SKU-123',
          version: 1,
        }),
      }
    );
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const product = await getProduct(productId);
    if (product.sku && /[<>]/.test(product.sku)) {
      throw new Error('Special characters not stripped from SKU');
    }
    
    return { sanitizedSku: product.sku };
  });
  
  await deleteTestProduct(productId);
}

async function testVariantOwnershipValidation() {
  console.log(`\n${colors.cyan}🧪 Test Suite: Variant Ownership Validation (7.12.5)${colors.reset}`);
  
  const variantId1 = new ObjectId().toString();
  const variantId2 = new ObjectId().toString();
  const productId = await createTestProduct('Test Variable Product', 'variable', 200, 20, [
    { id: variantId1, size: 'S', price: 100, stock: 10, sku: 'VAR-001' },
    { id: variantId2, size: 'M', price: 120, stock: 10, sku: 'VAR-002' },
  ]);
  
  await test('Valid variant ID - Should succeed', async () => {
    const response = await authenticatedRequest(
      `${API_BASE_URL}/api/admin/products/${productId}/quick-update`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variants: [{ id: variantId1, stock: 5 }],
          version: 1,
        }),
      }
    );
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Expected 200, got ${response.status}: ${error.error}`);
    }
    
    return { status: response.status };
  });
  
  await test('Invalid variant ID (not belonging to product) - Should fail', async () => {
    const invalidVariantId = new ObjectId().toString();
    const response = await authenticatedRequest(
      `${API_BASE_URL}/api/admin/products/${productId}/quick-update`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variants: [{ id: invalidVariantId, stock: 5 }],
          version: 1,
        }),
      }
    );
    
    if (response.ok) {
      throw new Error('Expected 400, got 200');
    }
    
    const error = await response.json();
    if (response.status !== 400 || !error.error.includes('Invalid variant IDs')) {
      throw new Error(`Expected 400 with "Invalid variant IDs", got ${response.status}: ${error.error}`);
    }
    
    return { status: response.status, error: error.error };
  });
  
  await test('NoSQL injection attempt - Should fail', async () => {
    const response = await authenticatedRequest(
      `${API_BASE_URL}/api/admin/products/${productId}/quick-update`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variants: [{ id: '{$ne: null}', stock: 5 }],
          version: 1,
        }),
      }
    );
    
    if (response.ok) {
      throw new Error('Expected 400, got 200');
    }
    
    const error = await response.json();
    if (response.status !== 400 || !error.error.includes('Invalid variant ID format')) {
      throw new Error(`Expected 400 with "Invalid variant ID format", got ${response.status}: ${error.error}`);
    }
    
    return { status: response.status, error: error.error };
  });
  
  await deleteTestProduct(productId);
}

async function testRegularPriceValidation() {
  console.log(`\n${colors.cyan}🧪 Test Suite: regularPrice Required Validation (7.5.1)${colors.reset}`);
  
  const productId = await createTestProduct('Test Simple Product', 'simple', 100, 10);
  
  await test('Valid regularPrice (> 0) - Should succeed', async () => {
    const response = await authenticatedRequest(
      `${API_BASE_URL}/api/admin/products/${productId}/quick-update`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          regularPrice: 150,
          version: 1,
        }),
      }
    );
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Expected 200, got ${response.status}: ${error.error}`);
    }
    
    return { status: response.status };
  });
  
  await test('Invalid regularPrice (<= 0) - Should fail', async () => {
    const response = await authenticatedRequest(
      `${API_BASE_URL}/api/admin/products/${productId}/quick-update`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          regularPrice: 0,
          version: 1,
        }),
      }
    );
    
    if (response.ok) {
      throw new Error('Expected 400, got 200');
    }
    
    const error = await response.json();
    if (response.status !== 400) {
      throw new Error(`Expected 400, got ${response.status}: ${error.error}`);
    }
    
    return { status: response.status, error: error.error };
  });
  
  await deleteTestProduct(productId);
}

async function testBoundsRecalculation() {
  console.log(`\n${colors.cyan}🧪 Test Suite: Bounds Recalculation (7.1.4)${colors.reset}`);
  
  const variantId1 = new ObjectId().toString();
  const variantId2 = new ObjectId().toString();
  const productId = await createTestProduct('Test Bounds Product', 'variable', 100, 20, [
    { id: variantId1, size: 'S', price: 50, stock: 5, sku: 'B-001' },
    { id: variantId2, size: 'M', price: 150, stock: 5, sku: 'B-002' },
  ]);
  
  await test('Bounds recalculation - Variable product', async () => {
    const response = await authenticatedRequest(
      `${API_BASE_URL}/api/admin/products/${productId}/quick-update`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variants: [
            { id: variantId1, price: 70, stock: 3 },
            { id: variantId2, price: 120, stock: 7 },
          ],
          version: 1,
        }),
      }
    );
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Expected 200, got ${response.status}: ${error.error}`);
    }
    
    const product = await getProduct(productId);
    if (product.minPrice !== 70 || product.maxPrice !== 120 || product.totalStock !== 10) {
      throw new Error(
        `Bounds incorrect: minPrice=${product.minPrice} (expected 70), maxPrice=${product.maxPrice} (expected 120), totalStock=${product.totalStock} (expected 10)`
      );
    }
    
    return {
      minPrice: product.minPrice,
      maxPrice: product.maxPrice,
      totalStock: product.totalStock,
    };
  });
  
  await test('Bounds recalculation - Simple product', async () => {
    const simpleProductId = await createTestProduct('Test Simple Bounds', 'simple', 100, 10);
    
    const response = await authenticatedRequest(
      `${API_BASE_URL}/api/admin/products/${simpleProductId}/quick-update`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          regularPrice: 150,
          version: 1,
        }),
      }
    );
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Expected 200, got ${response.status}: ${error.error}`);
    }
    
    const product = await getProduct(simpleProductId);
    if (product.minPrice !== 150 || product.maxPrice !== 150) {
      throw new Error(
        `Bounds incorrect: minPrice=${product.minPrice} (expected 150), maxPrice=${product.maxPrice} (expected 150)`
      );
    }
    
    await deleteTestProduct(simpleProductId);
    
    return {
      minPrice: product.minPrice,
      maxPrice: product.maxPrice,
    };
  });
  
  await deleteTestProduct(productId);
}

async function testDataIntegrityWithLargeVariants() {
  console.log(`\n${colors.cyan}🧪 Test Suite: Data Integrity với Large Variants${colors.reset}`);
  
  // Create product with 50 variants
  const variants = Array.from({ length: 50 }, (_, i) => ({
    id: new ObjectId().toString(),
    size: `Size-${i + 1}`,
    price: 100 + i * 10,
    stock: 10 + i,
    sku: `VAR-${String(i + 1).padStart(3, '0')}`,
  }));
  
  const productId = await createTestProduct('Test Large Variants Product', 'variable', 100, 500, variants);
  
  await test('Update 50 variants simultaneously - Data integrity', async () => {
    const updates = variants.slice(0, 50).map((v, i) => ({
      id: v.id,
      price: 200 + i * 10,
      stock: 20 + i,
    }));
    
    const response = await authenticatedRequest(
      `${API_BASE_URL}/api/admin/products/${productId}/quick-update`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variants: updates,
          version: 1,
        }),
      }
    );
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Expected 200, got ${response.status}: ${error.error}`);
    }
    
    const product = await getProduct(productId);
    
    // Verify all variants updated correctly
    const updatedVariants = product.variants || [];
    if (updatedVariants.length !== 50) {
      throw new Error(`Expected 50 variants, got ${updatedVariants.length}`);
    }
    
    // Verify bounds calculated correctly
    const expectedMinPrice = 200;
    const expectedMaxPrice = 200 + 49 * 10; // 690
    const expectedTotalStock = Array.from({ length: 50 }, (_, i) => 20 + i).reduce((a, b) => a + b, 0); // 1725
    
    if (product.minPrice !== expectedMinPrice || product.maxPrice !== expectedMaxPrice || product.totalStock !== expectedTotalStock) {
      throw new Error(
        `Bounds incorrect: minPrice=${product.minPrice} (expected ${expectedMinPrice}), maxPrice=${product.maxPrice} (expected ${expectedMaxPrice}), totalStock=${product.totalStock} (expected ${expectedTotalStock})`
      );
    }
    
    return {
      variantCount: updatedVariants.length,
      minPrice: product.minPrice,
      maxPrice: product.maxPrice,
      totalStock: product.totalStock,
    };
  });
  
  await deleteTestProduct(productId);
}

async function testPerformance() {
  console.log(`\n${colors.cyan}🧪 Test Suite: Performance Testing${colors.reset}`);
  
  const productId = await createTestProduct('Test Performance Product', 'simple', 100, 10);
  
  await test('Response time < 500ms for simple update', async () => {
    const startTime = Date.now();
    const response = await authenticatedRequest(
      `${API_BASE_URL}/api/admin/products/${productId}/quick-update`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          regularPrice: 150,
          version: 1,
        }),
      }
    );
    const duration = Date.now() - startTime;
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    if (duration > 500) {
      throw new Error(`Response time ${duration}ms exceeds 500ms threshold`);
    }
    
    return { duration, status: response.status };
  });
  
  await test('Response time < 1000ms for variable product with 10 variants', async () => {
    const variantIds = Array.from({ length: 10 }, () => new ObjectId().toString());
    const variableProductId = await createTestProduct('Test Performance Variable', 'variable', 100, 100, 
      variantIds.map((id, i) => ({
        id,
        size: `Size-${i + 1}`,
        price: 100 + i * 10,
        stock: 10,
        sku: `VAR-${i + 1}`,
      }))
    );
    
    const startTime = Date.now();
    const response = await authenticatedRequest(
      `${API_BASE_URL}/api/admin/products/${variableProductId}/quick-update`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variants: variantIds.map((id, i) => ({
            id,
            price: 150 + i * 10,
            stock: 15,
          })),
          version: 1,
        }),
      }
    );
    const duration = Date.now() - startTime;
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    if (duration > 1000) {
      throw new Error(`Response time ${duration}ms exceeds 1000ms threshold`);
    }
    
    await deleteTestProduct(variableProductId);
    
    return { duration, status: response.status };
  });
  
  await deleteTestProduct(productId);
}

async function testRegression() {
  console.log(`\n${colors.cyan}🧪 Test Suite: Regression Testing${colors.reset}`);
  
  await test('Existing product update still works', async () => {
    const productId = await createTestProduct('Test Regression Product', 'simple', 100, 10);
    
    const response = await authenticatedRequest(
      `${API_BASE_URL}/api/admin/products/${productId}/quick-update`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Updated Product Name',
          regularPrice: 150,
          stockQuantity: 20,
          version: 1,
        }),
      }
    );
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Expected 200, got ${response.status}: ${error.error}`);
    }
    
    const product = await getProduct(productId);
    if (product.name !== 'Updated Product Name' || product.productDataMetaBox.regularPrice !== 150 || product.productDataMetaBox.stockQuantity !== 20) {
      throw new Error('Product not updated correctly');
    }
    
    await deleteTestProduct(productId);
    
    return { status: response.status };
  });
  
  await test('Version mismatch handling still works', async () => {
    const productId = await createTestProduct('Test Version Mismatch', 'simple', 100, 10);
    
    // First update to increment version
    await authenticatedRequest(
      `${API_BASE_URL}/api/admin/products/${productId}/quick-update`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          regularPrice: 150,
          version: 1,
        }),
      }
    );
    
    // Second update with old version (should fail)
    const response = await authenticatedRequest(
      `${API_BASE_URL}/api/admin/products/${productId}/quick-update`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          regularPrice: 200,
          version: 1, // Old version
        }),
      }
    );
    
    if (response.ok) {
      throw new Error('Expected 409 (version mismatch), got 200');
    }
    
    const error = await response.json();
    if (response.status !== 409 || !error.error.includes('VERSION_MISMATCH')) {
      throw new Error(`Expected 409 with VERSION_MISMATCH, got ${response.status}: ${error.error}`);
    }
    
    await deleteTestProduct(productId);
    
    return { status: response.status, error: error.error };
  });
}

async function runAllTests() {
  console.log(`${colors.cyan}🚀 Phase 0 Comprehensive Test Suite${colors.reset}\n`);
  console.log(`API Base URL: ${API_BASE_URL}`);
  console.log(`MongoDB URI: ${MONGODB_URI}\n`);
  
  // Setup
  await setupDb();
  
  // Login
  console.log(`${colors.blue}📡 Authentication${colors.reset}`);
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log(`${colors.yellow}⚠️  Authentication failed - some tests may fail with 401${colors.reset}\n`);
  } else {
    console.log(`${colors.green}✅ Authenticated${colors.reset}\n`);
  }
  
  // Run test suites
  await testXSSSanitization();
  await testVariantOwnershipValidation();
  await testRegularPriceValidation();
  await testBoundsRecalculation();
  await testDataIntegrityWithLargeVariants();
  await testPerformance();
  await testRegression();
  
  // Teardown
  await teardownDb();
  
  // Print summary
  console.log(`\n${colors.cyan}📊 Test Summary${colors.reset}`);
  console.log('='.repeat(60));
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const totalDuration = results.reduce((sum, r) => sum + (r.duration || 0), 0);
  const avgDuration = results.length > 0 ? Math.round(totalDuration / results.length) : 0;
  
  console.log(`${colors.green}✅ Passed: ${passed}/${results.length}${colors.reset}`);
  if (failed > 0) {
    console.log(`${colors.red}❌ Failed: ${failed}/${results.length}${colors.reset}`);
  }
  console.log(`⏱️  Average duration: ${avgDuration}ms`);
  console.log(`⏱️  Total duration: ${totalDuration}ms`);
  
  if (failed > 0) {
    console.log(`\n${colors.red}❌ Failed Tests:${colors.reset}`);
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  - ${r.name}: ${r.error}`);
    });
  }
  
  console.log('\n' + '='.repeat(60));
  
  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch((error) => {
  console.error(`${colors.red}❌ Test suite failed:${colors.reset}`, error);
  process.exit(1);
});

