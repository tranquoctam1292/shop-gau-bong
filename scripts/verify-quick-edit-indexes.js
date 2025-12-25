/**
 * Verify Quick Edit Indexes Script
 * 
 * Verifies that indexes for Quick Edit performance optimization are created correctly
 * 
 * Run: node scripts/verify-quick-edit-indexes.js
 */

// Load environment variables
require('dotenv').config({ path: require('path').resolve(process.cwd(), '.env.local') });

const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGODB_URL;

if (!MONGODB_URI) {
  console.error('❌ Error: MONGODB_URI not found in environment variables!');
  console.error('   Please set MONGODB_URI in .env.local file');
  process.exit(1);
}

async function verifyIndexes() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db();
    
    console.log('🔍 Verifying Quick Edit Performance Indexes\n');
    console.log('='.repeat(60));
    console.log(`📊 Database: ${db.databaseName}`);
    console.log(`🔗 Connection: ${MONGODB_URI.replace(/\/\/.*@/, '//***@')}`);
    console.log('='.repeat(60));
    
    // Check collections
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    console.log('\n📋 Available Collections:');
    collectionNames.forEach(name => {
      console.log(`   - ${name}`);
    });
    
    let allPassed = true;
    
    // 1. Verify Products Collection
    console.log('\n📦 Products Collection:');
    if (collectionNames.includes('products')) {
      const productsIndexes = await db.collection('products').indexes();
      const slugIndex = productsIndexes.find(idx => idx.key && idx.key.slug === 1);
      
      console.log(`   ✅ Collection exists`);
      console.log(`   📊 Total indexes: ${productsIndexes.length}`);
      
      if (slugIndex) {
        console.log(`   ✅ slug index found:`);
        console.log(`      Name: ${slugIndex.name}`);
        console.log(`      Key: ${JSON.stringify(slugIndex.key)}`);
        console.log(`      Unique: ${slugIndex.unique ? '✅ Yes' : '❌ No'}`);
        console.log(`      Sparse: ${slugIndex.sparse ? '✅ Yes' : '❌ No'}`);
        
        if (slugIndex.unique && slugIndex.sparse) {
          console.log(`   ✅ Index configuration: CORRECT`);
        } else {
          console.log(`   ⚠️  Index configuration: Needs update`);
          if (!slugIndex.unique) console.log(`      - Missing: unique: true`);
          if (!slugIndex.sparse) console.log(`      - Missing: sparse: true`);
          allPassed = false;
        }
      } else {
        console.log(`   ❌ slug index NOT FOUND`);
        console.log(`   💡 Run: npm run db:setup-indexes`);
        allPassed = false;
      }
      
      // List all indexes
      console.log(`\n   📋 All indexes:`);
      productsIndexes.forEach(idx => {
        const isSlug = idx.key && idx.key.slug === 1;
        const unique = idx.unique ? ' (unique)' : '';
        const sparse = idx.sparse ? ' (sparse)' : '';
        console.log(`      ${isSlug ? '✅' : '  '} ${idx.name}: ${JSON.stringify(idx.key)}${unique}${sparse}`);
      });
    } else {
      console.log(`   ❌ Collection does NOT exist`);
      allPassed = false;
    }
    
    // 2. Verify Categories Collection
    console.log('\n📁 Categories Collection:');
    if (collectionNames.includes('categories')) {
      const categoriesIndexes = await db.collection('categories').indexes();
      const slugIndex = categoriesIndexes.find(idx => idx.key && idx.key.slug === 1);
      
      console.log(`   ✅ Collection exists`);
      console.log(`   📊 Total indexes: ${categoriesIndexes.length}`);
      
      if (slugIndex) {
        console.log(`   ✅ slug index found:`);
        console.log(`      Name: ${slugIndex.name}`);
        console.log(`      Key: ${JSON.stringify(slugIndex.key)}`);
        console.log(`      Unique: ${slugIndex.unique ? '✅ Yes' : '❌ No'}`);
        console.log(`      Sparse: ${slugIndex.sparse ? '✅ Yes' : '❌ No'}`);
        
        if (slugIndex.unique && slugIndex.sparse) {
          console.log(`   ✅ Index configuration: CORRECT`);
        } else {
          console.log(`   ⚠️  Index configuration: Needs update`);
          if (!slugIndex.unique) console.log(`      - Missing: unique: true`);
          if (!slugIndex.sparse) console.log(`      - Missing: sparse: true`);
          allPassed = false;
        }
      } else {
        console.log(`   ❌ slug index NOT FOUND`);
        console.log(`   💡 Run: npm run db:setup-indexes`);
        allPassed = false;
      }
      
      // List all indexes
      console.log(`\n   📋 All indexes:`);
      categoriesIndexes.forEach(idx => {
        const isSlug = idx.key && idx.key.slug === 1;
        const unique = idx.unique ? ' (unique)' : '';
        const sparse = idx.sparse ? ' (sparse)' : '';
        console.log(`      ${isSlug ? '✅' : '  '} ${idx.name}: ${JSON.stringify(idx.key)}${unique}${sparse}`);
      });
    } else {
      console.log(`   ⚠️  Collection does NOT exist (may be normal if not migrated yet)`);
    }
    
    // 3. Test Query Performance
    console.log('\n⚡ Testing Query Performance:\n');
    
    if (collectionNames.includes('products')) {
      // Get a product with slug
      const productWithSlug = await db.collection('products').findOne({
        slug: { $exists: true, $ne: null, $ne: '' }
      });
      
      if (productWithSlug) {
        console.log(`   Testing: Product lookup by slug`);
        
        // Warmup
        await db.collection('products').findOne({ slug: productWithSlug.slug });
        
        // Test with explain (use find().explain() instead of findOne().explain())
        const explainResult = await db.collection('products').find({ slug: productWithSlug.slug }).limit(1).explain('executionStats');
        
        const executionStats = explainResult.executionStats || explainResult.queryPlanner?.winningPlan;
        const stage = executionStats?.executionStages?.stage || executionStats?.stage;
        const indexName = executionStats?.executionStages?.indexName || executionStats?.indexName;
        const executionTime = executionStats?.executionTimeMillis || 0;
        const docsExamined = executionStats?.totalDocsExamined || executionStats?.docsExamined || 0;
        
        console.log(`      Execution Time: ${executionTime}ms`);
        console.log(`      Stage: ${stage}`);
        console.log(`      Index Used: ${indexName || 'N/A'}`);
        console.log(`      Docs Examined: ${docsExamined}`);
        
        if (stage === 'IXSCAN' || indexName) {
          console.log(`   ✅ Using INDEX SCAN (optimal)`);
        } else if (stage === 'COLLSCAN') {
          console.log(`   ⚠️  Using COLLECTION SCAN (not optimal - index may not be used)`);
          allPassed = false;
        } else {
          console.log(`   ℹ️  Stage: ${stage}`);
        }
        
        if (executionTime > 0 && executionTime < 50) {
          console.log(`   ✅ Query time: ${executionTime}ms (acceptable)`);
        } else if (executionTime >= 50) {
          console.log(`   ⚠️  Query time: ${executionTime}ms (may be slow)`);
        }
      } else {
        console.log(`   ⚠️  No products with slug found for testing`);
      }
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('\n📊 Verification Summary:\n');
    
    if (allPassed) {
      console.log('✅ All indexes verified successfully!');
      console.log('\n💡 Next steps:');
      console.log('   1. Run performance test: npm run test:quick-edit-performance');
      console.log('   2. Verify improvements in actual Quick Edit usage');
    } else {
      console.log('⚠️  Some issues found. Please review above.');
      console.log('\n💡 Solutions:');
      console.log('   1. Run: npm run db:setup-indexes');
      console.log('   2. Verify database connection in .env.local');
      console.log('   3. Check MongoDB server is running');
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
  verifyIndexes()
    .then(() => {
      console.log('\n✨ Verification completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Verification failed:', error);
      process.exit(1);
    });
}

module.exports = { verifyIndexes };

