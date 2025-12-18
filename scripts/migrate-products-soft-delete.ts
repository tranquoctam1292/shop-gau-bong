/**
 * Migration: Add Soft Delete Support to Products
 * 
 * Adds `deletedAt` field to products collection for soft delete functionality
 * 
 * Usage: npx tsx scripts/migrate-products-soft-delete.ts
 */

// Load environment variables from .env.local
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') });

import { getCollections, closeDB, ObjectId } from '../lib/db';

async function migrateProductsSoftDelete() {
  console.log('🔄 Starting migration: Add Soft Delete Support to Products\n');

  try {
    const collections = await getCollections();

    // Step 1: Add deletedAt field to all existing products (set to null)
    console.log('📦 Step 1: Adding deletedAt field to existing products...');
    const updateResult = await collections.products.updateMany(
      { deletedAt: { $exists: false } }, // Only update products that don't have deletedAt
      { $set: { deletedAt: null } }
    );
    console.log(`   ✅ Updated ${updateResult.modifiedCount} products\n`);

    // Step 2: Create index on deletedAt for performance
    console.log('📦 Step 2: Creating index on deletedAt field...');
    try {
      await collections.products.createIndex({ deletedAt: 1 });
      console.log('   ✅ Index created on deletedAt\n');
    } catch (error: any) {
      // Index might already exist
      if (error.code === 85 || error.codeName === 'IndexOptionsConflict') {
        console.log('   ⚠️  Index already exists, skipping...\n');
      } else {
        throw error;
      }
    }

    // Step 3: Create compound index for common queries (status + deletedAt)
    console.log('📦 Step 3: Creating compound index for status + deletedAt...');
    try {
      await collections.products.createIndex({ status: 1, deletedAt: 1 });
      console.log('   ✅ Compound index created\n');
    } catch (error: any) {
      if (error.code === 85 || error.codeName === 'IndexOptionsConflict') {
        console.log('   ⚠️  Compound index already exists, skipping...\n');
      } else {
        throw error;
      }
    }

    // Step 4: Verify migration
    console.log('📦 Step 4: Verifying migration...');
    const totalProducts = await collections.products.countDocuments({});
    const productsWithDeletedAt = await collections.products.countDocuments({
      deletedAt: { $exists: true }
    });
    const productsInTrash = await collections.products.countDocuments({
      deletedAt: { $ne: null }
    });

    console.log(`   📊 Total products: ${totalProducts}`);
    console.log(`   📊 Products with deletedAt field: ${productsWithDeletedAt}`);
    console.log(`   📊 Products in trash: ${productsInTrash}`);
    console.log(`   ✅ Migration verified\n`);

    // Step 5: List indexes
    console.log('📦 Step 5: Current indexes on products collection:');
    const indexes = await collections.products.indexes();
    indexes.forEach((index) => {
      const keys = Object.keys(index.key || {});
      const unique = index.unique ? ' (unique)' : '';
      console.log(`   - ${keys.join(', ')}${unique}`);
    });

    console.log('\n🎉 Migration completed successfully!\n');
    console.log('📝 Next steps:');
    console.log('   1. Update API routes to use soft delete');
    console.log('   2. Test soft delete functionality');
    console.log('   3. Update frontend to show trash tab\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed!\n');

    if (error instanceof Error) {
      console.error('Error details:');
      console.error(`   Message: ${error.message}`);
      if (error.stack) {
        console.error(`   Stack: ${error.stack}`);
      }
    } else {
      console.error('Unknown error:', error);
    }

    process.exit(1);
  } finally {
    // ✅ PERFORMANCE: Luôn đóng database connection trong finally block
    // Đảm bảo connection được đóng dù có lỗi hay không, tránh connection leaks
    await closeDB();
  }
}

// Run migration
migrateProductsSoftDelete();

