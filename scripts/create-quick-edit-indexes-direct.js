/**
 * Create Quick Edit Indexes Directly
 * 
 * Creates indexes directly in the current database (teddy-shop)
 * 
 * Run: node scripts/create-quick-edit-indexes-direct.js
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

async function createIndexes() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db();
    
    console.log('🔧 Creating Quick Edit Performance Indexes\n');
    console.log('='.repeat(60));
    console.log(`📊 Database: ${db.databaseName}`);
    console.log('='.repeat(60));
    
    // 1. Products Collection - Slug Index
    console.log('\n📦 Products Collection:');
    try {
      // Drop existing index if exists (without sparse)
      try {
        await db.collection('products').dropIndex('slug_1');
        console.log('   ℹ️  Dropped existing slug_1 index');
      } catch (dropError) {
        // Index doesn't exist, continue
        if (dropError.code !== 27) { // 27 = IndexNotFound
          console.log('   ℹ️  Could not drop existing index:', dropError.message);
        }
      }
      
      // Create index with sparse option
      await db.collection('products').createIndex(
        { slug: 1 },
        { unique: true, sparse: true, name: 'slug_1_unique' }
      );
      console.log('   ✅ Created products.slug index (unique, sparse)');
    } catch (error) {
      if (error.code === 85 || error.codeName === 'IndexOptionsConflict') {
        console.log('   ⚠️  Index already exists: products.slug');
      } else {
        console.error('   ❌ Error creating products.slug index:', error.message);
        throw error;
      }
    }
    
    // 2. Categories Collection - Slug Index (if collection exists)
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    if (collectionNames.includes('categories')) {
      console.log('\n📁 Categories Collection:');
      try {
        // Drop existing index if exists (without sparse)
        try {
          await db.collection('categories').dropIndex('slug_1');
          console.log('   ℹ️  Dropped existing slug_1 index');
        } catch (dropError) {
          // Index doesn't exist, continue
          if (dropError.code !== 27) { // 27 = IndexNotFound
            console.log('   ℹ️  Could not drop existing index:', dropError.message);
          }
        }
        
        // Create index with sparse option
        await db.collection('categories').createIndex(
          { slug: 1 },
          { unique: true, sparse: true, name: 'slug_1_unique' }
        );
        console.log('   ✅ Created categories.slug index (unique, sparse)');
      } catch (error) {
        if (error.code === 85 || error.codeName === 'IndexOptionsConflict') {
          console.log('   ⚠️  Index already exists: categories.slug');
        } else {
          console.error('   ❌ Error creating categories.slug index:', error.message);
          throw error;
        }
      }
    } else {
      console.log('\n📁 Categories Collection:');
      console.log('   ⚠️  Collection does not exist (skipped)');
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('\n✅ Index creation completed!\n');
    
    // Verify indexes
    console.log('📋 Verifying indexes...\n');
    
    const productsIndexes = await db.collection('products').indexes();
    const slugIndex = productsIndexes.find(idx => idx.key && idx.key.slug === 1);
    
    if (slugIndex) {
      console.log('✅ Products.slug index verified:');
      console.log(`   Name: ${slugIndex.name}`);
      console.log(`   Unique: ${slugIndex.unique ? 'Yes' : 'No'}`);
      console.log(`   Sparse: ${slugIndex.sparse ? 'Yes' : 'No'}`);
    } else {
      console.log('❌ Products.slug index NOT found!');
    }
    
    if (collectionNames.includes('categories')) {
      const categoriesIndexes = await db.collection('categories').indexes();
      const catSlugIndex = categoriesIndexes.find(idx => idx.key && idx.key.slug === 1);
      
      if (catSlugIndex) {
        console.log('\n✅ Categories.slug index verified:');
        console.log(`   Name: ${catSlugIndex.name}`);
        console.log(`   Unique: ${catSlugIndex.unique ? 'Yes' : 'No'}`);
        console.log(`   Sparse: ${catSlugIndex.sparse ? 'Yes' : 'No'}`);
      } else {
        console.log('\n❌ Categories.slug index NOT found!');
      }
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
  createIndexes()
    .then(() => {
      console.log('\n✨ Script completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Script failed:', error);
      process.exit(1);
    });
}

module.exports = { createIndexes };

