/**
 * MongoDB Index Creation Script for Quick Edit Performance Optimization
 * 
 * Task: 3.1.2 - Add indexes cho các queries phổ biến
 * 
 * Run: node scripts/create-mongodb-indexes.js
 * 
 * This script creates indexes for:
 * - products.slug (unique, sparse)
 * - categories.slug (unique, sparse)
 * - admin_users.tokenVersion (if needed)
 */

const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGODB_URL || 'mongodb://localhost:27017/shop-gau-bong';

async function createIndexes() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db();
    
    console.log('🔍 Creating indexes for Quick Edit performance optimization...\n');
    
    // 1. Products Collection - Slug Index
    try {
      await db.collection('products').createIndex(
        { slug: 1 },
        { unique: true, sparse: true, name: 'slug_1_unique' }
      );
      console.log('✅ Created index: products.slug');
    } catch (error) {
      if (error.code === 85 || error.codeName === 'IndexOptionsConflict') {
        console.log('⚠️  Index already exists: products.slug');
      } else {
        console.error('❌ Error creating products.slug index:', error.message);
        throw error;
      }
    }
    
    // 2. Categories Collection - Slug Index
    try {
      await db.collection('categories').createIndex(
        { slug: 1 },
        { unique: true, sparse: true, name: 'slug_1_unique' }
      );
      console.log('✅ Created index: categories.slug');
    } catch (error) {
      if (error.code === 85 || error.codeName === 'IndexOptionsConflict') {
        console.log('⚠️  Index already exists: categories.slug');
      } else {
        console.error('❌ Error creating categories.slug index:', error.message);
        throw error;
      }
    }
    
    // 3. Admin Users Collection - Token Version Index (optional)
    // Uncomment if query by tokenVersion is used in authMiddleware
    /*
    try {
      await db.collection('admin_users').createIndex(
        { tokenVersion: 1 },
        { name: 'tokenVersion_1' }
      );
      console.log('✅ Created index: admin_users.tokenVersion');
    } catch (error) {
      if (error.code === 85 || error.codeName === 'IndexOptionsConflict') {
        console.log('⚠️  Index already exists: admin_users.tokenVersion');
      } else {
        console.error('❌ Error creating admin_users.tokenVersion index:', error.message);
        throw error;
      }
    }
    */
    
    console.log('\n✅ Index creation completed!\n');
    
    // List all indexes for verification
    console.log('📋 Current indexes:');
    try {
      const productsIndexes = await db.collection('products').indexes();
      console.log('  Products:', productsIndexes.map(idx => idx.name).join(', '));
    } catch (error) {
      console.error('  ❌ Error listing products indexes:', error.message);
    }
    
    try {
      const categoriesIndexes = await db.collection('categories').indexes();
      console.log('  Categories:', categoriesIndexes.map(idx => idx.name).join(', '));
    } catch (error) {
      console.error('  ❌ Error listing categories indexes:', error.message);
    }
    
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

