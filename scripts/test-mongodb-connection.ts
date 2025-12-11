/**
 * Test MongoDB Connection Script
 * 
 * Usage: npx tsx scripts/test-mongodb-connection.ts
 * Or: npm run test:mongodb
 */

// Load environment variables from .env.local
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') });

import { connectDB, getCollections, closeDB } from '../lib/db';

async function testConnection() {
  console.log('🔍 Testing MongoDB connection...\n');

  try {
    // Check environment variable
    if (!process.env.MONGODB_URI) {
      console.error('❌ MONGODB_URI not found in environment variables');
      console.error('   Please add MONGODB_URI to .env.local');
      process.exit(1);
    }

    console.log('✅ MONGODB_URI found');
    console.log(`   Database: ${process.env.MONGODB_DB_NAME || 'shop-gau-bong'}\n`);

    // Test connection
    console.log('📡 Connecting to MongoDB...');
    const client = await connectDB();
    console.log('✅ Successfully connected to MongoDB!\n');

    // Test collections access
    console.log('📦 Testing collections access...');
    const collections = await getCollections();
    
    // Test each collection
    const collectionNames = [
      'products',
      'categories',
      'orders',
      'orderItems',
      'users',
      'banners',
    ];

    for (const name of collectionNames) {
      const collection = collections[name as keyof typeof collections];
      if (collection && 'collectionName' in collection) {
        console.log(`   ✅ Collection "${name}" accessible`);
      }
    }

    // Test database operations
    console.log('\n🔧 Testing database operations...');
    const { db } = collections;
    
    // List collections
    const existingCollections = await db.listCollections().toArray();
    console.log(`   ✅ Found ${existingCollections.length} existing collections`);
    
    if (existingCollections.length > 0) {
      console.log('   Collections:');
      existingCollections.forEach((col) => {
        console.log(`      - ${col.name}`);
      });
    }

    // Test ping
    await db.admin().ping();
    console.log('   ✅ Database ping successful\n');

    console.log('🎉 MongoDB connection test PASSED!\n');
    console.log('✅ All checks passed. Database is ready to use.');

    // Close connection
    await closeDB();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ MongoDB connection test FAILED!\n');
    
    if (error instanceof Error) {
      console.error('Error details:');
      console.error(`   Message: ${error.message}`);
      
      // Common error messages and solutions
      if (error.message.includes('authentication failed')) {
        console.error('\n💡 Solution: Check your MongoDB username and password in MONGODB_URI');
      } else if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
        console.error('\n💡 Solution: Check your MongoDB host/URL in MONGODB_URI');
      } else if (error.message.includes('timeout')) {
        console.error('\n💡 Solution: Check your network connection and MongoDB server status');
      } else if (error.message.includes('MONGODB_URI')) {
        console.error('\n💡 Solution: Add MONGODB_URI to .env.local file');
      }
    } else {
      console.error('Unknown error:', error);
    }

    await closeDB();
    process.exit(1);
  }
}

// Run test
testConnection();

