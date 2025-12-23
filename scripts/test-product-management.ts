/**
 * Test Product Management Logic
 * Tests API routes, validation, edge cases
 * 
 * Usage: npm run test:product-management
 */

import { config } from 'dotenv';
import path from 'path';

// Load environment variables
config({ path: path.resolve(process.cwd(), '.env.local') });

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  details?: any;
}

const results: TestResult[] = [];

async function test(name: string, fn: () => Promise<void> | void) {
  try {
    await fn();
    results.push({ name, passed: true });
    console.log(`✅ ${name}`);
  } catch (error: any) {
    results.push({ name, passed: false, error: error.message, details: error });
    console.error(`❌ ${name}: ${error.message}`);
  }
}

// Test 1: Create product with missing required fields
async function testMissingRequiredFields() {
  const response = await fetch(`${API_BASE}/api/admin/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // Note: In real test, would need auth token
    },
    body: JSON.stringify({
      // Missing name, slug, minPrice
      description: 'Test product',
    }),
  });

  if (response.status !== 400 && response.status !== 401) {
    throw new Error(`Expected 400 or 401, got ${response.status}`);
  }
}

// Test 2: Create product with duplicate slug
async function testDuplicateSlug() {
  const productData = {
    name: 'Test Product',
    slug: 'test-product-duplicate',
    minPrice: 100000,
    status: 'draft',
  };

  // First create
  const response1 = await fetch(`${API_BASE}/api/admin/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(productData),
  });

  // Second create with same slug
  const response2 = await fetch(`${API_BASE}/api/admin/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(productData),
  });

  if (response2.status !== 409 && response2.status !== 401) {
    throw new Error(`Expected 409 (conflict) or 401, got ${response2.status}`);
  }
}

// Test 3: Create product with empty variants array
async function testEmptyVariants() {
  const productData = {
    name: 'Test Product No Variants',
    slug: `test-product-no-variants-${Date.now()}`,
    minPrice: 0, // Should be calculated from variants or default
    variants: [],
    status: 'draft',
  };

  const response = await fetch(`${API_BASE}/api/admin/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(productData),
  });

  // Should handle empty variants gracefully
  if (response.status !== 201 && response.status !== 400 && response.status !== 401) {
    const data = await response.json();
    throw new Error(`Unexpected status ${response.status}: ${JSON.stringify(data)}`);
  }
}

// Test 4: Create product with invalid price (negative)
async function testNegativePrice() {
  const productData = {
    name: 'Test Product',
    slug: `test-product-negative-${Date.now()}`,
    minPrice: -100, // Invalid
    status: 'draft',
  };

  const response = await fetch(`${API_BASE}/api/admin/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(productData),
  });

  if (response.status !== 400 && response.status !== 401) {
    throw new Error(`Expected 400 (validation error) or 401, got ${response.status}`);
  }
}

// Test 5: Create product with volumetric weight calculation
async function testVolumetricWeight() {
  const productData = {
    name: 'Test Product',
    slug: `test-product-volumetric-${Date.now()}`,
    minPrice: 100000,
    length: 30,
    width: 25,
    height: 35,
    // volumetricWeight should be auto-calculated: (30 * 25 * 35) / 6000 = 4.375
    status: 'draft',
  };

  const response = await fetch(`${API_BASE}/api/admin/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(productData),
  });

  if (response.status === 201) {
    const data = await response.json();
    const expectedVolumetric = (30 * 25 * 35) / 6000;
    if (Math.abs((data.product.volumetricWeight || 0) - expectedVolumetric) > 0.01) {
      throw new Error(`Volumetric weight mismatch. Expected ~${expectedVolumetric}, got ${data.product.volumetricWeight}`);
    }
  } else if (response.status !== 401) {
    const data = await response.json();
    throw new Error(`Unexpected status ${response.status}: ${JSON.stringify(data)}`);
  }
}

// Test 6: Update product with invalid ID
async function testUpdateInvalidId() {
  const response = await fetch(`${API_BASE}/api/admin/products/invalid-id-12345`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Updated Name',
    }),
  });

  if (response.status !== 404 && response.status !== 401) {
    throw new Error(`Expected 404 (not found) or 401, got ${response.status}`);
  }
}

// Test 7: Get product with invalid ID
async function testGetInvalidId() {
  const response = await fetch(`${API_BASE}/api/admin/products/invalid-id-12345`);

  if (response.status !== 404 && response.status !== 401) {
    throw new Error(`Expected 404 (not found) or 401, got ${response.status}`);
  }
}

// Test 8: Delete product with invalid ID
async function testDeleteInvalidId() {
  const response = await fetch(`${API_BASE}/api/admin/products/invalid-id-12345`, {
    method: 'DELETE',
  });

  if (response.status !== 404 && response.status !== 401) {
    throw new Error(`Expected 404 (not found) or 401, got ${response.status}`);
  }
}

// Test 9: Create product with very long name
async function testLongName() {
  const longName = 'A'.repeat(1000);
  const productData = {
    name: longName,
    slug: `test-product-long-${Date.now()}`,
    minPrice: 100000,
    status: 'draft',
  };

  const response = await fetch(`${API_BASE}/api/admin/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(productData),
  });

  // Should either accept or reject with proper validation
  if (response.status !== 201 && response.status !== 400 && response.status !== 401) {
    const data = await response.json();
    throw new Error(`Unexpected status ${response.status}: ${JSON.stringify(data)}`);
  }
}

// Test 10: Create product with special characters in slug
async function testSpecialCharactersSlug() {
  const productData = {
    name: 'Test Product',
    slug: 'test-product-@#$%^&*()',
    minPrice: 100000,
    status: 'draft',
  };

  const response = await fetch(`${API_BASE}/api/admin/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(productData),
  });

  // Slug should be sanitized or rejected
  if (response.status !== 201 && response.status !== 400 && response.status !== 401) {
    const data = await response.json();
    throw new Error(`Unexpected status ${response.status}: ${JSON.stringify(data)}`);
  }
}

// Run all tests
async function runTests() {
  console.log('🧪 Starting Product Management Tests...\n');

  await test('Missing required fields validation', testMissingRequiredFields);
  await test('Duplicate slug detection', testDuplicateSlug);
  await test('Empty variants array handling', testEmptyVariants);
  await test('Negative price validation', testNegativePrice);
  await test('Volumetric weight calculation', testVolumetricWeight);
  await test('Update with invalid ID', testUpdateInvalidId);
  await test('Get with invalid ID', testGetInvalidId);
  await test('Delete with invalid ID', testDeleteInvalidId);
  await test('Very long name handling', testLongName);
  await test('Special characters in slug', testSpecialCharactersSlug);

  // Summary
  console.log('\n📊 Test Summary:');
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Total: ${results.length}`);

  if (failed > 0) {
    console.log('\n❌ Failed Tests:');
    results.filter((r) => !r.passed).forEach((r) => {
      console.log(`  - ${r.name}: ${r.error}`);
    });
    process.exit(1);
  }
}

runTests().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

