/**
 * Quick Edit Performance Test Script
 * 
 * Task: 3.1.1 & 3.1.2 - Test MongoDB query performance với và không có indexes
 * 
 * Run: node scripts/test-quick-edit-performance.js
 * 
 * This script:
 * 1. Checks if indexes exist
 * 2. Tests query performance với indexes
 * 3. Compares với expected performance improvements
 */

// Load environment variables
require('dotenv').config({ path: require('path').resolve(process.cwd(), '.env.local') });

const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGODB_URL;

if (!MONGODB_URI) {
  console.error('❌ Error: MONGODB_URI not found in environment variables!');
  console.error('   Please set MONGODB_URI in .env.local file');
  process.exit(1);
}

// Test configuration
const TEST_CONFIG = {
  iterations: 10, // Number of test iterations
  warmupIterations: 3, // Warmup iterations (not counted)
};

async function testPerformance() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db();
    
    console.log('🚀 Quick Edit Performance Test\n');
    console.log('=' .repeat(60));
    
    // 1. Check indexes
    console.log('\n📋 Step 1: Checking indexes...\n');
    
    // Check if collections exist
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    if (!collectionNames.includes('products')) {
      console.error('❌ Error: products collection does not exist!');
      console.error('   Please ensure database is set up correctly.');
      return;
    }
    
    let productsIndexes = [];
    let categoriesIndexes = [];
    
    try {
      productsIndexes = await db.collection('products').indexes();
    } catch (error) {
      console.error('❌ Error getting products indexes:', error.message);
      return;
    }
    
    if (collectionNames.includes('categories')) {
      try {
        categoriesIndexes = await db.collection('categories').indexes();
      } catch (error) {
        console.warn('⚠️  Warning: Could not get categories indexes:', error.message);
      }
    } else {
      console.warn('⚠️  Warning: categories collection does not exist. Some tests will be skipped.');
    }
    
    // Find slug index - check by key (slug: 1) instead of name
    const productsSlugIndex = productsIndexes.find(idx => 
      idx.key && idx.key.slug === 1
    );
    const categoriesSlugIndex = categoriesIndexes.find(idx => 
      idx.key && idx.key.slug === 1
    );
    
    console.log('Products indexes:');
    productsIndexes.forEach(idx => {
      const isSlugIndex = idx.key && idx.key.slug === 1;
      const unique = idx.unique ? ' (unique)' : '';
      const sparse = idx.sparse ? ' (sparse)' : '';
      console.log(`  ${isSlugIndex ? '✅' : '  '} ${idx.name}: ${JSON.stringify(idx.key)}${unique}${sparse}`);
    });
    
    console.log('\nCategories indexes:');
    if (categoriesIndexes.length > 0) {
      categoriesIndexes.forEach(idx => {
        const isSlugIndex = idx.key && idx.key.slug === 1;
        const unique = idx.unique ? ' (unique)' : '';
        const sparse = idx.sparse ? ' (sparse)' : '';
        console.log(`  ${isSlugIndex ? '✅' : '  '} ${idx.name}: ${JSON.stringify(idx.key)}${unique}${sparse}`);
      });
    } else {
      console.log('  (no indexes found)');
    }
    
    if (!productsSlugIndex) {
      console.warn('\n⚠️  WARNING: products.slug index not found!');
      console.warn('   Run: npm run db:setup-indexes');
    }
    
    if (!categoriesSlugIndex) {
      console.warn('\n⚠️  WARNING: categories.slug index not found!');
      console.warn('   Run: npm run db:setup-indexes');
    }
    
    // 2. Get test data
    console.log('\n📊 Step 2: Getting test data...\n');
    
    // Get a product with slug
    const productWithSlug = await db.collection('products').findOne({
      slug: { $exists: true, $ne: null, $ne: '' }
    });
    
    // Get a product with ObjectId
    const productWithId = await db.collection('products').findOne({
      _id: { $exists: true }
    });
    
    // Get categories
    const categoryWithSlug = await db.collection('categories').findOne({
      slug: { $exists: true, $ne: null, $ne: '' }
    });
    
    if (!productWithSlug && !productWithId) {
      console.error('❌ No products found in database!');
      return;
    }
    
    if (!categoryWithSlug) {
      console.warn('⚠️  No categories with slug found. Some tests will be skipped.');
    }
    
    // 3. Test queries
    console.log('\n⚡ Step 3: Testing query performance...\n');
    
    const results = {
      productById: [],
      productBySlug: [],
      categoryBySlug: [],
    };
    
    // Warmup
    console.log('🔥 Warming up...');
    for (let i = 0; i < TEST_CONFIG.warmupIterations; i++) {
      if (productWithId) {
        await db.collection('products').findOne({ _id: productWithId._id });
      }
      if (productWithSlug) {
        await db.collection('products').findOne({ slug: productWithSlug.slug });
      }
      if (categoryWithSlug) {
        await db.collection('categories').findOne({ slug: categoryWithSlug.slug });
      }
    }
    
    // Test Product by _id
    if (productWithId) {
      console.log('📦 Testing: Product lookup by _id...');
      for (let i = 0; i < TEST_CONFIG.iterations; i++) {
        const start = process.hrtime.bigint();
        await db.collection('products').findOne({ _id: productWithId._id });
        const end = process.hrtime.bigint();
        const duration = Number(end - start) / 1_000_000; // Convert to milliseconds
        results.productById.push(duration);
      }
    }
    
    // Test Product by slug
    if (productWithSlug) {
      console.log('📦 Testing: Product lookup by slug...');
      for (let i = 0; i < TEST_CONFIG.iterations; i++) {
        const start = process.hrtime.bigint();
        await db.collection('products').findOne({ slug: productWithSlug.slug });
        const end = process.hrtime.bigint();
        const duration = Number(end - start) / 1_000_000; // Convert to milliseconds
        results.productBySlug.push(duration);
      }
    }
    
    // Test Category by slug
    if (categoryWithSlug && collectionNames.includes('categories')) {
      console.log('📁 Testing: Category lookup by slug...');
      for (let i = 0; i < TEST_CONFIG.iterations; i++) {
        const start = process.hrtime.bigint();
        await db.collection('categories').findOne({ slug: categoryWithSlug.slug });
        const end = process.hrtime.bigint();
        const duration = Number(end - start) / 1_000_000; // Convert to milliseconds
        results.categoryBySlug.push(duration);
      }
    }
    
    // 4. Calculate statistics
    console.log('\n📈 Step 4: Performance Results\n');
    console.log('=' .repeat(60));
    
    function calculateStats(times) {
      if (times.length === 0) return null;
      const sorted = [...times].sort((a, b) => a - b);
      const sum = times.reduce((a, b) => a + b, 0);
      const avg = sum / times.length;
      const min = sorted[0];
      const max = sorted[sorted.length - 1];
      const median = sorted[Math.floor(sorted.length / 2)];
      const p95 = sorted[Math.floor(sorted.length * 0.95)];
      const p99 = sorted[Math.floor(sorted.length * 0.99)];
      
      return { avg, min, max, median, p95, p99, count: times.length };
    }
    
    // Product by _id
    if (results.productById.length > 0) {
      const stats = calculateStats(results.productById);
      console.log('\n📦 Product Lookup by _id:');
      console.log(`   Average: ${stats.avg.toFixed(2)}ms`);
      console.log(`   Min: ${stats.min.toFixed(2)}ms`);
      console.log(`   Max: ${stats.max.toFixed(2)}ms`);
      console.log(`   Median: ${stats.median.toFixed(2)}ms`);
      console.log(`   P95: ${stats.p95.toFixed(2)}ms`);
      console.log(`   P99: ${stats.p99.toFixed(2)}ms`);
      console.log(`   ✅ Expected: <10ms (with _id index)`);
      if (stats.avg < 10) {
        console.log(`   ✅ PASS: Average ${stats.avg.toFixed(2)}ms < 10ms`);
      } else {
        console.log(`   ⚠️  WARNING: Average ${stats.avg.toFixed(2)}ms >= 10ms`);
      }
    }
    
    // Product by slug
    if (results.productBySlug.length > 0) {
      const stats = calculateStats(results.productBySlug);
      console.log('\n📦 Product Lookup by slug:');
      console.log(`   Average: ${stats.avg.toFixed(2)}ms`);
      console.log(`   Min: ${stats.min.toFixed(2)}ms`);
      console.log(`   Max: ${stats.max.toFixed(2)}ms`);
      console.log(`   Median: ${stats.median.toFixed(2)}ms`);
      console.log(`   P95: ${stats.p95.toFixed(2)}ms`);
      console.log(`   P99: ${stats.p99.toFixed(2)}ms`);
      if (productsSlugIndex) {
        console.log(`   ✅ Expected: <10ms (with slug index)`);
        if (stats.avg < 10) {
          console.log(`   ✅ PASS: Average ${stats.avg.toFixed(2)}ms < 10ms`);
        } else if (stats.avg < 50) {
          console.log(`   ⚠️  WARNING: Average ${stats.avg.toFixed(2)}ms (should be <10ms with index)`);
        } else {
          console.log(`   ❌ FAIL: Average ${stats.avg.toFixed(2)}ms (too slow, check index)`);
        }
      } else {
        console.log(`   ⚠️  Expected: 50-500ms (without index)`);
        if (stats.avg >= 50 && stats.avg <= 500) {
          console.log(`   ✅ As expected: ${stats.avg.toFixed(2)}ms (no index)`);
        } else if (stats.avg < 50) {
          console.log(`   ℹ️  Better than expected: ${stats.avg.toFixed(2)}ms (may have small collection)`);
        } else {
          console.log(`   ❌ Slower than expected: ${stats.avg.toFixed(2)}ms`);
        }
      }
    }
    
    // Category by slug
    if (results.categoryBySlug.length > 0) {
      const stats = calculateStats(results.categoryBySlug);
      console.log('\n📁 Category Lookup by slug:');
      console.log(`   Average: ${stats.avg.toFixed(2)}ms`);
      console.log(`   Min: ${stats.min.toFixed(2)}ms`);
      console.log(`   Max: ${stats.max.toFixed(2)}ms`);
      console.log(`   Median: ${stats.median.toFixed(2)}ms`);
      console.log(`   P95: ${stats.p95.toFixed(2)}ms`);
      console.log(`   P99: ${stats.p99.toFixed(2)}ms`);
      if (categoriesSlugIndex) {
        console.log(`   ✅ Expected: <10ms (with slug index)`);
        if (stats.avg < 10) {
          console.log(`   ✅ PASS: Average ${stats.avg.toFixed(2)}ms < 10ms`);
        } else if (stats.avg < 50) {
          console.log(`   ⚠️  WARNING: Average ${stats.avg.toFixed(2)}ms (should be <10ms with index)`);
        } else {
          console.log(`   ❌ FAIL: Average ${stats.avg.toFixed(2)}ms (too slow, check index)`);
        }
      } else {
        console.log(`   ⚠️  Expected: 20-200ms (without index)`);
        if (stats.avg >= 20 && stats.avg <= 200) {
          console.log(`   ✅ As expected: ${stats.avg.toFixed(2)}ms (no index)`);
        } else if (stats.avg < 20) {
          console.log(`   ℹ️  Better than expected: ${stats.avg.toFixed(2)}ms (may have small collection)`);
        } else {
          console.log(`   ❌ Slower than expected: ${stats.avg.toFixed(2)}ms`);
        }
      }
    }
    
    // 5. Summary
    console.log('\n' + '='.repeat(60));
    console.log('\n📊 Summary:\n');
    
    let allPassed = true;
    let improvement = 0;
    
    if (results.productBySlug.length > 0 && productsSlugIndex) {
      const stats = calculateStats(results.productBySlug);
      if (stats.avg >= 10) {
        allPassed = false;
      }
      // Estimate improvement (assuming 200ms without index)
      improvement += Math.max(0, 200 - stats.avg);
    }
    
    if (results.categoryBySlug.length > 0 && categoriesSlugIndex) {
      const stats = calculateStats(results.categoryBySlug);
      if (stats.avg >= 10) {
        allPassed = false;
      }
      // Estimate improvement (assuming 100ms without index)
      improvement += Math.max(0, 100 - stats.avg);
    }
    
    if (allPassed && (productsSlugIndex || categoriesSlugIndex)) {
      console.log('✅ All performance tests PASSED!');
      if (improvement > 0) {
        console.log(`\n💡 Estimated improvement: ~${improvement.toFixed(0)}ms saved per Quick Edit open`);
      }
    } else if (!productsSlugIndex && !categoriesSlugIndex) {
      console.log('⚠️  No indexes found. Run: npm run db:setup-indexes');
    } else {
      console.log('⚠️  Some performance tests need attention. Check results above.');
    }
    
    console.log('\n' + '='.repeat(60));
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n🔌 Database connection closed.');
  }
}

// Run if called directly
if (require.main === module) {
  testPerformance()
    .then(() => {
      console.log('\n✨ Performance test completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Performance test failed:', error);
      process.exit(1);
    });
}

module.exports = { testPerformance };

