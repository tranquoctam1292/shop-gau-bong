/**
 * Test Script: Smart SKU Phase 1
 * 
 * Tests:
 * 1. Database collections exist
 * 2. Migration script (category codes)
 * 3. Core SKU generator functions
 * 4. Two-path logic (with/without INCREMENT)
 * 5. Abbreviation lookup
 * 6. Atomic increment
 * 7. SKU normalization
 * 8. Variant uniqueness validation
 * 
 * Usage: npm run test:smart-sku-phase1
 * or: tsx scripts/test-smart-sku-phase1.ts
 */

// Load environment variables from .env.local
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') });

import { getCollections, closeDB, ObjectId } from '../lib/db';
import {
  normalizeSku,
  getAbbreviation,
  getCategoryCode,
  getNextIncrement,
  parsePattern,
  generateSku,
  getSkuPattern,
  type SkuContext,
  type AttributePair,
} from '../lib/utils/skuGenerator';
import { validateVariantUniqueness } from '../lib/utils/skuValidator';
import { generateSlug } from '../lib/utils/slug';

// Test colors
const colors = {
  PASS: '\x1b[32m', // Green
  FAIL: '\x1b[31m', // Red
  INFO: '\x1b[36m', // Cyan
  WARN: '\x1b[33m', // Yellow
  RESET: '\x1b[0m',
};

function log(message: string, type: 'pass' | 'fail' | 'info' | 'warn' = 'info') {
  const color = colors[type.toUpperCase() as keyof typeof colors] || colors.RESET;
  console.log(`${color}${message}${colors.RESET}`);
}

let testsPassed = 0;
let testsFailed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    log(`✅ ${message}`, 'pass');
    testsPassed++;
  } else {
    log(`❌ ${message}`, 'fail');
    testsFailed++;
  }
}

async function testCollections() {
  log('\n📦 Test 1: Database Collections', 'info');
  
  try {
    const collections = await getCollections();
    
    assert(!!collections.skuSettings, 'skuSettings collection exists');
    assert(!!collections.skuAbbreviations, 'skuAbbreviations collection exists');
    assert(!!collections.skuCounters, 'skuCounters collection exists');
    assert(!!collections.skuHistory, 'skuHistory collection exists');
    assert(!!collections.categories, 'categories collection exists');
    
    log(`   Collections initialized successfully\n`, 'info');
  } catch (error: any) {
    log(`   ❌ Error: ${error.message}`, 'fail');
    testsFailed++;
  }
}

async function testCategoryCodes() {
  log('\n📦 Test 2: Category Codes Migration', 'info');
  
  try {
    const collections = await getCollections();
    
    // Check if categories have code field
    const categoriesWithoutCode = await collections.categories.countDocuments({
      $or: [
        { code: { $exists: false } },
        { code: null },
        { code: '' },
      ],
    });
    
    if (categoriesWithoutCode > 0) {
      log(`   ⚠️  Warning: ${categoriesWithoutCode} categories missing code field`, 'warn');
      log(`   💡 Run: npm run migrate:category-codes`, 'info');
    } else {
      log(`   ✅ All categories have code field`, 'pass');
      testsPassed++;
    }
    
    // Test getCategoryCode function
    const sampleCategory = await collections.categories.findOne({});
    if (sampleCategory && sampleCategory.code) {
      try {
        const code = await getCategoryCode(sampleCategory._id.toString());
        assert(code === sampleCategory.code, `getCategoryCode returns correct code: ${code}`);
      } catch (error: any) {
        log(`   ❌ getCategoryCode error: ${error.message}`, 'fail');
        testsFailed++;
      }
    }
    
    log('', 'info');
  } catch (error: any) {
    log(`   ❌ Error: ${error.message}`, 'fail');
    testsFailed++;
  }
}

async function testSkuNormalization() {
  log('\n📦 Test 3: SKU Normalization', 'info');
  
  assert(normalizeSku('AT-RED-L-001') === 'ATREDL001', 'Normalize: AT-RED-L-001 → ATREDL001');
  assert(normalizeSku('at-red-l-001') === 'ATREDL001', 'Normalize: lowercase → uppercase');
  assert(normalizeSku('AT_RED_L_001') === 'ATREDL001', 'Normalize: underscore removed');
  assert(normalizeSku('AT.RED.L.001') === 'ATREDL001', 'Normalize: dot removed');
  assert(normalizeSku('') === '', 'Normalize: empty string → empty');
  assert(normalizeSku('  AT-RED  ') === 'ATRED', 'Normalize: trim spaces');
  
  log('', 'info');
}

async function testParsePattern() {
  log('\n📦 Test 4: Pattern Parsing', 'info');
  
  const context: SkuContext = {
    categoryCode: 'AT',
    productName: 'Áo Thun',
    attributes: [
      { key: 'size', value: 'L' },
      { key: 'color', value: 'Đỏ' },
    ],
    year: 2025,
  };
  
  // Test with all tokens
  const pattern1 = '{CATEGORY_CODE}-{PRODUCT_NAME}-{ATTRIBUTE_VALUE}-{YEAR}-{INCREMENT}';
  const result1 = parsePattern(pattern1, context, '-', 'UPPER', 1);
  assert(result1.includes('AT'), 'Pattern includes CATEGORY_CODE');
  assert(result1.includes('001'), 'Pattern includes INCREMENT');
  log(`   Pattern: ${pattern1}`, 'info');
  log(`   Result: ${result1}`, 'info');
  
  // Test without INCREMENT
  const pattern2 = '{CATEGORY_CODE}-{PRODUCT_NAME}';
  const result2 = parsePattern(pattern2, context, '-', 'UPPER');
  // Product name is slugified and uppercased, then truncated to 10 chars
  const expectedProductName = generateSlug('Áo Thun').toUpperCase().substring(0, 10);
  const expected2 = `AT-${expectedProductName}`;
  assert(result2 === expected2, `Pattern without increment: ${result2} (expected: ${expected2})`);
  
  // Test BRAND_CODE (empty)
  const pattern3 = '{BRAND_CODE}-{CATEGORY_CODE}';
  const result3 = parsePattern(pattern3, context, '-', 'UPPER');
  assert(result3 === 'AT', `BRAND_CODE empty: ${result3}`);
  
  // Test with brand code
  const contextWithBrand: SkuContext = {
    ...context,
    brandCode: 'NK',
  };
  const result4 = parsePattern(pattern3, contextWithBrand, '-', 'UPPER');
  assert(result4 === 'NK-AT', `BRAND_CODE with value: ${result4}`);
  
  log('', 'info');
}

async function testAbbreviation() {
  log('\n📦 Test 5: Abbreviation Lookup', 'info');
  
  try {
    const collections = await getCollections();
    
    // Create test abbreviation
    const testAbbr = {
      type: 'ATTRIBUTE' as const,
      originalValue: 'Màu Đỏ',
      shortCode: 'DO',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    // Check if exists, if not create
    const existing = await collections.skuAbbreviations.findOne({
      type: 'ATTRIBUTE',
      originalValue: 'Màu Đỏ',
    });
    
    if (!existing) {
      await collections.skuAbbreviations.insertOne(testAbbr);
      log('   Created test abbreviation: Màu Đỏ → DO', 'info');
    }
    
    // Test lookup (should find)
    const code1 = await getAbbreviation('ATTRIBUTE', 'Màu Đỏ');
    assert(code1 === 'DO', `Abbreviation found: Màu Đỏ → ${code1}`);
    
    // Test auto-generate (should not find)
    const code2 = await getAbbreviation('ATTRIBUTE', 'Màu Xanh Lá');
    assert(code2.length > 0, `Auto-generated abbreviation: ${code2}`);
    log(`   Auto-generated: Màu Xanh Lá → ${code2}`, 'info');
    
    log('', 'info');
  } catch (error: any) {
    log(`   ❌ Error: ${error.message}`, 'fail');
    testsFailed++;
  }
}

async function testAtomicIncrement() {
  log('\n📦 Test 6: Atomic Increment', 'info');
  
  try {
    const testKey = `TEST-${Date.now()}`;
    
    // Get first increment
    const seq1 = await getNextIncrement(testKey);
    assert(seq1 === 1, `First increment: ${seq1}`);
    
    // Get second increment
    const seq2 = await getNextIncrement(testKey);
    assert(seq2 === 2, `Second increment: ${seq2}`);
    
    // Get third increment
    const seq3 = await getNextIncrement(testKey);
    assert(seq3 === 3, `Third increment: ${seq3}`);
    
    log(`   ✅ Atomic increment working: ${seq1}, ${seq2}, ${seq3}`, 'pass');
    
    // Cleanup test counter
    const collections = await getCollections();
    await collections.skuCounters.deleteOne({ key: testKey });
    
    log('', 'info');
  } catch (error: any) {
    log(`   ❌ Error: ${error.message}`, 'fail');
    testsFailed++;
  }
}

async function testTwoPathLogic() {
  log('\n📦 Test 7: Two-Path Logic', 'info');
  
  try {
    const collections = await getCollections();
    
    // Create test category if needed
    let testCategory = await collections.categories.findOne({ code: { $exists: true } });
    if (!testCategory) {
      // Create a test category
      const result = await collections.categories.insertOne({
        name: 'Test Category',
        slug: 'test-category',
        code: 'TEST',
        status: 'active',
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      testCategory = await collections.categories.findOne({ _id: result.insertedId });
    }
    
    if (!testCategory || !testCategory.code) {
      log('   ⚠️  Skipping: No category with code found', 'warn');
      return;
    }
    
    const context: SkuContext = {
      categoryCode: testCategory.code,
      productName: 'Test Product',
      year: 2025,
    };
    
    // Test Path 1: Pattern WITH {INCREMENT}
    log('   Testing Path 1: Pattern WITH {INCREMENT}', 'info');
    const pattern1 = '{CATEGORY_CODE}-{PRODUCT_NAME}-{INCREMENT}';
    
    // Set default pattern if not exists
    const existingSetting = await collections.skuSettings.findOne({ categoryId: null });
    if (!existingSetting) {
      await collections.skuSettings.insertOne({
        categoryId: null,
        pattern: pattern1,
        separator: '-',
        caseType: 'UPPER',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    
    const sku1 = await generateSku(
      pattern1,
      context,
      '-',
      'UPPER',
      undefined,
      false,
      false // Not preview mode
    );
    
    assert(sku1.includes(testCategory.code), `Path 1 SKU includes category code: ${sku1}`);
    assert(sku1.includes('001') || sku1.includes('002'), `Path 1 SKU includes increment: ${sku1}`);
    log(`   ✅ Path 1 result: ${sku1}`, 'pass');
    
    // Test Path 2: Pattern WITHOUT {INCREMENT}
    log('   Testing Path 2: Pattern WITHOUT {INCREMENT}', 'info');
    const pattern2 = '{CATEGORY_CODE}-{PRODUCT_NAME}';
    const sku2 = await generateSku(
      pattern2,
      context,
      '-',
      'UPPER',
      undefined,
      false,
      false
    );
    
    assert(sku2.includes(testCategory.code), `Path 2 SKU includes category code: ${sku2}`);
    log(`   ✅ Path 2 result: ${sku2}`, 'pass');
    
    // Test Preview Mode (should show placeholder)
    log('   Testing Preview Mode', 'info');
    const previewSku = await generateSku(
      pattern1,
      context,
      '-',
      'UPPER',
      undefined,
      false,
      true // Preview mode
    );
    
    assert(previewSku.includes('###'), `Preview mode shows placeholder: ${previewSku}`);
    log(`   ✅ Preview result: ${previewSku}`, 'pass');
    
    log('', 'info');
  } catch (error: any) {
    log(`   ❌ Error: ${error.message}`, 'fail');
    testsFailed++;
    if (error.stack) {
      log(`   Stack: ${error.stack}`, 'fail');
    }
  }
}

async function testVariantUniqueness() {
  log('\n📦 Test 8: Variant Uniqueness Validation', 'info');
  
  // Test valid variants
  const validVariants = [
    { size: 'L', color: 'Red' },
    { size: 'M', color: 'Red' },
    { size: 'L', color: 'Blue' },
  ];
  
  const result1 = validateVariantUniqueness(validVariants);
  assert(result1.isValid === true, 'Valid variants pass validation');
  assert(result1.errors.length === 0, 'No errors for valid variants');
  
  // Test duplicate variants
  const duplicateVariants = [
    { size: 'L', color: 'Red' },
    { size: 'L', color: 'Red' }, // Duplicate
  ];
  
  const result2 = validateVariantUniqueness(duplicateVariants);
  assert(result2.isValid === false, 'Duplicate variants fail validation');
  assert(result2.errors.length > 0, 'Errors found for duplicate variants');
  log(`   Error message: ${result2.errors[0]}`, 'info');
  
  log('', 'info');
}

async function testGetSkuPattern() {
  log('\n📦 Test 9: Get SKU Pattern from Database', 'info');
  
  try {
    const collections = await getCollections();
    
    // Create global pattern if not exists
    const globalPattern = await collections.skuSettings.findOne({ categoryId: null });
    if (!globalPattern) {
      await collections.skuSettings.insertOne({
        categoryId: null,
        pattern: '{CATEGORY_CODE}-{PRODUCT_NAME}-{INCREMENT}',
        separator: '-',
        caseType: 'UPPER',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      log('   Created default global pattern', 'info');
    }
    
    // Test get global pattern
    const pattern1 = await getSkuPattern(null);
    assert(pattern1.pattern.includes('{CATEGORY_CODE}'), 'Global pattern retrieved');
    log(`   Global pattern: ${pattern1.pattern}`, 'info');
    
    // Test get pattern for category (should fallback to global)
    const testCategory = await collections.categories.findOne({});
    if (testCategory) {
      const pattern2 = await getSkuPattern(testCategory._id.toString());
      assert(pattern2.pattern.length > 0, 'Category pattern retrieved (fallback to global)');
      log(`   Category pattern: ${pattern2.pattern}`, 'info');
    }
    
    log('', 'info');
  } catch (error: any) {
    log(`   ❌ Error: ${error.message}`, 'fail');
    testsFailed++;
  }
}

async function runAllTests() {
  console.log('\n🧪 Smart SKU Phase 1 - Test Suite\n');
  console.log('=' .repeat(60));
  
  try {
    await testCollections();
    await testCategoryCodes();
    await testSkuNormalization();
    await testParsePattern();
    await testAbbreviation();
    await testAtomicIncrement();
    await testTwoPathLogic();
    await testVariantUniqueness();
    await testGetSkuPattern();
    
    // Summary
    console.log('\n' + '='.repeat(60));
    log(`\n📊 Test Summary:`, 'info');
    log(`   ✅ Passed: ${testsPassed}`, 'pass');
    log(`   ❌ Failed: ${testsFailed}`, testsFailed > 0 ? 'fail' : 'pass');
    log(`   📦 Total: ${testsPassed + testsFailed}\n`, 'info');
    
    if (testsFailed === 0) {
      log('🎉 All tests passed! Phase 1 is ready.\n', 'pass');
      process.exit(0);
    } else {
      log('⚠️  Some tests failed. Please review errors above.\n', 'warn');
      process.exit(1);
    }
  } catch (error: any) {
    log(`\n❌ Test suite failed: ${error.message}`, 'fail');
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  } finally {
    await closeDB();
  }
}

// Run tests
runAllTests();

